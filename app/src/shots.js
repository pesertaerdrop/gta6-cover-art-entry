// Neon Coast Cover Studio — fixed scenes for screenshots.
//
// ?shot=editor shows the editor with a cover loaded; ?shot=cover,
// ?shot=cover2 and ?shot=grid show one exported cover alone, full frame.
// Every parameter is explicit in the query so a screenshot is repeatable:
// layout, grade, size, title, subtitle, badge and the photos, comma
// separated. window.__shotReady is set once the cover has painted.

import { LAYOUTS, GRADES, SAMPLES } from './presets.js';
import { remapPanelsForLayout, autoFillPanels } from './state.js';

function paintWhenReady() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__shotReady = true;
      resolve();
    }));
  });
}

export async function applyShotScene(app, query) {
  const shot = query.get('shot') || 'editor';
  if (shot !== 'editor') document.body.classList.add('shot-cover');

  const layout = query.get('layout');
  if (layout && LAYOUTS[layout]) app.state.layout = layout;
  const grade = query.get('grade');
  if (grade && GRADES[grade]) app.state.grade = grade;
  const size = query.get('size');
  if (size) app.state.size = size;
  if (query.get('title') !== null) app.state.title = query.get('title');
  if (query.get('subtitle') !== null) app.state.subtitle = query.get('subtitle');
  if (query.get('badge') !== null) app.state.badge = query.get('badge');

  const wanted = (query.get('photos') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const known = wanted.filter((id) => SAMPLES.some((s) => s.id === id));
  const photoIds = known.length ? known : SAMPLES.map((s) => s.id);

  remapPanelsForLayout(app.state, photoIds);
  autoFillPanels(app.state, photoIds);
  app.state.selected = 0;

  for (const id of new Set(app.state.panels.map((p) => p.photoId))) {
    if (id) await app.loadPhoto(id);
  }
  if (app.framePanels) app.framePanels();
  app.redraw();
  await paintWhenReady();
}
