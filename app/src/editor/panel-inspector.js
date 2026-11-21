// The panel inspector: the right-rail card for the selected panel. It
// shows a thumbnail of the panel's photo, the panel's name and note, a
// zoom slider, photo stepping, and the framing buttons (reset, flip,
// swap with the next panel, mark face) plus the callout tag field. Every
// control commits through the studio, so each change is undoable. Sliders
// and the tag field checkpoint when the user grabs them, so one drag or
// one edit is one undo step even though the preview moves live.
import { drawPanelPhoto } from '../effects/poster-photo.js';
import { nextSamplePhoto, labelOf } from '../photos/sample-photos.js';
import { resetPanel } from './panel-gestures.js';

function thumbOf(studio, panel) {
  const canvas = document.createElement('canvas');
  canvas.width = 176;
  canvas.height = 176;
  const img = studio.images.get(panel.photo);
  const grade = studio.plan ? studio.plan.grade : null;
  if (img) {
    const ctx = canvas.getContext('2d');
    drawPanelPhoto(ctx, img, { x: 0, y: 0, w: 176, h: 176 }, panel, studio.doc.look, grade);
  }
  return canvas;
}

export function renderInspector(studio) {
  const body = document.getElementById('inspectorBody');
  if (!body) return;
  const doc = studio.doc;
  const panel = doc.panels[doc.selected] || doc.panels[0];
  const index = doc.panels.indexOf(panel);
  body.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'inspector-thumb';
  wrap.appendChild(thumbOf(studio, panel));
  const who = document.createElement('div');
  who.className = 'who';
  who.textContent = `Panel ${index + 1} \u2014 ${labelOf(panel.photo)}`;
  const note = document.createElement('small');
  note.textContent = 'Smart crop, faces kept whole';
  who.appendChild(note);
  wrap.appendChild(who);
  body.appendChild(wrap);

  const zoomRow = document.createElement('div');
  zoomRow.className = 'slider-row';
  const zoomLabel = document.createElement('label');
  zoomLabel.textContent = 'Zoom';
  const zoom = document.createElement('input');
  zoom.type = 'range';
  zoom.min = '60';
  zoom.max = '300';
  zoom.value = String(Math.round((panel.zoom || 1.15) * 100));
  const zoomOut = document.createElement('output');
  zoomOut.textContent = `${Math.round((panel.zoom || 1.15) * 100)}%`;
  zoom.addEventListener('pointerdown', () => studio.checkpoint());
  zoom.addEventListener('input', () => {
    panel.zoom = Number(zoom.value) / 100;
    zoomOut.textContent = `${zoom.value}%`;
    studio.drawPreview();
  });
  zoom.addEventListener('change', () => studio.drawPreview());
  zoomRow.append(zoomLabel, zoom, zoomOut);
  body.appendChild(zoomRow);

  const stepRow = document.createElement('div');
  stepRow.className = 'btn-row';
  const prev = document.createElement('button');
  prev.type = 'button';
  prev.textContent = '\u2190 Photo';
  prev.addEventListener('click', () => studio.commit(() => { panel.photo = nextSamplePhoto(panel.photo, -1); }));
  const next = document.createElement('button');
  next.type = 'button';
  next.textContent = 'Photo \u2192';
  next.addEventListener('click', () => studio.commit(() => { panel.photo = nextSamplePhoto(panel.photo, 1); }));
  stepRow.append(prev, next);
  body.appendChild(stepRow);

  const frameRow = document.createElement('div');
  frameRow.className = 'btn-row';
  const mkBtn = (text, fn) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = text;
    b.addEventListener('click', () => studio.commit(fn));
    return b;
  };
  frameRow.append(
    mkBtn('Reset', () => resetPanel(panel)),
    mkBtn('Flip', () => { panel.flip = !panel.flip; }),
    mkBtn('Swap', () => {
      const j = (index + 1) % doc.panels.length;
      const a = doc.panels[index];
      const b = doc.panels[j];
      const photo = a.photo;
      const tag = a.tag;
      a.photo = b.photo;
      a.tag = b.tag;
      b.photo = photo;
      b.tag = tag;
    }),
    mkBtn('Mark face', () => { panel.faceMarked = !panel.faceMarked; }),
  );
  body.appendChild(frameRow);

  const tagField = document.createElement('div');
  tagField.className = 'field';
  const tagLabel = document.createElement('label');
  tagLabel.textContent = 'Callout tag';
  const tagInput = document.createElement('input');
  tagInput.type = 'text';
  tagInput.value = panel.tag || '';
  tagInput.maxLength = 24;
  tagInput.addEventListener('focus', () => studio.checkpoint());
  tagInput.addEventListener('input', () => {
    panel.tag = tagInput.value.toUpperCase();
    studio.drawPreview();
  });
  tagInput.addEventListener('change', () => studio.drawPreview());
  tagField.append(tagLabel, tagInput);
  body.appendChild(tagField);
}
