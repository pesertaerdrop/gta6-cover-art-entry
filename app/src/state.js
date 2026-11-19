// state.js — one cover's state, and its 50-step undo/redo history.
// A panel is { photoId, zoom, x, y }: zoom and pan are relative, so the
// same cover re-frames natively at every export size. Hand-set crops are
// kept per photo id, so changing the layout never loses a careful crop.

import { layoutById, panelsFor } from './layouts.js';

/** The cover a fresh editor opens with. */
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
  };
}

/** The default crop for a freshly assigned photo: upper third, where faces live. */
export function defaultCrop() {
  return { zoom: 1.15, x: 0.5, y: 0.32 };
}

/**
 * Fill the layout's panels with photos, round-robin, keeping any
 * hand-set crop the photo already has. Photos beyond the panel count
 * stay in the library for swapping.
 *
 * Strip Five is the exception: one photo, five vertical slices of it.
 * Every strip panel uses the lead photo (state.leadPhotoId, or the
 * first library photo) with a slice crop that walks across the frame,
 * so the five strips read as one photograph cut into bands.
 */
export function assignPhotos(state, photos) {
  const count = panelsFor(state.layout, 100, 100).length;
  const kept = new Map(state.panels.map((p) => [p.photoId, p]));
  const panels = [];
  if (state.layout === 'strip') {
    const lead = photos.find((p) => p.id === state.leadPhotoId) || photos[0];
    if (!lead) {
      state.panels = [];
      return;
    }
    for (let i = 0; i < count; i++) {
      panels.push({ photoId: lead.id, zoom: 1.06, x: (i + 0.5) / count, y: 0.35 });
    }
    state.panels = panels;
    state.selected = Math.min(state.selected, Math.max(0, panels.length - 1));
    return;
  }
  for (let i = 0; i < count; i++) {
    const photo = photos[i % photos.length];
    if (!photo) break;
    const old = kept.get(photo.id);
    panels.push(old ? { ...old } : { photoId: photo.id, ...defaultCrop() });
  }
  state.panels = panels;
  state.selected = Math.min(state.selected, Math.max(0, panels.length - 1));
}

/** Switch layouts, preserving each photo's crop by photo id. */
export function setLayout(state, layoutId, photos) {
  if (!layoutById(layoutId)) return;
  state.layout = layoutId;
  assignPhotos(state, photos);
}

/** Replace the photo of one panel (keeps the panel's crop). */
export function swapPanelPhoto(state, index, photoId) {
  const panel = state.panels[index];
  if (!panel) return;
  panel.photoId = photoId;
}

/** A deep copy of the state, for the undo history. */
export function snapshot(state) {
  return JSON.parse(JSON.stringify(state));
}

/** A 50-step undo/redo history over state snapshots. */
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
