// Measure load and frame rate in a real browser and write out/perf.json.
//   node tools/perf.mjs          this machine's GPU
//   node tools/perf.mjs --low    a weak device: software WebGL (SwiftShader), CPU slowed 4x, phone viewport
// Reports: time to the first rendered frame, bytes loaded, FPS while idle and while the playthrough runs,
// draw calls / triangles per frame, and which WebGL renderer was used (hardware or software).
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { GPU_ARGS, ROOT, findChromium, serve } from './lib.mjs';

const LOW = process.argv.includes('--low');
// --page other.html measures another build of the page (for A/B comparisons); it must sit in the repository root
const PAGE = process.argv.includes('--page') ? process.argv[process.argv.indexOf('--page') + 1] : 'index.html';
const VIEWPORT = LOW ? { width: 390, height: 844 } : { width: 1440, height: 880 };
const OUT = join(ROOT, 'out');
mkdirSync(OUT, { recursive: true });
const { url, close } = await serve();
const browser = await chromium.launch({ executablePath: findChromium(), args: LOW ? ['--disable-gpu', '--enable-unsafe-swiftshader'] : GPU_ARGS });
const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: LOW ? 2 : 1 });
if (LOW) await (await page.context().newCDPSession(page)).send('Emulation.setCPUThrottlingRate', { rate: 4 });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));

await page.goto(`${url}/${PAGE}`);
await page.waitForFunction(() => document.documentElement.dataset.ready === '1', null, { timeout: 60000 });
const load = await page.evaluate(() => {
  const nav = performance.getEntriesByType('navigation')[0];
  const first = performance.getEntriesByName('eiffel-first-frame')[0];
  const res = performance.getEntriesByType('resource');
  const gl = document.createElement('canvas').getContext('webgl2');
  const dbg = gl && gl.getExtension('WEBGL_debug_renderer_info');
  return {
    first_frame_ms: Math.round(first.startTime),
    dom_content_loaded_ms: Math.round(nav.domContentLoadedEventEnd),
    requests: res.length + 1,
    transfer_kb: Math.round((res.reduce((s, r) => s + (r.transferSize || r.encodedBodySize || 0), 0) + (nav.transferSize || 0)) / 1024),
    webgl_renderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'unknown',
  };
});
const fps = ms => page.evaluate(ms => new Promise(r => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < ms) requestAnimationFrame(f); else r(+(n * 1000 / (performance.now() - t0)).toFixed(1)); }; requestAnimationFrame(f); }), ms);
await page.waitForTimeout(1500);
const idle = { fps: await fps(5000), ...(await page.evaluate(() => window.__eiffel.info())) };
await page.evaluate(() => window.__eiffel.startTour());
await page.waitForTimeout(16000);
const playing = { fps: await fps(8000), ...(await page.evaluate(() => window.__eiffel.info())), chapter: (await page.evaluate(() => window.__eiffel.state())).chapter };
const heap = await page.evaluate(() => (performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null));
await browser.close();
close();

const report = { measured_at: new Date().toISOString(), page: PAGE, profile: LOW ? 'low' : 'gpu', viewport: `${VIEWPORT.width}x${VIEWPORT.height}`, load, idle, playing, js_heap_mb: heap, errors };
const stem = `perf${LOW ? '-low' : ''}${PAGE === 'index.html' ? '' : `-${PAGE.replace(/\.html$/, '')}`}`;
writeFileSync(join(OUT, `${stem}.json`), JSON.stringify(report, null, 1));
console.log(JSON.stringify(report, null, 1));
if (errors.length) process.exitCode = 1;
