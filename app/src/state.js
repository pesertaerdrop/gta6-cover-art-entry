// state.js — one cover, one history.
//
// A cover is { layout, grade, inkOn, inkStrength, title, subtitle,
// tagline, badge, size, frames, extras }. A frame belongs to a panel
// slot, but its framing is remembered per photo: change the layout
// and a hand-set crop comes back with its photo.

import { layoutById, framesForLayout } from "./layouts.js";
import { dealPhotos, smartFrame } from "./photos.js";

// The cover the editor opens with: nine panels, Vice Sunset, ink on,
// the Afterglow words, square size, every title-block extra on.
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

// Snapshots are plain JSON strings: cheap to compare, cheap to store,
// and undo/redo is just moving a string between two stacks.
function serialize(cover) {
  return JSON.stringify(cover);
}

function deserialize(s) {
  return JSON.parse(s);
}

// History: 50 snapshots deep. Undo/redo via buttons or Ctrl+Z /
// Ctrl+Shift+Z (Ctrl+Y also redoes). Pushing an unchanged cover is a
// no-op, so slider drags that end where they started leave no trace.
export function makeHistory(initial) {
  let past = [];
  let future = [];
  let now = serialize(initial);
  return {
    get current() { return deserialize(now); },
    get canUndo() { return past.length > 0; },
    get canRedo() { return future.length > 0; },
    push(next) {
      const s = serialize(next);
      if (s === now) return;
      past.push(now);
      if (past.length > 50) past.shift();
      future = [];
      now = s;
    },
    undo() {
      if (!past.length) return null;
      future.push(now);
      now = past.pop();
      return deserialize(now);
    },
    redo() {
      if (!future.length) return null;
      past.push(now);
      now = future.pop();
      return deserialize(now);
    },
  };
}

// Deal photos into a layout's slots and build frames for them.
// Framing remembered per photo in `saved` survives the re-deal.
export function dealCover(library, cover, saved = new Map()) {
  const layout = layoutById(cover.layout);
  const slots = layout.panels(1000, 1000).length;
  const picked = dealPhotos(library, slots, cover.dealStart || 0);
  const frames = framesForLayout(cover.layout, library, picked, (photo, aspect) => {
    if (saved.has(photo.id)) return { ...saved.get(photo.id) };
    return smartFrame(photo, aspect);
  });
  // stripFive shares one photo across strips: framesForLayout already
  // spreads the crop; keep its photo on every strip.
  if (cover.layout === "stripFive") {
    for (const f of frames) f.photoId = picked[0].id;
  } else {
    frames.forEach((f, i) => { f.photoId = picked[i].id; });
  }
  return { ...cover, frames };
}

// Re-deal after a layout change, keeping each photo's framing: the
// frames the cover already has are remembered by photo id, so a
// hand-set crop comes back with its photo in the new layout.
export function changeLayout(library, cover, layoutId) {
  const saved = new Map();
  for (const f of cover.frames) saved.set(f.photoId, f);
  return dealCover(library, { ...cover, layout: layoutId }, saved);
}
