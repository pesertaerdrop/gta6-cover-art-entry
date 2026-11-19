// Neon Coast Cover Studio — the entry program for gta6-cover-art-01.
//
// Node 22, standard library only. It hands the app in: it copies the
// static app/ folder and the screenshots/ folder next to this file into the
// output directory, then writes the dossier the judge reads, using the
// vendored make.fun library (vendor/makefun-app.ts, unchanged from the kit).
//
// Run it outside the grader with MAKEFUN_OUTPUT_DIR set:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// The grader runs it twice into /output; both runs must write the same bytes.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// This file's own folder is the repository root; the grader mounts it
// read-only at /bot and gives us a writable /output (or the env var).
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The gate's caps for this competition: the app is at most 993 files and
// 48 MiB, the dossier text at most 160 KiB, and at most 4 screenshots of at
// most 256 KiB each. The same numbers guard the build here, so a local run
// refuses exactly what the sealed scorer would refuse.
const GATE = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

function handIn() {
  mkdirSync(outputDir, { recursive: true });
  cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
  mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
  if (existsSync(join(repoRoot, 'screenshots'))) {
    cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
  }
  writeFileSync(join(outputDir, 'dossier.json'), buildDossier(outputDir, GATE));
}

handIn();
