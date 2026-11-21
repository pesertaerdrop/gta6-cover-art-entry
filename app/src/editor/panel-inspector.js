// The panel inspector: the card that edits the selected panel.
//
// It shows the panel's photo as a thumbnail, names the panel and its
// photo, and offers the per-panel controls: zoom, previous and next
// photo, reset, flip, swap with the next panel, mark the face (which
// keeps the crop honest), and the callout tag text. The controls are
// wired once; every render after that only updates their values.
import { labelOf, nextSamplePhoto } from '../photos/sample-photos.js';
import { resetPanel } from './panel-gestures.js';

export function renderInspector(studio) {
  const doc = studio.doc;
  const panel = doc.panels[doc.selected] || doc.panels[0];
  if (!panel) return;
  const thumb = document.getElementById('inspector-thumb');
  if (thumb) {
    const img = studio.images.get ? studio.images.get(panel.photo) : studio.images[panel.photo];
    const tctx = thumb.getContext('2d');
    if (img && img.naturalWidth > 0) {
      const scale = Math.max(thumb.width / img.naturalWidth, thumb.height / img.naturalHeight);
      const sw = thumb.width / scale;
      const sh = thumb.height / scale;
      tctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, 0, 0, thumb.width, thumb.height);
    } else {
      tctx.fillStyle = '#2a2521';
      tctx.fillRect(0, 0, thumb.width, thumb.height);
    }
  }
  const who = document.getElementById('inspector-who');
  if (who) who.textContent = `Panel ${doc.selected + 1} — ${labelOf(panel.photo) || 'Your photo'}`;
  const note = document.getElementById('inspector-note');
  if (note) note.textContent = panel.faceMarked ? 'Face marked — crop keeps it whole' : 'Smart crop, faces kept whole';
  const zoom = document.getElementById('inspector-zoom');
  const zoomValue = document.getElementById('inspector-zoom-value');
  if (zoom) {
    if (document.activeElement !== zoom) zoom.value = String(Math.round(panel.zoom * 100));
    if (zoomValue) zoomValue.textContent = `${Math.round(panel.zoom * 100)}%`;
  }
  const tag = document.getElementById('panel-tag');
  if (tag && document.activeElement !== tag) tag.value = panel.tag || '';
  if (thumb && !thumb.dataset.wired) {
    thumb.dataset.wired = '1';
    const wire = (id, fn) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', fn);
    };
    wire('photo-prev', () => {
      const prev = nextSamplePhoto(panel.photo, -1);
      panel.photo = prev.src;
      panel.tag = prev.tag;
      studio.commit();
      studio.render();
    });
    wire('photo-next', () => {
      const next = nextSamplePhoto(panel.photo, 1);
      panel.photo = next.src;
      panel.tag = next.tag;
      studio.commit();
      studio.render();
    });
    wire('panel-reset', () => { resetPanel(panel); studio.commit(); studio.render(); });
    wire('panel-flip', () => { panel.flip = !panel.flip; studio.commit(); studio.render(); });
    wire('panel-swap', () => {
      const other = (doc.selected + 1) % doc.panels.length;
      const a = doc.panels[doc.selected];
      const b = doc.panels[other];
      const photo = a.photo;
      const tagText = a.tag;
      a.photo = b.photo; a.tag = b.tag;
      b.photo = photo; b.tag = tagText;
      studio.commit();
      studio.render();
    });
    wire('panel-mark-face', () => { panel.faceMarked = !panel.faceMarked; studio.commit(); studio.render(); });
    if (zoom) {
      zoom.addEventListener('input', () => {
        panel.zoom = Math.max(1, Math.min(3, Number(zoom.value) / 100));
        if (zoomValue) zoomValue.textContent = `${zoom.value}%`;
        studio.render();
      });
      zoom.addEventListener('change', () => studio.commit());
    }
    if (tag) {
      tag.addEventListener('input', () => {
        panel.tag = tag.value.toUpperCase();
        studio.commit();
        studio.render();
      });
    }
  }
}
