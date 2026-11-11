// Shared helpers for record.mjs and perf.mjs: a static file server for the repository and a Chromium finder.
import http from 'node:http';
import os from 'node:os';
import { readFile } from 'node:fs/promises';
import { existsSync, readdirSync } from 'node:fs';
import { dirname, extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml',
};

/** Serve ROOT on a free localhost port. Resolves to { url, close }. */
export function serve() {
  return new Promise(resolve => {
    const server = http.createServer(async (req, res) => {
      try {
        const rel = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^[\\/]+/, '');
        const file = join(ROOT, rel || 'index.html');
        if (!file.startsWith(ROOT + sep) && file !== ROOT) throw new Error('outside root');
        const body = await readFile(file);
        res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
        res.end(body);
      } catch {
        res.writeHead(404);
        res.end();
      }
    });
    server.listen(0, '127.0.0.1', () => resolve({ url: `http://127.0.0.1:${server.address().port}`, close: () => server.close() }));
  });
}

/** A Chromium build: $CHROMIUM_PATH, else the newest one in the Playwright browser cache. */
export function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const base = process.platform === 'win32' ? join(process.env.LOCALAPPDATA || '', 'ms-playwright')
    : process.platform === 'darwin' ? join(os.homedir(), 'Library', 'Caches', 'ms-playwright')
      : join(os.homedir(), '.cache', 'ms-playwright');
  if (!existsSync(base)) return undefined;
  const builds = readdirSync(base).filter(d => /^chromium-\d+$/.test(d)).sort((a, b) => b.split('-')[1] - a.split('-')[1]);
  const exes = ['chrome-win64/chrome.exe', 'chrome-win/chrome.exe', 'chrome-linux64/chrome', 'chrome-linux/chrome',
    'chrome-mac/Chromium.app/Contents/MacOS/Chromium', 'chrome-mac-arm64/Chromium.app/Contents/MacOS/Chromium'];
  for (const b of builds) for (const e of exes) { const f = join(base, b, e); if (existsSync(f)) return f; }
  return undefined;
}

// Ask for the hardware GPU even in headless mode; Chromium falls back to software rendering if it cannot.
export const GPU_ARGS = ['--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'];
