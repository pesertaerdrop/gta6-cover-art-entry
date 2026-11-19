// Neon Coast Cover Studio — the hand-in program for gta6-cover-art-01.
//
// This program takes the app this repository built (the static cover maker
// under app/, plus the screenshots it produced under screenshots/) and
// hands both to the grader: it copies them into the output directory and
// writes /output/dossier.json there with the make.fun library vendored at
// vendor/makefun-app.ts. Node 22, standard library only, no network.
//
// Try it locally first: `node serve.ts`, open http://localhost:8080, make
// a cover, then run the program with an output directory of your own:
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

// The caps come from the competition's gate (reference/gate.json): the
// dossier text is capped at 160 KiB, at most 4 screenshots of at most
// 256 KiB each, and app/ stays under 993 files and 48 MiB in all.
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
