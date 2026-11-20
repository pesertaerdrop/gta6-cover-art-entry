// preset-pickers.js — the three preset pickers. Layout tiles are live
// mini-drawings of the layout's real panels for the current size; grade
// chips show the gradient ramp as a swatch; title chips show the style's own
// gradient on the word "Aa". Picking one commits immediately.
import { LAYOUTS, layoutById } from '../layouts/layout-presets.js';
import { GRADES, gradeRampCss } from '../effects/grade-presets.js';
import { TITLE_STYLES, titleStyleCss, AUTO_STYLE_BY_GRADE } from '../lettering/title-styles.js';
import { rematchPanels } from '../layouts/plan-cover.js';

export function renderLayoutPicker(studio) {
  const host = document.getElementById('layoutPicker');
  host.innerHTML = '';
  for (const layout of LAYOUTS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pick';
    btn.setAttribute('aria-pressed', String(studio.doc.layout === layout.id));
    const mini = document.createElement('canvas');
    mini.width = 240;
    mini.height = 88;
    drawLayoutMini(mini, layout);
    const name = document.createElement('span');
    name.className = 'pick-name';
    name.textContent = layout.name;
    btn.appendChild(mini);
    btn.appendChild(name);
    btn.title = layout.blurb;
    btn.addEventListener('click', () => {
      studio.doc.layout = layout.id;
      studio.doc.panels = rematchPanels(studio.doc, layout.id);
      studio.doc.selected = 0;
      studio.commit('change layout');
    });
    host.appendChild(btn);
  }
}

export function drawLayoutMini(canvas, layout) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  ctx.fillStyle = '#f6efe4';
  ctx.fillRect(0, 0, W, H);
  const fractions = layout.panels(W, H);
  fractions.forEach((f, i) => {
    ctx.fillStyle = i === 0 ? '#e8531f' : '#2f7fb8';
    ctx.fillRect(f.x * W + 2, f.y * H + 2, f.w * W - 4, f.h * H - 4);
  });
  ctx.fillStyle = '#e8a317';
  ctx.fillRect(W * 0.06, H * 0.78, W * 0.6, H * 0.1);
}

export function renderGradePicker(studio) {
  const host = document.getElementById('gradePicker');
  host.innerHTML = '';
  for (const grade of GRADES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pick';
    btn.setAttribute('aria-pressed', String(studio.doc.grade === grade.id));
    const swatch = document.createElement('span');
    swatch.className = 'swatch';
    swatch.style.background = gradeRampCss(grade);
    const name = document.createElement('span');
    name.className = 'pick-name';
    name.textContent = grade.name;
    btn.appendChild(swatch);
    btn.appendChild(name);
    btn.title = grade.blurb;
    btn.addEventListener('click', () => {
      studio.doc.grade = grade.id;
      studio.commit('change grade');
    });
    host.appendChild(btn);
  }
}

export function renderTitlePicker(studio) {
  const host = document.getElementById('titlePicker');
  host.innerHTML = '';
  const autoBtn = document.createElement('button');
  autoBtn.type = 'button';
  autoBtn.className = 'pick';
  autoBtn.setAttribute('aria-pressed', String(studio.doc.titleStyle === 'auto'));
  const autoChip = document.createElement('span');
  autoChip.className = 'title-chip';
  autoChip.textContent = 'Auto';
  autoChip.style.background = 'linear-gradient(180deg, #ffe9a8, #e8531f)';
  autoChip.style.webkitBackgroundClip = 'text';
  autoChip.style.backgroundClip = 'text';
  autoChip.style.color = 'transparent';
  const autoName = document.createElement('span');
  autoName.className = 'pick-name';
  autoName.textContent = `Match grade (${AUTO_STYLE_BY_GRADE[studio.doc.grade] ?? 'sunset-chrome'})`;
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
    chip.style.background = titleStyleCss(style);
    chip.style.webkitBackgroundClip = 'text';
    chip.style.backgroundClip = 'text';
    chip.style.color = 'transparent';
    chip.style.fontFamily = style.font;
    const name = document.createElement('span');
    name.className = 'pick-name';
    name.textContent = style.name;
    btn.appendChild(chip);
    btn.appendChild(name);
    btn.title = style.blurb;
    btn.addEventListener('click', () => {
      studio.doc.titleStyle = style.id;
      studio.commit('change title style');
    });
    host.appendChild(btn);
  }
}

export function layoutName(id) {
  return layoutById(id).name;
}
