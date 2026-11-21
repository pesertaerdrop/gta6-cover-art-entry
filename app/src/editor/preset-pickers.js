// The preset pickers.
//
// Layout tiles are live mini-drawings of the layout's real panels for the
// current size (the same fractions plan-cover uses, painted in seven flat
// colours). Grade chips show the grade's gradient ramp as a swatch. Title
// chips show the style's own gradient on the word "Aa". The size buttons
// switch the cover size. Picking one commits immediately, so undo can
// step back to the earlier choice.
import { LAYOUT_LIST, rectsForLayout } from '../layouts/layout-presets.js';
import { GRADE_LIST, gradeRampCss } from '../effects/grade-presets.js';
import { TITLE_STYLES, titleStyleCss } from '../lettering/title-styles.js';
import { rematchPanels } from '../layouts/plan-cover.js';

// The seven flat colours the layout minis cycle through, one per panel.
const MINI_COLORS = ['#e8531f', '#2f7fb8', '#e8a317', '#0f7a6e', '#e84a7a', '#7a5fd0', '#3a352f'];

// Paint a layout's panels as flat rectangles on a small canvas.
export function drawLayoutMini(canvas, layoutId) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  ctx.fillStyle = '#f6efe4';
  ctx.fillRect(0, 0, W, H);
  const fractions = rectsForLayout(layoutId, W, H);
  fractions.forEach((f, i) => {
    ctx.fillStyle = MINI_COLORS[i % MINI_COLORS.length];
    ctx.fillRect(f[0] * W + 1, f[1] * H + 1, f[2] * W - 2, f[3] * H - 2);
  });
}

// One picker button: the pressed state, a label, and a click handler.
function pickButton(host, pressed, label, onPick) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'pick';
  btn.setAttribute('aria-pressed', String(pressed));
  const name = document.createElement('span');
  name.className = 'pick-name';
  name.textContent = label;
  btn.appendChild(name);
  btn.addEventListener('click', onPick);
  host.appendChild(btn);
  return btn;
}

export function renderLayoutPicker(studio) {
  const host = document.getElementById('layoutPicker');
  if (!host) return;
  host.innerHTML = '';
  for (const layout of LAYOUT_LIST) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pick';
    btn.setAttribute('aria-pressed', String(studio.doc.layout === layout.id));
    const mini = document.createElement('canvas');
    mini.width = 240;
    mini.height = 88;
    drawLayoutMini(mini, layout.id);
    const name = document.createElement('span');
    name.className = 'pick-name';
    name.textContent = layout.label;
    btn.appendChild(mini);
    btn.appendChild(name);
    btn.title = `${layout.label} — ${layout.panels} panels`;
    btn.addEventListener('click', () => {
      studio.doc.layout = layout.id;
      studio.doc.panels = rematchPanels(studio.doc, layout.id);
      studio.doc.selected = 0;
      studio.commit('change layout');
    });
    host.appendChild(btn);
  }
}

export function renderGradePicker(studio) {
  const host = document.getElementById('gradePicker');
  if (!host) return;
  host.innerHTML = '';
  for (const grade of GRADE_LIST) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pick';
    btn.setAttribute('aria-pressed', String(studio.doc.grade === grade.id));
    const swatch = document.createElement('span');
    swatch.className = 'swatch';
    swatch.style.background = gradeRampCss(grade.id);
    const name = document.createElement('span');
    name.className = 'pick-name';
    name.textContent = grade.label;
    btn.appendChild(swatch);
    btn.appendChild(name);
    btn.addEventListener('click', () => {
      studio.doc.grade = grade.id;
      studio.commit('change grade');
    });
    host.appendChild(btn);
  }
}

// The title picker: an Auto button first (the style follows the grade),
// then one button per style, each showing its gradient on "Aa".
export function renderTitlePicker(studio) {
  const host = document.getElementById('titlePicker');
  if (!host) return;
  host.innerHTML = '';
  const autoBtn = document.createElement('button');
  autoBtn.type = 'button';
  autoBtn.className = 'pick';
  autoBtn.setAttribute('aria-pressed', String(studio.doc.titleStyle === 'auto'));
  const autoChip = document.createElement('span');
  autoChip.className = 'title-chip';
  autoChip.textContent = 'Aa';
  const autoName = document.createElement('span');
  autoName.className = 'pick-name';
  autoName.textContent = 'Auto (match grade)';
  autoBtn.appendChild(autoChip);
  autoBtn.appendChild(autoName);
  autoBtn.addEventListener('click', () => {
    studio.doc.titleStyle = 'auto';
    studio.commit('title style auto');
  });
  host.appendChild(autoBtn);
  for (const style of TITLE_STYLES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pick';
    btn.setAttribute('aria-pressed', String(studio.doc.titleStyle === style.id));
    const chip = document.createElement('span');
    chip.className = 'title-chip';
    chip.textContent = 'Aa';
    chip.style.background = titleStyleCss(style.id);
    chip.style.webkitBackgroundClip = 'text';
    chip.style.backgroundClip = 'text';
    chip.style.color = 'transparent';
    const name = document.createElement('span');
    name.className = 'pick-name';
    name.textContent = style.label;
    btn.appendChild(chip);
    btn.appendChild(name);
    btn.addEventListener('click', () => {
      studio.doc.titleStyle = style.id;
      studio.commit('change title style');
    });
    host.appendChild(btn);
  }
}

// The size buttons live in the HTML; this only marks the active one and
// wires the click (changing size re-matches the panels to the layout).
export function renderSizePicker(studio) {
  const host = document.getElementById('sizePicker');
  if (!host) return;
  host.querySelectorAll('button[data-size]').forEach((button) => {
    const active = studio.doc.size === button.dataset.size;
    button.classList.toggle('primary', active);
    button.setAttribute('aria-pressed', String(active));
    button.onclick = () => {
      studio.doc.size = button.dataset.size;
      studio.doc.panels = rematchPanels(studio.doc, studio.doc.layout);
      studio.commit('change size');
    };
  });
}
