// Neon Coast Cover Studio — the cover state and its history.
//
// The state is plain data, so undo and redo are snapshots: every change
// pushes the previous state onto the undo stack. Panels hold one crop each
// (photo, zoom, pan), and changing the layout remaps the panels without
// losing the photos already placed.

import { LAYOUTS, PRESETS, SAMPLES } from './presets.js';
import { panelCount } from './cover.js';

export function defaultPanels(layoutId, photoIds) {
  const n = panelCount(layoutId);
  const panels = [];
  for (let i = 0; i < n; i += 1) {
    panels.push({
      photoId: photoIds.length ? photoIds[i % photoIds.length] : null,
      zoom: 1,
      dx: 0,
      dy: 0,
    });
  }
  return panels;
}

export function createCoverState() {
  const photoIds = SAMPLES.map((s) => s.id);
  return {
    layout: 'grid9',
    grade: 'neon-nights',
    size: '1080x1080',
    title: 'NEON COAST',
    subtitle: 'Vice City nights',
    badge: 'EST. 2026',
    panels: defaultPanels('grid9', photoIds),
    selected: 0,
    grain: true,
    vignette: true,
    halftone: true,
  };
}

// Only the serializable fields: the history never holds image elements.
export function snapshotCover(state) {
  return JSON.parse(JSON.stringify({
    layout: state.layout,
    grade: state.grade,
    size: state.size,
    title: state.title,
    subtitle: state.subtitle,
    badge: state.badge,
    panels: state.panels,
    selected: state.selected,
    grain: state.grain,
    vignette: state.vignette,
    halftone: state.halftone,
  }));
}

export function restoreCover(state, snap) {
  Object.assign(state, JSON.parse(JSON.stringify(snap)));
}

// Keep the photos when the layout changes: panels are remapped by index,
// extra panels are dropped, missing ones are filled from the library.
export function remapPanelsForLayout(state, photoIds) {
  const n = panelCount(state.layout);
  const next = [];
  for (let i = 0; i < n; i += 1) {
    if (state.panels[i]) next.push({ ...state.panels[i] });
    else next.push({ photoId: photoIds[i % photoIds.length] ?? null, zoom: 1, dx: 0, dy: 0 });
  }
  state.panels = next;
  if (state.selected >= n) state.selected = 0;
}

// Deal the library across the panels in order, so every panel shows a
// different photo where the library has enough of them. The slight downward
// pan keeps faces in frame when a wide panel crops a photo top and bottom.
export function autoFillPanels(state, photoIds) {
  state.panels = state.panels.map((panel, i) => ({
    ...panel,
    photoId: photoIds[i % photoIds.length] ?? panel.photoId,
    zoom: 1,
    dx: 0,
    dy: 0.08,
  }));
}

// A fresh look from the same photos: a random layout, grade and crop.
export function shuffleCover(state, photoIds) {
  const layoutIds = Object.keys(LAYOUTS);
  const gradeIds = ['vice-sunset', 'neon-nights', 'golden-hour', 'aqua-pop', 'noir-vice', 'palm-dusk'];
  state.layout = layoutIds[Math.floor(Math.random() * layoutIds.length)];
  state.grade = gradeIds[Math.floor(Math.random() * gradeIds.length)];
  remapPanelsForLayout(state, photoIds);
  state.panels = state.panels.map((panel) => ({
    photoId: photoIds[Math.floor(Math.random() * photoIds.length)] ?? panel.photoId,
    zoom: 1 + Math.random() * 0.6,
    dx: (Math.random() - 0.5) * 0.3,
    dy: (Math.random() - 0.5) * 0.3,
  }));
}

export function applyCoverPreset(state, presetId, photoIds) {
  const preset = PRESETS.find((p) => p.id === presetId);
  if (!preset) return false;
  state.layout = preset.layout;
  state.grade = preset.grade;
  state.title = preset.title;
  state.subtitle = preset.subtitle;
  state.badge = preset.badge;
  remapPanelsForLayout(state, photoIds);
  autoFillPanels(state, photoIds);
  return true;
}

// Undo and redo over whole-state snapshots, capped at fifty steps.
export class CoverHistory {
  constructor(state) {
    this.state = state;
    this.undoStack = [];
    this.redoStack = [];
  }

  commit() {
    this.undoStack.push(snapshotCover(this.state));
    if (this.undoStack.length > 50) this.undoStack.shift();
    this.redoStack = [];
  }

  undo() {
    if (!this.undoStack.length) return false;
    this.redoStack.push(snapshotCover(this.state));
    restoreCover(this.state, this.undoStack.pop());
    return true;
  }

  redo() {
    if (!this.redoStack.length) return false;
    this.undoStack.push(snapshotCover(this.state));
    restoreCover(this.state, this.redoStack.pop());
    return true;
  }

  get canUndo() {
    return this.undoStack.length > 0;
  }

  get canRedo() {
    return this.redoStack.length > 0;
  }
}
