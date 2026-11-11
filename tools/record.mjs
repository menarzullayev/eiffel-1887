// Record the full museum playthrough to out/playthrough.webm (+ .mp4 and a contact sheet when ffmpeg is on PATH),
// and log when each chapter starts. Use the video to tune timing, camera moves and framing.
//   node tools/record.mjs            1280x720
//   node tools/record.mjs 390x844    phone size
import { chromium } from 'playwright-core';
import { mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { GPU_ARGS, ROOT, findChromium, serve } from './lib.mjs';

const [w, h] = (process.argv[2] || '1280x720').split('x').map(Number);
const OUT = join(ROOT, 'out');
mkdirSync(OUT, { recursive: true });

const { url, close } = await serve();
const browser = await chromium.launch({ executablePath: findChromium(), args: GPU_ARGS });
const context = await browser.newContext({ viewport: { width: w, height: h }, recordVideo: { dir: OUT, size: { width: w, height: h } } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
const t0 = Date.now();
await page.goto(`${url}/index.html#autoplay`);
const chapters = [];
let last = '';
for (;;) {
  const st = await page.evaluate(() => window.__eiffel && window.__eiffel.state()).catch(() => null);
  if (st && st.chapter && st.chapter !== last) { last = st.chapter; chapters.push({ chapter: st.chapter, at_s: +((Date.now() - t0) / 1000).toFixed(1), date: st.date }); }
  if (st && st.finished) break;
  if (Date.now() - t0 > 300000) throw new Error('playthrough did not finish within 5 minutes');
  await page.waitForTimeout(400);
}
await page.waitForTimeout(3500); // the camera flies back to the opening view
const total = +((Date.now() - t0) / 1000).toFixed(1);
const video = page.video();
await context.close();
const tag = `${w}x${h}`;
const webm = join(OUT, `playthrough-${tag}.webm`);
renameSync(await video.path(), webm);
await browser.close();
close();

writeFileSync(join(OUT, `playthrough-${tag}.json`), JSON.stringify({ total_s: total, chapters, errors }, null, 1));
const ff = spawnSync('ffmpeg', ['-version']);
if (ff.status === 0) {
  spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', webm, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '24', join(OUT, `playthrough-${tag}.mp4`)]);
  spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', webm, '-vf', 'fps=1/5,scale=320:-1,tile=5x5', '-frames:v', '1', join(OUT, `playthrough-${tag}-sheet.jpg`)]);
}
console.log(JSON.stringify({ video: webm, total_s: total, chapters: chapters.length, errors: errors.length }, null, 1));
if (errors.length) process.exitCode = 1;
