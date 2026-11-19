// state.js — the editor's state: one cover, one history.
// A cover is { layout, grade, inkOn, inkStrength, title, subtitle,
// tagline, badge, size, frames, extras }. Frames are per panel slot;
// hand-set crops survive a layout change because framing is stored
// per photo and re-applied when that photo lands in a slot.

import { layoutById, framesForLayout } from "./layouts.js";
import { dealPhotos, smartFrame } from "./photos.js";

export const DEFAULT_COVER = {
  layout: "nine",
  grade: "vice",
  inkOn: true,
  inkStrength: 0.7,
  title: "AFTERGLOW",
  subtitle: "one last sunset",
  tagline: "ONE NIGHT ON THE COAST",
  badge: "EST. 2026",
  size: "square",
  extras: { skyline: true, starPill: true, badge: true, starburst: true, ribbon: true },
};

export function freshCover(overrides = {}) {
  return {
    ...DEFAULT_COVER,
    extras: { ...DEFAULT_COVER.extras, ...(overrides.extras || {}) },
    ...overrides,
    frames: [],
  };
}

// Deal photos into a layout's slots and build fresh frames. Framing
// stored per photo in `kept` survives the re-deal.
export function dealCover(library, cover, kept = new Map()) {
  const layout = layoutById(cover.layout);
  const panelCount = layout.panels(1000, 1000).length;
  const dealt = dealPhotos(library, panelCount, cover.dealStart || 0);
  const frames = framesForLayout(cover.layout, library, dealt, (photo, aspect) => {
    if (kept.has(photo.id)) return { ...kept.get(photo.id) };
    return smartFrame(photo, aspect);
  });
  // stripFive shares one photo across strips: framesForLayout already
  // spreads the crop; keep its photo on every strip.
  if (cover.layout === "stripFive") {
    frames.forEach((f) => { f.photoId = dealt[0].id; });
  } else {
    frames.forEach((f, i) => { f.photoId = dealt[i].id; });
  }
  return { ...cover, frames };
}

// Re-deal after a layout change, preserving each photo's framing.
export function changeLayout(library, cover, layoutId) {
  const kept = new Map();
  cover.frames.forEach((f) => kept.set(f.photoId, f));
  const next = { ...cover, layout: layoutId };
  return dealCover(library, next, kept);
}

// History: 50 snapshots, undo/redo buttons and Ctrl+Z / Ctrl+Shift+Z.
export function makeHistory(initial) {
  let past = [];
  let future = [];
  let current = snapshot(initial);
  return {
    get current() { return parse(current); },
    push(next) {
      const s = snapshot(next);
      if (s === current) return;
      past.push(current);
      if (past.length > 50) past.shift();
      future = [];
      current = s;
    },
    undo() {
      if (!past.length) return null;
      future.push(current);
      current = past.pop();
      return parse(current);
    },
    redo() {
      if (!future.length) return null;
      past.push(current);
      current = future.pop();
      return parse(current);
    },
    get canUndo() { return past.length > 0; },
    get canRedo() { return future.length > 0; },
  };
}

function snapshot(cover) {
  return JSON.stringify(cover);
}

function parse(s) {
  return JSON.parse(s);
}
