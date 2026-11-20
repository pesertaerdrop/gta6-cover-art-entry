// panel-inspector.js — the panel inspector card: an 88x88 thumbnail of the
// selected panel's photo, the panel's title and a "smart crop, faces kept
// whole" note, a zoom slider from 100 to 400 percent, Photo previous/next
// buttons, Reset / Flip / Swap / Face-mark buttons, and the callout name-tag
// checkbox plus its text field (22 characters max).
import { samplePhotoIndex, nextSamplePhoto, SAMPLE_PHOTOS } from '../photos/sample-photos.js';
import { resetPanel, zoomPanel } from './panel-gestures.js';

export function renderInspector(studio) {
  const body = document.getElementById('inspectorBody');
  const doc = studio.doc;
  const planPanels = studio.currentPlan ? studio.currentPlan.panels : [];
  const panel = planPanels[doc.selected] ?? planPanels[0];
  if (!panel) {
    body.innerHTML = '<p class="hint">No panel selected.</p>';
    return;
  }
  const slot = panel.slot;
  const photoIndex = samplePhotoIndex(slot.photo);
  body.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'inspector-thumb';
  const thumb = document.createElement('canvas');
  thumb.width = 88;
  thumb.height = 88;
  const who = document.createElement('div');
  who.className = 'who';
  who.innerHTML = '';
  const title = document.createElement('span');
  title.textContent = `Panel ${panel.number} of ${planPanels.length}`;
  const note = document.createElement('small');
  note.textContent = slot.faceMarked ? 'smart crop, faces kept whole' : 'smart crop, face mark off';
  who.appendChild(title);
  who.appendChild(note);
  wrap.appendChild(thumb);
  wrap.appendChild(who);
  body.appendChild(wrap);
  const image = studio.images.get(slot.photo);
  if (image) {
    const tctx = thumb.getContext('2d');
    const s = Math.max(88 / image.naturalWidth, 88 / image.naturalHeight) * (slot.zoom || 1);
    const dw = image.naturalWidth * s;
    const dh = image.naturalHeight * s;
    tctx.drawImage(image, (88 - dw) / 2, (88 - dh) / 2, dw, dh);
  }

  const zoomRow = document.createElement('div');
  zoomRow.className = 'slider-row';
  zoomRow.innerHTML = `<label for="zoomSlider">Zoom</label><input id="zoomSlider" type="range" min="100" max="400" step="5" value="${Math.round((slot.zoom || 1) * 100)}" aria-label="Panel zoom percent"><output id="zoomOut">${Math.round((slot.zoom || 1) * 100)}%</output>`;
  body.appendChild(zoomRow);
  zoomRow.querySelector('#zoomSlider').addEventListener('input', (event) => {
    slot.zoom = Number(event.target.value) / 100;
    zoomRow.querySelector('#zoomOut').textContent = `${event.target.value}%`;
    studio.renderPreviewOnly();
  });
  zoomRow.querySelector('#zoomSlider').addEventListener('change', () => studio.commit('zoom panel'));

  const photoRow = document.createElement('div');
  photoRow.className = 'btn-row';
  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.textContent = 'Photo prev';
  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.textContent = 'Photo next';
  const photoLabel = document.createElement('span');
  photoLabel.className = 'hint';
  photoLabel.textContent = photoIndex >= 0 ? `${photoIndex + 1} of ${SAMPLE_PHOTOS.length}` : 'custom photo';
  photoRow.appendChild(prevBtn);
  photoRow.appendChild(nextBtn);
  photoRow.appendChild(photoLabel);
  body.appendChild(photoRow);
  prevBtn.addEventListener('click', () => {
    slot.photo = nextSamplePhoto(slot.photo, -1).file;
    studio.commit('previous photo');
  });
  nextBtn.addEventListener('click', () => {
    slot.photo = nextSamplePhoto(slot.photo, 1).file;
    studio.commit('next photo');
  });

  const actionRow = document.createElement('div');
  actionRow.className = 'btn-row';
  const labels = ['Reset', 'Flip', 'Swap', 'Face-mark'];
  const buttons = {};
  for (const label of labels) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    buttons[label] = btn;
    actionRow.appendChild(btn);
  }
  body.appendChild(actionRow);
  buttons.Reset.addEventListener('click', () => { resetPanel(slot); studio.commit('reset panel'); });
  buttons.Flip.addEventListener('click', () => { slot.flip = !slot.flip; studio.commit('flip panel'); });
  buttons.Swap.addEventListener('click', () => {
    const next = (doc.selected + 1) % planPanels.length;
    const other = planPanels[next].slot;
    const tmp = slot.photo;
    slot.photo = other.photo;
    other.photo = tmp;
    studio.commit('swap panels');
  });
  buttons['Face-mark'].addEventListener('click', () => { slot.faceMarked = !slot.faceMarked; studio.commit('toggle face mark'); });

  const tagLine = document.createElement('label');
  tagLine.className = 'check-line';
  const tagCheck = document.createElement('input');
  tagCheck.type = 'checkbox';
  tagCheck.checked = slot.tagOn !== false;
  tagLine.appendChild(tagCheck);
  tagLine.appendChild(document.createTextNode('Show callout tag on this panel'));
  body.appendChild(tagLine);
  tagCheck.addEventListener('change', () => { slot.tagOn = tagCheck.checked; studio.commit('toggle tag'); });

  const tagField = document.createElement('div');
  tagField.className = 'field';
  tagField.innerHTML = '<label for="tagInput">Callout tag (22 characters max)</label>';
  const tagInput = document.createElement('input');
  tagInput.id = 'tagInput';
  tagInput.type = 'text';
  tagInput.maxLength = 22;
  tagInput.value = slot.tag ?? '';
  tagField.appendChild(tagInput);
  body.appendChild(tagField);
  tagInput.addEventListener('input', () => { slot.tag = tagInput.value.toUpperCase(); studio.renderPreviewOnly(); });
  tagInput.addEventListener('change', () => studio.commit('edit tag'));
}
