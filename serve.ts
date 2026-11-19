// serve.ts — a static file server for trying the cover maker in
// desktop Chrome: http://localhost:8080. No build step, no bundler —
// it serves index.html, its scripts, the vendored fonts and the
// sample photos straight from app/.

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";

// The app directory, next to this file.
const appDir = new URL("./app", import.meta.url).pathname;

// Content types by extension; anything unknown is a generic binary.
const MIME: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".ttf": "font/ttf",
};

// Map a request path to a file under app/. A path that escapes the
// app directory (../ and friends) maps to null and is refused.
function mapToFile(pathname) {
  const target = join(appDir, pathname === "/" ? "index.html" : pathname);
  return target.startsWith(appDir) ? target : null;
}

// Send one file, or 404 when it is not there.
async function serveFile(res, target) {
  try {
    const bytes = await readFile(target);
    res.writeHead(200, { "content-type": MIME[extname(target)] || "application/octet-stream" });
    res.end(bytes);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
}

const server = createServer(async (req, res) => {
  const parsed = new URL(req.url || "/", "http://localhost");
  const target = mapToFile(decodeURIComponent(parsed.pathname));
  if (!target) {
    res.writeHead(403);
    res.end("forbidden");
    return;
  }
  await serveFile(res, target);
});

server.listen(8080, () => {
  console.log("Afterglow Cover Studio at http://localhost:8080");
});
