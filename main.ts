// Saltline Cover Studio — the program that hands the entry in.
//
// When the grader runs this file it builds /output (or whatever
// MAKEFUN_OUTPUT_DIR names) from the repository beside it: the whole
// app/ tree, the screenshots/ the maker took, and a dossier.json that
// the kit's library writes from those files. The program runs twice
// and both runs must write the same bytes, so there is no timestamp,
// no random id and no network here — only copies and one deterministic
// dossier build.
//
// The caps below are the scorer's own, taken from the competition's
// gate: the text budget, the screenshot count and size, and the app
// size limits. Only the text budget shapes what the dossier holds;
// the rest are the same numbers the gate checks, so a build that
// passes here passes there too.
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// Where the repository lives, and where the entry goes.
const here = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The gate's caps, in the exact keys buildDossier expects.
const gateCaps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

function handIn() {
  // A clean output directory, then the app tree and the screenshots.
  mkdirSync(outDir, { recursive: true });
  cpSync(join(here, 'app'), join(outDir, 'app'), { recursive: true });
  mkdirSync(join(outDir, 'screenshots'), { recursive: true });
  const shots = join(here, 'screenshots');
  if (existsSync(shots)) {
    cpSync(shots, join(outDir, 'screenshots'), { recursive: true });
  }
  // The dossier is built from the output directory itself, so what it
  // describes is exactly what was just copied — never the source tree.
  const dossier = buildDossier(outDir, gateCaps);
  writeFileSync(join(outDir, 'dossier.json'), dossier);
}

handIn();
