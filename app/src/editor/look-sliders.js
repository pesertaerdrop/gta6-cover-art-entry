// look-sliders.js — the seven look sliders: Paint, Grade, Halftone, Grain,
// Glow, Title size (60 to 130) and Title lift (minus 40 to 40). Each row
// shows its live value. While a slider is dragged the preview regrades in
// fast draft mode and settles to full quality when the drag ends.
export const LOOK_SLIDERS = [
  { key: 'paint', label: 'Paint', min: 0, max: 60, step: 1 },
  { key: 'grade', label: 'Grade', min: 0, max: 100, step: 1 },
  { key: 'halftone', label: 'Halftone', min: 0, max: 80, step: 1 },
  { key: 'grain', label: 'Grain', min: 0, max: 80, step: 1 },
  { key: 'glow', label: 'Glow', min: 0, max: 80, step: 1 },
  { key: 'titleSize', label: 'Title size', min: 60, max: 130, step: 1 },
  { key: 'titleLift', label: 'Title lift', min: -40, max: 40, step: 1 },
];

export function renderLookSliders(studio) {
  const host = document.getElementById('lookSliders');
  host.innerHTML = '';
  for (const slider of LOOK_SLIDERS) {
    const row = document.createElement('div');
    row.className = 'slider-row';
    const label = document.createElement('label');
    label.setAttribute('for', `look-${slider.key}`);
    label.textContent = slider.label;
    const input = document.createElement('input');
    input.id = `look-${slider.key}`;
    input.type = 'range';
    input.min = String(slider.min);
    input.max = String(slider.max);
    input.step = String(slider.step);
    input.value = String(studio.doc.look[slider.key]);
    input.setAttribute('aria-label', slider.label);
    const out = document.createElement('output');
    out.textContent = String(studio.doc.look[slider.key]);
    row.appendChild(label);
    row.appendChild(input);
    row.appendChild(out);
    host.appendChild(row);
    let draftTimer = null;
    input.addEventListener('input', () => {
      studio.doc.look[slider.key] = Number(input.value);
      out.textContent = input.value;
      studio.renderPreviewDraft();
      clearTimeout(draftTimer);
      draftTimer = setTimeout(() => studio.render(), 180);
    });
    input.addEventListener('change', () => studio.commit(`look ${slider.key}`));
  }
}
