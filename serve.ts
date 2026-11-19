// Serves the app/ folder on http://localhost:8080 so the cover maker can
// be tried in desktop Chrome. Static files only, no build step, nothing
// leaves the machine. Run with `node serve.ts` from this repository root.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), 'app');
const port = Number(process.env.PORT ?? 8080);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
};

const server = createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
    const safe = normalize(join(root, path)).replace(/\\/g, '/');
    if (!safe.startsWith(root.replace(/\\/g, '/') + sep) && safe !== root.replace(/\\/g, '/')) {
      res.writeHead(403);
      res.end('forbidden');
      return;
    }
    const file = safe.endsWith(sep) ? join(safe, 'index.html') : safe;
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': mimeTypes[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Neon Coast Cover Studio at http://localhost:${port}`);
});
