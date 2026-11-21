// The one-tap cover actions: Auto layout (picks the layout whose panel
// count fits the photos best and re-matches them), Surprise me (a new
// layout, a new grade and a new caption from the caption deck), and the
// undo/redo buttons in the header.
import { CAPTION_DECK } from '../state/default-doc.js';
import { LAYOUT_LIST, layoutPanelCount } from '../layouts/layout-presets.js';
import { GRADES } from '../effects/grade-presets.js';
import { rematchPanels } from '../layouts/plan-cover.js';

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
