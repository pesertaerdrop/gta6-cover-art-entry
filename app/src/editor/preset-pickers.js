// The preset pickers: layout, grade, title style and size.
//
// Each picker is a row of two-across buttons. A layout tile is a live
// mini-drawing of its panels, a grade chip is the grade's gradient
// swatch, a title chip is the style's gradient on the word "Aa". The
// pressed button wears the orange ring. The pickers are built once;
// every render after that only moves the ring.
import { LAYOUT_LIST, rectsForLayout } from '../layouts/layout-presets.js';
import { GRADE_LIST, gradeRampCss } from '../effects/grade-presets.js';
import { TITLE_STYLES, titleStyleCss } from '../lettering/title-styles.js';
import { SIZES } from '../layouts/plan-cover.js';
import { rematchPanels } from '../layouts/plan-cover.js';

// A mini-drawing of a layout's panels, fitted into the tile canvas.
export function drawLayoutMini(canvas, layoutId) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = '#1d1a16';
  ctx.fillRect(0, 0, w, h);
  const rects = rectsForLayout(layoutId, w - 8, h - 8);
  ctx.fillStyle = '#e8531f';
  for (const rect of rects) {
    ctx.fillRect(rect.x + 4, rect.y + 4, rect.w, rect.h);
  }
}

function buildPicker(hostId, entries, current, onPick, draw) {
  const host = document.getElementById(hostId);
  if (!host) return;
  if (!host.dataset.built) {
    for (const entry of entries) {
      const button = document.createElement('button');
      button.className = 'pick';
      button.type = 'button';
      button.dataset.value = entry.id;
      draw(button, entry);
      const name = document.createElement('span');
      name.className = 'pick-name';
      name.textContent = entry.label;
      button.appendChild(name);
      button.addEventListener('click', () => onPick(entry.id));
      host.appendChild(button);
    }
    host.dataset.built = '1';
  }
  for (const button of host.querySelectorAll('.pick')) {
    button.setAttribute('aria-pressed', String(button.dataset.value === current));
  }
}

export function renderLayoutPicker(studio) {
  buildPicker('layout-picker', LAYOUT_LIST, studio.doc.layout, (id) => {
    rematchPanels(studio.doc, id);
    studio.commit();
    studio.render();
  }, (button, entry) => {
    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 44;
    drawLayoutMini(canvas, entry.id);
    button.appendChild(canvas);
  });
}

export function renderGradePicker(studio) {
  buildPicker('grade-picker', GRADE_LIST, studio.doc.grade, (id) => {
    studio.doc.grade = id;
    studio.commit();
    studio.render();
  }, (button, entry) => {
    const swatch = document.createElement('span');
    swatch.className = 'swatch';
    swatch.style.background = gradeRampCss(entry.id);
    button.appendChild(swatch);
  });
}

export function renderTitlePicker(studio) {
  const entries = [{ id: 'auto', label: 'Auto' }, ...TITLE_STYLES];
  buildPicker('title-picker', entries, studio.doc.titleStyle, (id) => {
    studio.doc.titleStyle = id;
    studio.commit();
    studio.render();
  }, (button, entry) => {
    const chip = document.createElement('span');
    chip.className = 'title-chip';
    chip.textContent = 'Aa';
    if (entry.id !== 'auto') chip.style.background = titleStyleCss(entry.id);
    button.appendChild(chip);
  });
}

export function renderSizePicker(studio) {
  const entries = Object.entries(SIZES).map(([id, size]) => ({ id, label: size.label }));
  buildPicker('size-picker', entries, studio.doc.size, (id) => {
    studio.doc.size = id;
    studio.commit();
    studio.render();
  }, () => {});
}
