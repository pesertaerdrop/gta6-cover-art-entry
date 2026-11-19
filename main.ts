// main.ts — Afterglow Cover Studio, the entry program.
//
// What this entry is: an offline web app (app/) that turns any photo
// and caption into GTA 6-style cover art — multi-panel posters with
// bold Anton lettering, a neon script subtitle and a sunset or neon
// grade — and exports PNGs in 1080x1080, 1080x1350 and 1920x1080.
//
// How it is built, in one line each:
// - app/src/photos.js — the 14 image-model sample photos, uploads,
//   and the relative per-panel framing model with smart face framing.
// - app/src/grades.js — six gradient-map grades as 256-step LUTs over
//   luminance, after an auto-levels stretch; Raw Stock stays photoreal.
// - app/src/ink.js — Poster Ink: blur, posterize into bands keeping
//   hue, lift darks, halftone dots in shadows, Sobel ink lines, grain
//   and vignette, blended at a strength the editor dials.
// - app/src/layouts.js — seven layouts (nine-panel grid, hero and
//   three, full bleed, tilted snapshots, strip five, split duo, comic
//   strip) as relative panel rects, plus the mini-drawing picker tiles.
// - app/src/keyart.js — the title band's extras, all canvas-drawn: a
//   seeded skyline strip, a star pill, the EST. 2026 badge, a corner
//   ribbon and a starburst sticker.
// - app/src/lettering.js — gradient Anton title with outline and hard
//   shadow, neon Kaushan Script subtitle, Bebas Neue tagline bar.
// - app/src/render.js — the cover renderer: panels to an art canvas,
//   grade, ink, then the title band on top; every size renders
//   natively from the same relative state.
// - app/src/state.js — one cover, one 50-step undo/redo history;
//   hand-set crops survive layout changes.
// - app/src/main.js — the editor: three steps in the header, photo
//   tray, drag reframe, wheel zoom, presets, export all 3 sizes.
// - app/src/shots.js — the ?shot= scenes the screenshots are taken from.
//
// The program below only hands the entry in: it copies app/ and
// screenshots/ to /output and writes /output/dossier.json with
// buildDossier from vendor/makefun-app.ts. It runs twice and both
// runs must write the same bytes; everything it copies is a plain
// file, so the output is deterministic.

import { cp, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { buildDossier } from "./vendor/makefun-app.ts";

const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
const repoRoot = new URL(".", import.meta.url).pathname;

await mkdir(outDir, { recursive: true });
await cp(join(repoRoot, "app"), join(outDir, "app"), { recursive: true });
await cp(join(repoRoot, "screenshots"), join(outDir, "screenshots"), { recursive: true });

const dossier = buildDossier(outDir, {
  // The scorer's own caps (reference/gate.json): only text_max_bytes
  // shapes the bytes; the others refuse an entry the scorer would
  // refuse (more than 4 screenshots or one over 256 KiB; more than
  // 993 files in app/ or 48 MiB of app files, or a path under app/
  // over 1000 bytes).
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
await writeFile(join(outDir, "dossier.json"), dossier);
