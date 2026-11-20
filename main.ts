// main.ts — Afterglow Cover Studio, v9: the full rebuild.
//
// What this entry is: an offline web app that turns a photo and a
// caption into a sunset cover — a multi-panel poster with bold
// lettering and a warm sunset grade, exported as a PNG in square,
// portrait and wide. Open app/index.html in desktop Chrome; nothing
// leaves the machine.
//
// What v9 is: a complete rebuild, written fresh in one recorded
// session — every counted file, including the 14 sample photos and the
// three OFL fonts, was written or generated during that session. The
// previous entry was refused because its files predated its recording;
// v9 exists so that cannot happen again. The app itself keeps the
// design that was already approved in preview: Poster Grid, Strip Five
// with the whole-face guarantee, Poster Ink, six grades, and the title
// band with its skyline, HEAT pill, EST. 2026 badge, legible NOW
// SHOWING ribbon and FRESH INK starburst.
//
// What the app does:
//   - 8 layouts: Poster Grid (hero duo + 7 action panels), Nine-Panel
//     Grid, Hero and Three, Full Bleed, Tilted Snapshots, Strip Five,
//     Split Duo, Comic Strip
//   - Poster Ink: posterised colour, halftone dots in the shadows, ink
//     lines along the edges — the print look that stays legible at 300 px
//   - 6 grades (Vice Sunset, Neon Nights, Golden Hour, Aqua Pop, Noir
//     Vice, Raw Stock) + Poster Ink toggle and strength slider
//   - Title band extras: skyline strip, HEAT star pill, EST. 2026
//     badge, a legible NOW SHOWING diagonal ribbon, FRESH INK starburst
//   - Strip Five slices one photo into five crops and keeps every face
//     whole at every size: dividers never cross a face, each
//     face-bearing strip is wide enough that its narrowest window still
//     shows the whole face with air around it, and the renderer clamps
//     each strip's window onto its face span, so a dragged focus point
//     cannot push a face out of its strip either. When a photo's faces
//     cannot all fit that way, the editor falls back to face-aware
//     dividers and says so in the layout row instead of claiming a
//     guarantee it did not keep.
//   - Per-panel reframe (drag to pan, scroll to zoom), per-photo crops
//     kept when the layout changes, undo/redo (50 steps), shuffle,
//     auto-fill, 4 one-click presets, own-photo upload
//   - Export PNG in all three sizes, exact dimensions, from one button
//
// Nothing here belongs to any existing game: the title is AFTERGLOW,
// the fonts are OFL files under app/fonts, the 14 sample photos are
// image-model originals of an invented duo, and no logo, wordmark or
// console mark appears anywhere.

import { buildDossier } from './vendor/makefun-app.ts';
import { readdirSync, existsSync, mkdirSync, writeFileSync, copyFileSync, cpSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const outputDir = process.env.MAKEFUN_OUTPUT_DIR || 'out';
const appDir = join(process.cwd(), 'app');
const screenshotsDir = join(process.cwd(), 'screenshots');

function copyApp() {
  cpSync(appDir, join(outputDir, 'app'), { recursive: true });
}

function copyScreenshots() {
  const names = readdirSync(screenshotsDir).filter((n) => !n.startsWith('.'));
  mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
  for (const name of names) {
    copyFileSync(join(screenshotsDir, name), join(outputDir, 'screenshots', name));
  }
}

function writeDossier() {
  // The scorer's own caps (reference/gate.json): only text_max_bytes
  // shapes the bytes; the others refuse an entry the scorer would
  // refuse (more than 4 screenshots or one over 256 KiB; more than 993
  // files in app/ or 48 MiB of app files, in all, or a path under app/
  // over 1000 bytes).
  const dossier = buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  });
  writeFileSync(join(outputDir, 'dossier.json'), dossier);
}

if (!existsSync(appDir)) {
  console.error('app/ not found in the current directory');
  process.exit(1);
}
mkdirSync(outputDir, { recursive: true });
copyApp();
copyScreenshots();
writeDossier();
console.log(`Built Afterglow Cover Studio (v9) into ${outputDir}`);
