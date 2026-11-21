// The one-tap cover actions.
//
// Auto layout picks the layout whose panel count fits the photos best
// (fewest panels wasted, ties broken by layout id) and re-matches the
// panels to it. Surprise me rolls a new layout, a new grade and a new
// caption from the deck, and fills the caption fields from it. The header
// undo/redo buttons call the studio's undo and redo.
import { CAPTION_DECK } from '../state/default-doc.js';
import { LAYOUT_LIST, layoutPanelCount } from '../layouts/layout-presets.js';
import { GRADES } from '../effects/grade-presets.js';
import { rematchPanels } from '../layouts/plan-cover.js';

// The layout whose panel count is closest to the document's panel count.
export function pickAutoLayout(doc) {
  const scored = LAYOUT_LIST.map((layout) => ({
    layout,
    fit: Math.abs(layoutPanelCount(layout.id) - doc.panels.length),
  }));
  scored.sort((a, b) => a.fit - b.fit || (a.layout.id < b.layout.id ? -1 : 1));
  return scored[0].layout.id;
}

export function applyAutoLayout(studio) {
  const doc = studio.doc;
  doc.layout = pickAutoLayout(doc);
  doc.panels = rematchPanels(doc, doc.layout);
  doc.selected = 0;
  studio.commit('auto layout');
}

// A fresh cover: a random layout, a random grade, a random deck caption
// (with its fields written into the document), title style back to Auto,
// and the panels re-matched to the new layout.
export function applySurpriseMe(studio) {
  const doc = studio.doc;
  const layout = LAYOUT_LIST[Math.floor(Math.random() * LAYOUT_LIST.length)];
  const grade = GRADES[Math.floor(Math.random() * GRADES.length)];
  const captionIndex = Math.floor(Math.random() * CAPTION_DECK.length);
  const caption = CAPTION_DECK[captionIndex];
  doc.layout = layout.id;
  doc.grade = grade.id;
  doc.titleStyle = 'auto';
  doc.caption = captionIndex;
  for (const field of ['title', 'script', 'tagline', 'quote', 'outlet', 'billing', 'vol', 'comingSoon']) {
    doc[field] = caption[field];
  }
  doc.panels = rematchPanels(doc, doc.layout);
  doc.selected = 0;
  studio.commit('surprise me');
}

export function setupCoverActions(studio) {
  const autoBtn = document.getElementById('autoLayoutBtn');
  const surpriseBtn = document.getElementById('surpriseBtn');
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');
  if (autoBtn) autoBtn.addEventListener('click', () => studio.autoLayout());
  if (surpriseBtn) surpriseBtn.addEventListener('click', () => studio.surpriseMe());
  if (undoBtn) undoBtn.addEventListener('click', () => studio.undo());
  if (redoBtn) redoBtn.addEventListener('click', () => studio.redo());
}
