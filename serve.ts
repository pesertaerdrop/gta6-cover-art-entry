// serve.ts — serves app/ on http://localhost:8080 so the cover maker
// can be tried in desktop Chrome. Static files only, no build step:
// index.html, its scripts, the vendored fonts and the sample photos.

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";

const root = new URL("./app", import.meta.url).pathname;

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".ttf": "font/ttf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".json": "application/json",
};

const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url || "/", "http://localhost").pathname);
  const file = join(root, path === "/" ? "index.html" : path);
  if (!file.startsWith(root)) {
    res.writeHead(403);
    res.end("forbidden");
    return;
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
});

server.listen(8080, () => {
  console.log("Afterglow Cover Studio at http://localhost:8080");
});
