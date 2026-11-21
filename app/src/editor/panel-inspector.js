// The panel inspector card.
//
// For the selected panel it shows an 88x88 thumbnail of the panel's photo
// (drawn with the same poster treatment as the cover), the panel's title
// and a "smart crop, faces kept whole" note, a zoom slider from 100 to
// 400 percent, Photo previous/next buttons, Reset, Flip, Swap and
// Face-mark buttons, and the callout tag field. Every control acts on the
// selected panel and commits, so undo can step back from it.
import { drawPanelPhoto } from '../effects/poster-photo.js';
import { zoomPanel, resetPanel, swapPanelPhotos } from './panel-gestures.js';
import { nextSamplePhoto, labelOf } from '../photos/sample-photos.js';

// A small button in a row, wired to a handler.
function rowButton(label, onClick) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = label;
  btn.addEventListener('click', onClick);
  return btn;
}

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

  // Head: the thumbnail and the panel's name.
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

  // Zoom: a slider from 100 to 400 percent with a live value. Dragging
  // re-renders in draft; releasing commits.
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

  // Photo: step to the previous or next sample photo in the library.
  const photoRow = document.createElement('div');
  photoRow.className = 'btn-row';
  photoRow.appendChild(rowButton('← Photo', () => {
    panel.photo = nextSamplePhoto(panel.photo, -1).src;
    studio.commit('previous photo');
  }));
  photoRow.appendChild(rowButton('Photo →', () => {
    panel.photo = nextSamplePhoto(panel.photo, 1).src;
    studio.commit('next photo');
  }));
  host.appendChild(photoRow);

  // Actions: reset the crop, flip the photo, swap with the next panel,
  // and mark (or unmark) the face so the crop keeps it whole.
  const actionRow = document.createElement('div');
  actionRow.className = 'btn-row';
  actionRow.appendChild(rowButton('Reset', () => { resetPanel(panel); studio.commit('reset panel'); }));
  actionRow.appendChild(rowButton('Flip', () => { panel.flip = !panel.flip; studio.commit('flip panel'); }));
  actionRow.appendChild(rowButton('Swap', () => {
    const other = (doc.selected + 1) % doc.panels.length;
    swapPanelPhotos(doc, doc.selected, other);
    studio.commit('swap panels');
  }));
  actionRow.appendChild(rowButton(panel.faceMarked ? 'Face marked ✓' : 'Mark face', () => {
    panel.faceMarked = !panel.faceMarked;
    studio.commit('mark face');
  }));
  host.appendChild(actionRow);

  // Callout tag: free text, uppercased, at most 16 characters. Typing
  // re-renders live; leaving the field commits.
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
