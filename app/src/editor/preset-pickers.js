// The preset pickers: layout, grade, title style and size. Each picker
// is a grid of buttons in the left and right rails; the pressed one is
// marked with aria-pressed. Layout tiles draw a live mini-map of the
// layout, grade chips show the grade's ramp, title chips show the style's
// gradient on the word Aa, and size buttons name the export shape.
import { LAYOUT_LIST, rectsForLayout } from '../layouts/layout-presets.js';
import { GRADE_LIST, gradeRampCss } from '../effects/grade-presets.js';
import { TITLE_STYLES, titleStyleCss } from '../lettering/title-styles.js';
import { SIZES } from '../layouts/plan-cover.js';
import { rematchPanels } from '../layouts/plan-cover.js';

// A mini-map of a layout: the panel rects scaled into a small canvas.
export function drawLayoutMini(canvas, layoutId) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = '#141210';
  ctx.fillRect(0, 0, w, h);
  const rects = rectsForLayout(layoutId, 100, 62);
  for (const r of rects) {
    ctx.fillStyle = '#f6efe4';
    ctx.fillRect((r.x / 100) * w + 1, (r.y / 62) * h + 1, (r.w / 100) * w - 2, (r.h / 62) * h - 2);
  }
}

function pickButton(studio, pressed, label, onPick) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'pick';
  b.setAttribute('aria-pressed', pressed ? 'true' : 'false');
  const name = document.createElement('span');
  name.className = 'pick-name';
  name.textContent = label;
  b.appendChild(name);
  b.addEventListener('click', () => studio.commit(onPick));
  return b;
}

export function renderLayoutPicker(studio) {
  const host = document.getElementById('layoutPicker');
  if (!host) return;
  host.innerHTML = '';
  for (const layout of LAYOUT_LIST) {
    const b = pickButton(studio, studio.doc.layout === layout.id, layout.label, () => {
      rematchPanels(studio.doc, layout.id);
    });
    const mini = document.createElement('canvas');
    mini.width = 120;
    mini.height = 44;
    drawLayoutMini(mini, layout.id);
    b.insertBefore(mini, b.firstChild);
    host.appendChild(b);
  }
}

export function renderGradePicker(studio) {
  const host = document.getElementById('gradePicker');
  if (!host) return;
  host.innerHTML = '';
  for (const grade of GRADE_LIST) {
    const b = pickButton(studio, studio.doc.grade === grade.id, grade.label, () => {
      studio.doc.grade = grade.id;
    });
    const swatch = document.createElement('span');
    swatch.className = 'swatch';
    swatch.style.background = gradeRampCss(grade.id);
    b.insertBefore(swatch, b.firstChild);
    host.appendChild(b);
  }
}

export function renderTitlePicker(studio) {
  const host = document.getElementById('titlePicker');
  if (!host) return;
  host.innerHTML = '';
  const auto = pickButton(studio, studio.doc.titleStyle === 'auto', 'Auto', () => {
    studio.doc.titleStyle = 'auto';
  });
  const autoChip = document.createElement('span');
  autoChip.className = 'title-chip';
  autoChip.textContent = 'Aa';
  auto.insertBefore(autoChip, auto.firstChild);
  host.appendChild(auto);
  for (const style of TITLE_STYLES) {
    const b = pickButton(studio, studio.doc.titleStyle === style.id, style.label, () => {
      studio.doc.titleStyle = style.id;
    });
    const chip = document.createElement('span');
    chip.className = 'title-chip';
    chip.textContent = 'Aa';
    chip.style.background = titleStyleCss(style.id);
    chip.style.webkitBackgroundClip = 'text';
    chip.style.backgroundClip = 'text';
    chip.style.color = 'transparent';
    b.insertBefore(chip, b.firstChild);
    host.appendChild(b);
  }
}

export function renderSizePicker(studio) {
  const host = document.getElementById('sizePicker');
  if (!host) return;
  host.innerHTML = '';
  for (const [id, size] of Object.entries(SIZES)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = `${id} \u00b7 ${size.w}\u00d7${size.h}`;
    b.setAttribute('aria-pressed', studio.doc.size === id ? 'true' : 'false');
    b.addEventListener('click', () => studio.commit(() => { studio.doc.size = id; }));
    host.appendChild(b);
  }
}
