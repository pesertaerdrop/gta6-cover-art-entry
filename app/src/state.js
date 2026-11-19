// state.js — one cover, one history.
//
// A cover is { layout, grade, inkOn, inkStrength, title, subtitle,
// tagline, badge, size, frames, extras }. A frame belongs to a panel
// slot, but its framing is remembered per photo: change the layout
// and a hand-set crop comes back with its photo.

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
  const cover = {
    ...DEFAULT_COVER,
    extras: { ...DEFAULT_COVER.extras, ...(overrides.extras || {}) },
    ...overrides,
  };
  cover.frames = [];
  return cover;
}

function freeze(cover) {
  return JSON.stringify(cover);
}

function thaw(s) {
  return JSON.parse(s);
}

// History: 50 snapshots deep. Undo/redo via buttons or Ctrl+Z /
// Ctrl+Shift+Z (Ctrl+Y also redoes).
export function makeHistory(initial) {
  let undoStack = [];
  let redoStack = [];
  let current = freeze(initial);
  return {
    get current() { return thaw(current); },
    get canUndo() { return undoStack.length > 0; },
    get canRedo() { return redoStack.length > 0; },
    push(next) {
      const s = freeze(next);
      if (s === current) return;
      undoStack.push(current);
      if (undoStack.length > 50) undoStack.shift();
      redoStack = [];
      current = s;
    },
    undo() {
      if (!undoStack.length) return null;
      redoStack.push(current);
      current = undoStack.pop();
      return thaw(current);
    },
    redo() {
      if (!redoStack.length) return null;
      undoStack.push(current);
      current = redoStack.pop();
      return thaw(current);
    },
  };
}

// Deal photos into a layout's slots and build frames for them.
// Framing remembered per photo in `kept` survives the re-deal.
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
    for (const f of frames) f.photoId = dealt[0].id;
  } else {
    frames.forEach((f, i) => { f.photoId = dealt[i].id; });
  }
  return { ...cover, frames };
}

// Re-deal after a layout change, keeping each photo's framing.
export function changeLayout(library, cover, layoutId) {
  const kept = new Map();
  for (const f of cover.frames) kept.set(f.photoId, f);
  return dealCover(library, { ...cover, layout: layoutId }, kept);
}
