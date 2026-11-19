// Afterglow Cover Studio — a gta6-cover-art-01 entry (Node 22, stdlib only).
//
// The app is app/: plain static files a desktop browser loads offline.
// Open app/index.html and it turns a photo (or one of the 14 included
// image-model samples) into a bold multi-panel poster cover: pick a
// layout, pick a grade, tune Poster Ink, write a title, export PNGs in
// square 1080x1080, portrait 1080x1350 and wide 1920x1080.
//
// The signature layout is Poster Grid: one large central hero panel —
// an original duo portrait against a sunset skyline — ringed by seven
// smaller action panels (police chase, airboat and alligator, boat
// party, convertible duo, yacht under a blimp, dirt-bike jump,
// drawbridge and speedboat), the way a comic-book movie poster stacks
// its scenes around its stars. The other seven layouts stay: a
// nine-panel grid, hero and three, full bleed, tilted snapshots,
// Strip Five (one photo, five crops), split duo and a comic strip.
//
// Strip Five is face-aware in this version. The old equal split cut the
// hero duo's faces with its gutters; now each sample photo carries the
// horizontal span of its faces (photos.js), faces.js computes divider
// positions that never cross a face, and each strip is a true slice of
// the photo that keeps its face whole (render.js sliceWindow). The
// dividers are computed from face data for any photo — nothing is
// hard-coded to one portrait — and uploads without face data fall back
// to equal strips.
//
// Poster Ink is the house effect, written here from scratch: it
// posterizes each photo into flat ink bands, dots halftone into the
// shadows, draws Sobel ink lines along the edges, and finishes with
// seeded grain and a vignette, so every cover reads as a printed
// poster even at 300 pixels wide. A slider sets its strength; a toggle
// turns it off for the Raw Stock photoreal grade. Six grades in all:
// Vice Sunset, Neon Nights, Golden Hour, Aqua Pop, Noir Vice and
// Raw Stock.
//
// The title band carries the rest of the poster furniture: a skyline
// strip, a big gradient Anton title with a Kaushan Script subtitle in
// its own clear zone, a HEAT star pill, an EST. 2026 badge, a FRESH
// INK starburst and a legible NOW SHOWING diagonal ribbon. Lettering
// is editable in the editor; undo and redo keep 50 steps; crops are
// stored per photo, so changing layouts never loses a careful frame.
//
// All artwork is original: the 14 sample photos were made for this
// entry with an image model (no photo of a real person), the fonts are
// OFL files under app/fonts, and the only marks on the covers are the
// studio's own "AG". No logo, wordmark or artwork of any existing
// game appears anywhere in the app.
//
// Build it: serve it locally with `node serve.ts`, then open
// http://localhost:8080. Outside the grader's container,
// MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in app/ or 48 MiB of app
// files, in all, or a path under app/ over 1000 bytes: app/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
