// cover-actions.js — the one-tap cover actions: Auto layout (picks the
// layout whose panel count fits the photos best and re-matches them),
// Surprise me (a new layout, a new grade and a new caption from the
// caption deck), and the undo/redo buttons in the header.
import { LAYOUTS } from '../layouts/layout-presets.js';
import { GRADES } from '../effects/grade-presets.js';
import { rematchPanels } from '../layouts/plan-cover.js';
import { SAMPLE_PHOTOS, DEFAULT_TAGS } from '../photos/sample-photos.js';

export const CAPTION_DECK = [
  { title: 'TIDELINE', script: 'chasing the last light', tagline: 'A SALTLINE ORIGINAL', quote: 'Salt air and high stakes, beautifully shot', outlet: 'THE BOARDWALK LEDGER', vol: 'VOL. 2' },
  { title: 'MIDNIGHT TIDE', script: 'the city never sleeps', tagline: 'AFTER DARK ON THE COAST', quote: 'Neon, noise and nerve after dark', outlet: 'THE HARBOR LIGHT', vol: 'VOL. 3' },
  { title: 'EMBER COAST', script: 'the crew comes home', tagline: 'ONE LAST SUMMER', quote: 'A crew worth following home', outlet: 'THE MARINA POST', vol: 'PART II' },
  { title: 'SALTWATER', script: 'seven ways home', tagline: 'SEASON ONE', quote: 'Seven ways home, all of them wild', outlet: 'PALM CITY CHRONICLE', vol: 'SEASON ONE' },
  { title: 'PALM LIGHT', script: 'golden hour, no curfew', tagline: 'SHOT ON THE BOULEVARD', quote: 'Warm light and louder laughs', outlet: 'THE PIER GAZETTE', vol: 'VOL. 1' },
  { title: 'NIGHT MARKET', script: 'steam, bulbs and secrets', tagline: 'EAT FIRST, ASK LATER', quote: 'Steam, bulbs and secrets on every corner', outlet: 'THE MARKET BELL', vol: 'PART I' },
];

export function pickAutoLayout(doc) {
  const scored = LAYOUTS.map((layout) => {
    const count = layout.panels(100, 100).length;
    const fit = Math.abs(count - doc.panels.length);
    return { layout, fit };
  });
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
  const layout = LAYOUTS[Math.floor(Math.random() * LAYOUTS.length)];
  const grade = GRADES[Math.floor(Math.random() * GRADES.length)];
  const caption = CAPTION_DECK[Math.floor(Math.random() * CAPTION_DECK.length)];
  doc.layout = layout.id;
  doc.grade = grade.id;
  doc.titleStyle = 'auto';
  doc.title = caption.title;
  doc.script = caption.script;
  doc.tagline = caption.tagline;
  doc.quote = caption.quote;
  doc.outlet = caption.outlet;
  doc.vol = caption.vol;
  const start = Math.floor(Math.random() * SAMPLE_PHOTOS.length);
  doc.panels = doc.panels.map((slot, i) => ({
    ...slot,
    photo: SAMPLE_PHOTOS[(start + i * 2) % SAMPLE_PHOTOS.length].file,
    tag: DEFAULT_TAGS[(start + i) % DEFAULT_TAGS.length],
  }));
  doc.panels = rematchPanels(doc, doc.layout);
  doc.selected = 0;
  studio.commit('surprise me');
  studio.syncCaptionFields();
}

export function setupCoverActions(studio) {
  document.getElementById('autoLayoutBtn').addEventListener('click', () => applyAutoLayout(studio));
  document.getElementById('surpriseBtn').addEventListener('click', () => applySurpriseMe(studio));
  document.getElementById('undoBtn').addEventListener('click', () => studio.undo());
  document.getElementById('redoBtn').addEventListener('click', () => studio.redo());
  document.getElementById('sizePicker').querySelectorAll('button[data-size]').forEach((button) => {
    button.addEventListener('click', () => {
      studio.doc.size = button.dataset.size;
      studio.doc.panels = rematchPanels(studio.doc, studio.doc.layout);
      document.getElementById('sizePicker').querySelectorAll('button').forEach((other) => other.classList.remove('primary'));
      button.classList.add('primary');
      studio.commit('change size');
    });
  });
}
