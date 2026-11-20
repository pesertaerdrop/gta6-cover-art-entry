// shots.js — the four screenshots, defined as data so the screenshot
// runner and the app agree on exactly what each shot shows. `?shot=<id>`
// renders one scene directly: cover (the Afterglow preset at the wide
// size), editor (the app chrome itself, with a photo loaded), portrait
// (the Night Market preset at the portrait size — Strip Five of the hero
// duo, the shot that carries the whole-face guarantee), grid (the Motor
// Mile preset, square). `window.__shotReady` is set once the scene is
// painted, so the runner never has to guess when to capture.

import { loadSamples } from './photos.js';
import { createState, assignPhotos } from './state.js';
import { renderToCanvas, EXPORT_SIZES } from './render.js';
import { applyPreset, presetById } from './presets.js';

export const SHOTS = [
  {
    id: 'cover',
    preset: 'afterglow',
    size: 'wide',
    width: 1280,
    height: 720,
    title: 'Afterglow cover, wide',
  },
  {
    id: 'editor',
    preset: 'afterglow',
    size: 'wide',
    width: 1280,
    height: 720,
    title: 'Editor with a photo loaded',
  },
  {
    id: 'portrait',
    preset: 'nightmarket',
    size: 'portrait',
    width: 1024,
    height: 1280,
    title: 'Night Market cover, portrait',
  },
  {
    id: 'grid',
    preset: 'motormile',
    size: 'square',
    width: 1080,
    height: 1080,
    title: 'Motor Mile grid, square',
  },
];

// Build the state for one shot: the preset's layout, grade, ink and
// copy, with the library's photos assigned round-robin. For the
// portrait shot the lead photo is the hero duo, so Strip Five slices
// the two faces — the whole-face guarantee, on display.
export async function buildShotState(shot) {
  const library = await loadSamples();
  const state = createState();
  const preset = presetById(shot.preset);
  applyPreset(state, preset.id);
  if (shot.id === 'portrait') {
    state.leadPhotoId = 'hero-duo';
  }
  assignPhotos(state, library);
  return { state, library };
}

// Render one shot's cover to a canvas at the shot's pixel size. The
// cover is rendered at its full export size first, then scaled to the
// screenshot size, so the shot shows exactly what an export shows.
export async function renderShot(shot) {
  const { state, library } = await buildShotState(shot);
  const size = EXPORT_SIZES.find((s) => s.id === shot.size);
  const canvas = renderToCanvas(size.w, size.h, state, library);
  const out = document.createElement('canvas');
  out.width = shot.width;
  out.height = shot.height;
  const ctx = out.getContext('2d');
  ctx.drawImage(canvas, 0, 0, shot.width, shot.height);
  return out;
}
