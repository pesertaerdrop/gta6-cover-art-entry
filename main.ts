// Saltline Cover Studio — a GTA-style cover art maker for gta6-cover-art-01.
//
// The app (app/) turns any photo and a caption into a multi-panel poster:
// seven layouts with live mini-drawings, six gradient-map grades, six chrome
// title styles plus Auto, seven look sliders with draft-mode regrading, a
// panel inspector with numbered badges and face marks, and a seven-element
// poster finish on every cover (callout tags, seal, volume tag, five-star
// review bar, billing block, generated barcode, coming soon). Seventeen
// image-model sample photos follow one invented cast — Mira and Suki, a
// Vice City duo — so the callouts tell one story across three different
// covers. Exports are PNGs in 1080x1080, 1080x1350 and 1920x1080, offline.
//
// This program (Node 22, standard library only) hands the app in: it copies
// app/ and screenshots/ from beside this file to /output and writes
// /output/dossier.json with the vendored make.fun library, exactly as the
// kit starter does. Outside the grader, MAKEFUN_OUTPUT_DIR stands in for
// /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes
// the bytes; the others refuse an entry the scorer would refuse (more than
// 4 screenshots or one over 256 KiB; more than 993 files in app/ or 48 MiB
// of app files, in all, or a path under app/ over 1000 bytes: app/ counts
// beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
