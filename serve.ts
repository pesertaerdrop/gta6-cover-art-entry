// serve.ts — a static file server for trying the cover maker in
// desktop Chrome: http://localhost:8080. No build step, no bundler —
// it serves index.html, its scripts, the vendored fonts and the
// sample photos straight from app/.

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";

const appRoot = new URL("./app", import.meta.url).pathname;

const TYPES: Record<string, string> = {
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

// Map a request path to a file under app/, or null when it escapes.
function resolveFile(pathname) {
  const file = join(appRoot, pathname === "/" ? "index.html" : pathname);
  return file.startsWith(appRoot) ? file : null;
}

async function sendFile(res, file) {
  try {
    const body = await readFile(file);
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", "http://localhost");
  const file = resolveFile(decodeURIComponent(url.pathname));
  if (!file) {
    res.writeHead(403);
    res.end("forbidden");
    return;
  }
  await sendFile(res, file);
});

server.listen(8080, () => {
  console.log("Afterglow Cover Studio at http://localhost:8080");
});
