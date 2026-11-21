// The cover actions: auto layout, surprise me, undo and redo.
//
// Auto layout reshapes the panels to the layout that fits how many
// photos the document holds. Surprise me rolls the dice on the
// layout, the grade, the caption and the photos. Undo and redo step
// through the history the studio keeps.
import { autoLayoutFor, rematchPanels } from '../layouts/plan-cover.js';
import { LAYOUT_LIST } from '../layouts/layout-presets.js';
import { GRADE_ORDER } from '../effects/grade-presets.js';
import { CAPTION_DECK } from '../state/default-doc.js';
import { SAMPLE_PHOTOS } from '../photos/sample-photos.js';

export function pickAutoLayout(doc) {
  return autoLayoutFor(doc);
}

export function applyAutoLayout(studio) {
  const layout = autoLayoutFor(studio.doc);
  rematchPanels(studio.doc, layout);
  studio.commit();
  studio.render();
}

export function applySurpriseMe(studio) {
  const doc = studio.doc;
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  doc.layout = pick(LAYOUT_LIST).id;
  doc.grade = pick(GRADE_ORDER);
  doc.caption = Math.floor(Math.random() * CAPTION_DECK.length);
  const shuffled = [...SAMPLE_PHOTOS].sort(() => Math.random() - 0.5);
  doc.panels = doc.panels.map((panel, i) => ({
    ...panel,
    photo: shuffled[i % shuffled.length].src,
    tag: shuffled[i % shuffled.length].tag,
    zoom: 1.15,
    panX: 0,
    panY: 0,
  }));
  doc.titleStyle = 'auto';
  studio.commit();
  studio.render();
}

export function setupCoverActions(studio) {
  const auto = document.getElementById('auto-layout');
  if (auto) auto.addEventListener('click', () => applyAutoLayout(studio));
  const surprise = document.getElementById('surprise-btn');
  if (surprise) surprise.addEventListener('click', () => applySurpriseMe(studio));
  const undo = document.getElementById('undo-btn');
  if (undo) undo.addEventListener('click', () => studio.undo());
  const redo = document.getElementById('redo-btn');
  if (redo) redo.addEventListener('click', () => studio.redo());
}
