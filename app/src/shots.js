// shots.js — the ?shot= scenes the screenshots are taken from. A scene
// names a preset and a mode: 'canvas' draws one cover full-bleed at the
// viewport size (the exported covers), 'editor' shows the full editor
// with samples loaded (the app at work). Scenes never edit the files;
// they only set the state the page opens with.

import { applyPreset, presetById } from './presets.js';

export const SHOT_SCENES = {
  cover: { preset: 'afterglow', mode: 'canvas', note: 'Wide exported cover' },
  editor: { preset: 'afterglow', mode: 'editor', note: 'Editor with a photo loaded' },
  portrait: { preset: 'nightmarket', mode: 'canvas', note: 'Portrait exported cover', leadPhotoId: 'hero-duo' },
  grid: { preset: 'motormile', mode: 'canvas', note: 'Nine-panel exported cover' },
};

// The scene name from the page URL (?shot=cover), or null.
export function shotFromUrl() {
  const q = new URLSearchParams(window.location.search);
  const name = q.get('shot');
  return name && SHOT_SCENES[name] ? name : null;
}

// Set a state up for a shot scene and return the scene. Photos are
// assigned by the caller afterwards, in library order.
export function applyShotScene(state, shotName) {
  const scene = SHOT_SCENES[shotName];
  if (!scene) return null;
  applyPreset(state, presetById(scene.preset));
  if (scene.leadPhotoId) state.leadPhotoId = scene.leadPhotoId;
  state.ink.on = true;
  return scene;
}
