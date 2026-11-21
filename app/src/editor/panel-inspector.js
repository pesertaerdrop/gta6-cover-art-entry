// The panel inspector card: an 88x88 thumbnail of the selected panel's
// photo, the panel's title and a "smart crop, faces kept whole" note, a zoom
// slider from 100 to 400 percent, Photo previous/next buttons, Reset, Flip,
// Swap and Face-mark buttons, and the callout tag field. Every control acts
// on the selected panel and commits so undo can step back.
import { drawPanelPhoto } from '../effects/poster-photo.js';
import { zoomPanel, resetPanel, swapPanelPhotos } from './panel-gestures.js';
import { nextSamplePhoto, labelOf } from '../photos/sample-photos.js';

export function renderInspector(studio) {
  const host = document.getElementById('inspectorBody');
  if (!host) return;
  const doc = studio.doc;
  const panel = doc.panels[doc.selected];
  host.innerHTML = '';
  if (!panel) {
    host.textContent = 'No panel selected.';
    return;
  }
  const img = studio.images.get(panel.photo);

  const head = document.createElement('div');
  head.className = 'inspector-thumb';
  const thumb = document.createElement('canvas');
  thumb.width = 88;
  thumb.height = 88;
  const thumbCtx = thumb.getContext('2d');
  thumbCtx.fillStyle = '#222';
  thumbCtx.fillRect(0, 0, 88, 88);
  if (img) {
    drawPanelPhoto(thumbCtx, img, { x: 0, y: 0, w: 88, h: 88 }, panel, doc.look, doc.grade);
  }
  const who = document.createElement('div');
  who.className = 'who';
  who.textContent = `Panel ${doc.selected + 1} — ${labelOf(panel.photo)}`;
  const note = document.createElement('small');
  note.textContent = 'Smart crop, faces kept whole';
  who.appendChild(note);
  head.appendChild(thumb);
  head.appendChild(who);
  host.appendChild(head);

  const zoomRow = document.createElement('div');
  zoomRow.className = 'slider-row';
  const zoomLabel = document.createElement('label');
  zoomLabel.textContent = 'Zoom';
  zoomLabel.htmlFor = 'inspectorZoom';
  const zoom = document.createElement('input');
  zoom.type = 'range';
  zoom.id = 'inspectorZoom';
  zoom.min = '100';
  zoom.max = '400';
  zoom.step = '5';
  zoom.value = String(Math.round((panel.zoom || 1) * 100));
  const zoomOut = document.createElement('output');
  zoomOut.textContent = `${Math.round((panel.zoom || 1) * 100)}%`;
  zoom.addEventListener('input', () => {
    panel.zoom = Number(zoom.value) / 100;
    zoomOut.textContent = `${zoom.value}%`;
    studio.renderPreviewDraft();
  });
  zoom.addEventListener('change', () => studio.commit('zoom panel'));
  zoomRow.appendChild(zoomLabel);
  zoomRow.appendChild(zoom);
  zoomRow.appendChild(zoomOut);
  host.appendChild(zoomRow);

  const photoRow = document.createElement('div');
  photoRow.className = 'btn-row';
  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.textContent = '← Photo';
  prevBtn.addEventListener('click', () => {
    panel.photo = nextSamplePhoto(panel.photo, -1).src;
    studio.commit('previous photo');
  });
  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.textContent = 'Photo →';
  nextBtn.addEventListener('click', () => {
    panel.photo = nextSamplePhoto(panel.photo, 1).src;
    studio.commit('next photo');
  });
  photoRow.appendChild(prevBtn);
  photoRow.appendChild(nextBtn);
  host.appendChild(photoRow);

  const actionRow = document.createElement('div');
  actionRow.className = 'btn-row';
  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.textContent = 'Reset';
  resetBtn.addEventListener('click', () => { resetPanel(panel); studio.commit('reset panel'); });
  const flipBtn = document.createElement('button');
  flipBtn.type = 'button';
  flipBtn.textContent = 'Flip';
  flipBtn.addEventListener('click', () => { panel.flip = !panel.flip; studio.commit('flip panel'); });
  const swapBtn = document.createElement('button');
  swapBtn.type = 'button';
  swapBtn.textContent = 'Swap';
  swapBtn.addEventListener('click', () => {
    const other = (doc.selected + 1) % doc.panels.length;
    swapPanelPhotos(doc, doc.selected, other);
    studio.commit('swap panels');
  });
  const faceBtn = document.createElement('button');
  faceBtn.type = 'button';
  faceBtn.textContent = panel.faceMarked ? 'Face marked ✓' : 'Mark face';
  faceBtn.addEventListener('click', () => { panel.faceMarked = !panel.faceMarked; studio.commit('mark face'); });
  actionRow.appendChild(resetBtn);
  actionRow.appendChild(flipBtn);
  actionRow.appendChild(swapBtn);
  actionRow.appendChild(faceBtn);
  host.appendChild(actionRow);

  const tagField = document.createElement('div');
  tagField.className = 'field';
  const tagLabel = document.createElement('label');
  tagLabel.textContent = 'Callout tag';
  tagLabel.htmlFor = 'inspectorTag';
  const tagInput = document.createElement('input');
  tagInput.type = 'text';
  tagInput.id = 'inspectorTag';
  tagInput.maxLength = 16;
  tagInput.value = panel.tag || '';
  tagInput.addEventListener('input', () => {
    panel.tag = tagInput.value.toUpperCase();
    studio.renderPreviewOnly();
  });
  tagInput.addEventListener('change', () => studio.commit('edit tag'));
  tagField.appendChild(tagLabel);
  tagField.appendChild(tagInput);
  host.appendChild(tagField);
}
