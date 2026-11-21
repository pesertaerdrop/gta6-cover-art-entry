// Cover actions: the two one-click moves in the top bar and the tray.
// Auto layout picks the layout that fits the panel count and refills the
// panels; Surprise me shuffles the layout, the grade, the caption and
// the title style, so one click is a whole new poster. Undo and redo are
// wired here too, next to the buttons they serve.
import { GRADE_ORDER } from '../effects/grade-presets.js';
import { TITLE_STYLE_ORDER } from '../lettering/title-styles.js';
import { CAPTION_DECK } from '../state/default-doc.js';
import { LAYOUT_LIST } from '../layouts/layout-presets.js';
import { autoLayoutFor, rematchPanels } from '../layouts/plan-cover.js';

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function pickAutoLayout(doc) {
  return autoLayoutFor(doc);
}

export function applyAutoLayout(studio) {
  const layout = pickAutoLayout(studio.doc);
  rematchPanels(studio.doc, layout);
  studio.redraw();
}

export function applySurpriseMe(studio) {
  const doc = studio.doc;
  doc.layout = pick(LAYOUT_LIST).id;
  rematchPanels(doc, doc.layout);
  doc.grade = pick(GRADE_ORDER);
  doc.caption = Math.floor(Math.random() * CAPTION_DECK.length);
  doc.titleStyle = Math.random() < 0.5 ? 'auto' : pick(TITLE_STYLE_ORDER);
  for (const panel of doc.panels) {
    panel.zoom = 1 + Math.random() * 0.35;
    panel.panX = (Math.random() - 0.5) * 0.5;
    panel.panY = (Math.random() - 0.5) * 0.5;
  }
  studio.redraw();
}

export function setupCoverActions(studio) {
  const surprise = document.getElementById('surpriseBtn');
  if (surprise) surprise.addEventListener('click', () => studio.commit(() => applySurpriseMe(studio)));
  const auto = document.getElementById('autoLayoutBtn');
  if (auto) auto.addEventListener('click', () => studio.commit(() => applyAutoLayout(studio)));
  const undo = document.getElementById('undoBtn');
  if (undo) undo.addEventListener('click', () => studio.undo());
  const redo = document.getElementById('redoBtn');
  if (redo) redo.addEventListener('click', () => studio.redo());
}
