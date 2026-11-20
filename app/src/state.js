// state.js — one cover's state, and its 50-step undo/redo history.
// A panel is { photoId, zoom, x, y }: zoom and pan are relative, so the
// same cover re-frames natively at every export size. Hand-set crops are
// kept per photo id, so changing the layout never loses a careful crop.
//
// Strip Five panels are different: a panel is { photoId, slice, y,
// zoom } where slice is { x0, x1, fx, face } — the span of the lead
// photo the strip shows, the focus point inside it, and the span of the
// faces in that slice (null when it holds none). The spans come from
// faces.js: the dividers never cross a face, and — where the photo's
// faces allow it — each face-bearing slice is wide enough that its
// narrowest window shows its face whole, with air around it. The state
// also keeps the divider set itself (stripDividers) so the layout, the
// renderer and the drag handler all draw the same gutters, and a flag
// (stripWholeFace) saying whether the whole-face rule held for this
// photo, so the editor never claims a guarantee it could not keep.

import { layoutById, panelsFor } from './layouts.js';
import {
  stripDividers,
  wholeFaceDividers,
  sliceFocus,
  faceSpanInSlice,
  narrowWindowRatio,
} from './faces.js';
import { EXPORT_SIZES } from './render.js';

// The cover a fresh editor opens with.
export function createState() {
  return {
    title: 'AFTERGLOW',
    subtitle: 'one last sunset',
    tagline: 'EIGHT SCENES, ONE CITY',
    layout: 'poster',
    grade: 'sunset',
    ink: { on: true, strength: 0.8 },
    panels: [],
    selected: 0,
    // The photo Strip Five slices (null = first photo in the library).
    leadPhotoId: null,
    // The face-aware divider set for the current strip (null unless the
    // layout is Strip Five). Photo fractions, [d1..d4].
    stripDividers: null,
    // True when the divider set also satisfies the whole-face width
    // rule for this photo (every face whole in its strip's narrowest
    // window). False means the v7 fallback is in force: dividers never
    // cross a face, but a face wider than its strip's window may still
    // touch the strip's edges.
    stripWholeFace: false,
  };
}

// The default crop for a freshly assigned photo: upper third, where faces live.
export function defaultCrop() {
  return { zoom: 1.15, x: 0.5, y: 0.32 };
}

// Fill the layout's panels with photos, round-robin, keeping any
// hand-set crop the photo already has. Photos beyond the panel count
// stay in the library for swapping.
//
// Strip Five is the exception: one photo, five vertical slices of it.
// The slices come from the lead photo's faces, so each face falls
// wholly inside one strip with a margin around it, and the focus point
// of each strip sits on its face (or the middle of the slice when it
// holds no face). The divider search first tries for the whole-face
// guarantee — slices wide enough that the narrowest window any export
// size shows still contains the whole face plus air — and falls back to
// the v7 divider rule when the photo's faces cannot all fit that way.
// The focus is computed for the slice's own narrowest window, so one
// stored focus stays valid at every size.
export function assignPhotos(state, photos) {
  const count = panelsFor(state.layout, 100, 100).length;
  const kept = new Map(state.panels.map((p) => [p.photoId, p]));
  const panels = [];
  if (state.layout === 'strip') {
    const lead = photos.find((p) => p.id === state.leadPhotoId) || photos[0];
    if (!lead) {
      state.panels = [];
      state.stripDividers = null;
      state.stripWholeFace = false;
      return;
    }
    const faces = lead.faces || [];
    const imgW = lead.img ? lead.img.naturalWidth : 1920;
    const imgH = lead.img ? lead.img.naturalHeight : 1280;
    const ratio = narrowWindowRatio(imgW, imgH, EXPORT_SIZES);
    const whole = faces.length > 0 ? wholeFaceDividers(faces, count, ratio) : null;
    const dividers = whole ?? stripDividers(faces, count);
    state.stripDividers = dividers;
    state.stripWholeFace = whole !== null;
    const edges = [0, ...dividers, 1];
    for (let i = 0; i < count; i++) {
      const x0 = edges[i];
      const x1 = edges[i + 1];
      const viewW = (x1 - x0) * ratio;
      const fx = sliceFocus(faces, x0, x1, viewW);
      const face = faceSpanInSlice(faces, x0, x1);
      panels.push({ photoId: lead.id, slice: { x0, x1, fx, face }, y: 0.35, zoom: 1 });
    }
    state.panels = panels;
    state.selected = Math.min(state.selected, Math.max(0, panels.length - 1));
    return;
  }
  state.stripDividers = null;
  state.stripWholeFace = false;
  for (let i = 0; i < count; i++) {
    const photo = photos[i % photos.length];
    if (!photo) break;
    const old = kept.get(photo.id);
    // A strip panel has a slice, not a crop — it cannot carry over to a
    // normal layout, so it gets a fresh default crop instead.
    panels.push(old && !old.slice ? { ...old } : { photoId: photo.id, ...defaultCrop() });
  }
  state.panels = panels;
  state.selected = Math.min(state.selected, Math.max(0, panels.length - 1));
}

// Switch layouts, preserving each photo's crop by photo id.
export function setLayout(state, layoutId, photos) {
  if (!layoutById(layoutId)) return;
  state.layout = layoutId;
  assignPhotos(state, photos);
}

// Replace the photo of one panel (keeps the panel's crop).
export function swapPanelPhoto(state, index, photoId) {
  const panel = state.panels[index];
  if (!panel) return;
  panel.photoId = photoId;
}

// A deep copy of the state, for the undo history.
export function snapshot(state) {
  return JSON.parse(JSON.stringify(state));
}

// A 50-step undo/redo history over state snapshots.
export function createHistory(initial) {
  const past = [];
  const future = [];
  let current = snapshot(initial);
  return {
    get current() {
      return current;
    },
    commit(next) {
      past.push(current);
      if (past.length > 50) past.shift();
      future.length = 0;
      current = snapshot(next);
    },
    undo() {
      if (past.length === 0) return null;
      future.push(current);
      current = past.pop();
      return snapshot(current);
    },
    redo() {
      if (future.length === 0) return null;
      past.push(current);
      current = future.pop();
      return snapshot(current);
    },
    canUndo() {
      return past.length > 0;
    },
    canRedo() {
      return future.length > 0;
    },
  };
}
