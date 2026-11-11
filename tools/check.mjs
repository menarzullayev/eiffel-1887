// Layout and behaviour checks in a real browser; exits with code 1 if any check fails.
//   node tools/check.mjs              all checks (desktop and phone sizes, every chapter of the playthrough)
//   node tools/check.mjs --self-test  negative tests: each assertion must reject a known-bad case
// The chapter checks run with prefers-reduced-motion so phases are short; layout at each stop is the same.
import { chromium } from 'playwright-core';
import { GPU_ARGS, findChromium, serve } from './lib.mjs';

const SLACK = 2; // px of rounding we tolerate
const inside = (r, b) => r.left >= b.left - SLACK && r.top >= b.top - SLACK && r.right <= b.right + SLACK && r.bottom <= b.bottom + SLACK;
const overlap = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
const pointIn = (p, b) => p.x >= b.left - SLACK && p.x <= b.right + SLACK && p.y >= b.top - SLACK && p.y <= b.bottom + SLACK;
const SIZES = [
  { name: 'desktop 1440x900', viewport: { width: 1440, height: 900 } },
  { name: 'desktop 1280x720', viewport: { width: 1280, height: 720 } },
  { name: 'phone 390x844', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { name: 'phone 320x568', viewport: { width: 320, height: 568 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
];

const failures = [];
let passed = 0;
function expect(ok, what) { if (ok) passed++; else failures.push(what); }

const { url, close } = await serve();
const browser = await chromium.launch({ executablePath: findChromium(), args: GPU_ARGS });

async function open(size, hash = '', motion = 'reduce') {
  const ctx = await browser.newContext({ ...size, reducedMotion: motion });
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', e => page.errors.push(String(e)));
  await page.goto(`${url}/index.html${hash}`);
  await page.waitForFunction(() => document.documentElement.dataset.ready === '1', null, { timeout: 60000 });
  return page;
}
const rect = (page, sel) => page.evaluate(s => { const el = document.querySelector(s); if (!el || el.closest('[hidden]')) return null; const r = el.getBoundingClientRect(); return r.width ? { left: r.left, top: r.top, right: r.right, bottom: r.bottom } : null; }, sel);
const state = page => page.evaluate(() => window.__eiffel.state());

// Where the model may appear: the canvas, minus the card at the bottom on phones / the label on the left on desktops.
async function freeArea(page, card) {
  const vp = page.viewportSize(), c = await rect(page, card), wide = vp.width > 760;
  const a = { left: 0, top: 0, right: vp.width, bottom: vp.height };
  if (c && wide) a.left = c.right; else if (c) a.bottom = c.top;
  return a;
}
async function towerTopVisible(page, card) {
  const st = await state(page);
  if (st.height < 1) return true;
  const p = await page.evaluate(h => window.__eiffel.project(0, h, 0), st.height);
  return pointIn(p, await freeArea(page, card));
}
async function settle(page, ms = 1200) { await page.waitForFunction(() => !window.__eiffel.state().camMoving, null, { timeout: 20000 }); await page.waitForTimeout(ms); }

if (process.argv.includes('--self-test')) {
  const box = { left: 0, top: 0, right: 100, bottom: 100 };
  expect(!inside({ left: 10, top: -20, right: 50, bottom: 50 }, box), 'inside() must reject a frame cut at the top');
  expect(!inside({ left: 10, top: 10, right: 130, bottom: 50 }, box), 'inside() must reject a frame past the right edge');
  expect(inside({ left: 10, top: 10, right: 90, bottom: 90 }, box), 'inside() must accept a frame within');
  expect(overlap({ left: 0, top: 0, right: 50, bottom: 50 }, { left: 40, top: 40, right: 90, bottom: 90 }) > 0, 'overlap() must see intersecting boxes');
  expect(overlap({ left: 0, top: 0, right: 50, bottom: 50 }, { left: 60, top: 0, right: 90, bottom: 50 }) === 0, 'overlap() must be 0 for separate boxes');
  // end to end: from the close Durandelle viewpoint the finished tower's top is off screen, so the check must fail
  const page = await open(SIZES[0], '#research');
  await page.evaluate(() => { window.__eiffel.setDate('1889-05-15'); window.__eiffel.view('durandelle'); });
  await page.waitForTimeout(400);
  expect(!(await towerTopVisible(page, '#dossier')), 'towerTopVisible() must fail when the top is cut off');
  await page.context().close();
} else {
  for (const size of SIZES) {
    const tag = size.name;
    const page = await open(size);
    const vp = page.viewportSize();
    const screen = { left: 0, top: 0, right: vp.width, bottom: vp.height };
    await settle(page, 1500);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${tag}: no horizontal scroll`);
    for (const b of ['#explore', '#to-research']) expect(inside(await rect(page, b) || { left: -1, top: -1, right: 1e5, bottom: 1e5 }, screen), `${tag}: intro button ${b} fully on screen`);
    expect(await towerTopVisible(page, '#intro'), `${tag}: intro shows the top of the tower`);

    await page.focus('#explore');
    await page.keyboard.press('Enter');
    expect(await page.evaluate(() => document.activeElement && document.activeElement.id) === 'c-next', `${tag}: focus moves to "Keyingisi" when the tour starts`);
    const seen = new Set();
    for (let guard = 0; guard < 400 && seen.size < 10; guard++) {
      const st = await state(page);
      if (st.finished) break;
      const stop = ['hold', 'plate', 'dwell', 'orbit'].includes(st.phase) && !st.camMoving;
      if (!stop || seen.has(st.chapter)) { await page.waitForTimeout(80); continue; }
      seen.add(st.chapter);
      await page.waitForTimeout(500);
      const ch = st.chapter, cap = await rect(page, '#caption');
      expect(cap && inside(cap, screen), `${tag} ${ch}: wall label on screen`);
      const photo = await rect(page, '#ovcrop');
      if (photo && st.phase === 'hold') expect(inside(photo, await freeArea(page, '#caption')) && photo.top >= 30, `${tag} ${ch}: framed photo inside the free area`);
      const plate = await page.evaluate(() => document.getElementById('mplate').classList.contains('on'));
      if (plate) { const m = await rect(page, '#mplate'); expect(m && overlap(m, cap) === 0 && inside(m, screen), `${tag} ${ch}: print clear of the label and on screen`); }
      expect(await towerTopVisible(page, '#caption'), `${tag} ${ch}: top of the tower visible`);
    }
    expect(seen.size === 10, `${tag}: all 10 chapters reached (${seen.size})`);
    await page.waitForFunction(() => window.__eiffel.state().finished, null, { timeout: 30000 });
    expect(await page.evaluate(() => document.activeElement && document.activeElement.id) === 'replay', `${tag}: focus moves to "Qayta ko‘rish" at the end`);
    await settle(page, 1500);
    expect(await towerTopVisible(page, '#ending'), `${tag}: ending shows the top of the tower`);
    expect(page.errors.length === 0, `${tag}: no page errors (${page.errors.join(' | ')})`);
    await page.context().close();
  }

  // behaviour, desktop, normal motion
  const page = await open(SIZES[0], '', 'no-preference');
  await page.evaluate(() => window.__eiffel.startTour());
  await page.keyboard.press('Escape');
  expect((await state(page)).finished, 'Escape ends the playthrough');
  await page.click('#replay');
  await page.waitForFunction(() => window.__eiffel.state().chapter === 'design');
  await page.click('#c-pause');
  await page.waitForTimeout(2500);
  await page.click('#c-next');          // now in 'down', paused
  await page.click('#c-pause');         // resume
  const t0 = Date.now();
  await page.waitForFunction(() => window.__eiffel.state().phase !== 'go', null, { timeout: 20000 });
  const goMs = Date.now() - t0;
  expect(goMs < 6500 + 1200, `after Pause → Next → Resume the chapter runs its normal length (${goMs} ms, expected ≈6500)`);
  await page.evaluate(() => { location.hash = 'autoplay'; });
  await page.waitForTimeout(500);
  await page.evaluate(() => { location.hash = 'research'; });
  await page.waitForTimeout(500);
  const rs = await state(page);
  const tourAttr = await page.evaluate(() => document.documentElement.dataset.tour);
  expect(rs.mode === 'research' && rs.phase === '' && tourAttr === undefined, `switching to research clears the playthrough state (phase "${rs.phase}", data-tour ${tourAttr})`);
  expect(page.errors.length === 0, `behaviour: no page errors (${page.errors.join(' | ')})`);
  await page.context().close();
}

await browser.close();
close();
for (const f of failures) console.log(`FAIL  ${f}`);
console.log(`${passed} passed, ${failures.length} failed`);
process.exitCode = failures.length ? 1 : 0;
