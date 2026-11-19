// Fixed scenes for screenshots. ?shot=editor shows the editor with a photo
// loaded; ?shot=cover, ?shot=cover2 and ?shot=grid show the exported cover
// alone, at the size the query names. window.__shotReady is set once the
// cover has painted, and window.__coverApp exposes the export the test
// driver calls.

import { SIZES } from './state.js';
import { layoutById } from './layouts.js';
import { drawCover, exportPNGDataURL } from './cover.js';
import { panelsForPhotos } from './presets.js';

function readShotQuery() {
  const q = new URLSearchParams(window.location.search);
  return {
    shot: q.get('shot') ?? 'editor',
    sizeId: q.get('size') ?? '1080x1080',
    layoutId: q.get('layout'),
    gradeId: q.get('grade'),
    title: q.get('title'),
    subtitle: q.get('subtitle'),
    badge: q.get('badge'),
    photos: q.get('photos') ? q.get('photos').split(',').map((s) => s.trim()).filter(Boolean) : null,
  };
}

function applyShotToState(state, shot, images) {
  if (shot.layoutId) state.layoutId = shot.layoutId;
  if (shot.gradeId) state.gradeId = shot.gradeId;
  if (shot.title) state.title = shot.title;
  if (shot.subtitle) state.subtitle = shot.subtitle;
  if (shot.badge) state.badge = shot.badge;
  if (shot.sizeId && SIZES[shot.sizeId]) state.sizeId = shot.sizeId;
  const layout = layoutById(state.layoutId);
  const size = SIZES[state.sizeId];
  const photoH = layout.titleOverlay ? size.h : size.h * 0.8;
  const rects = layout.panels().map((p) => ({
    w: p.w * size.w,
    h: p.h * photoH,
  }));
  const wanted = shot.photos ?? state.photos.map((p) => p.id);
  state.panels = panelsForPhotos(wanted, layout.panelCount, images, rects);
  state.selected = 0;
}

export async function runShotScene(state, images, renderPreview) {
  const shot = readShotQuery();
  applyShotToState(state, shot, images);
  await document.fonts.ready;

  if (shot.shot === 'cover' || shot.shot === 'cover2' || shot.shot === 'grid') {
    document.body.classList.add('shot-cover');
    const size = SIZES[state.sizeId];
    const canvas = document.getElementById('preview');
    canvas.width = size.w;
    canvas.height = size.h;
    drawCover(canvas, state, images);
  } else {
    await renderPreview();
  }

  window.__coverApp = {
    state,
    exportPNGDataURL: (sizeId) => exportPNGDataURL(sizeId, state, images),
    renderPreview,
  };

  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
