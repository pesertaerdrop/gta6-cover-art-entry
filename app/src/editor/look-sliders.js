// The seven look sliders.
//
// Paint, Grade, Halftone, Grain, Glow, Title size (60 to 130) and Title
// lift (minus 40 to 40). Each row shows the name, the slider and the
// current value; dragging regrades in fast draft mode and settles to full
// quality when the slider is released, and the release commits the change
// so undo can step back.
const SLIDERS = [
  { key: 'paint', label: 'Paint', min: 0, max: 20, step: 1 },
  { key: 'grade', label: 'Grade', min: 0, max: 100, step: 1 },
  { key: 'halftone', label: 'Halftone', min: 0, max: 100, step: 1 },
  { key: 'grain', label: 'Grain', min: 0, max: 100, step: 1 },
  { key: 'glow', label: 'Glow', min: 0, max: 100, step: 1 },
  { key: 'titleSize', label: 'Title size', min: 60, max: 130, step: 1 },
  { key: 'titleLift', label: 'Title lift', min: -40, max: 40, step: 1 },
];

export function renderLookSliders(studio) {
  const host = document.getElementById('lookSliders');
  if (!host) return;
  host.innerHTML = '';
  for (const slider of SLIDERS) {
    const row = document.createElement('div');
    row.className = 'slider-row';
    const label = document.createElement('label');
    label.textContent = slider.label;
    label.htmlFor = `look-${slider.key}`;
    const input = document.createElement('input');
    input.type = 'range';
    input.id = `look-${slider.key}`;
    input.min = String(slider.min);
    input.max = String(slider.max);
    input.step = String(slider.step);
    input.value = String(studio.doc.look[slider.key]);
    const output = document.createElement('output');
    output.textContent = String(studio.doc.look[slider.key]);
    input.addEventListener('input', () => {
      studio.doc.look[slider.key] = Number(input.value);
      output.textContent = input.value;
      studio.renderPreviewDraft();
    });
    input.addEventListener('change', () => studio.commit(`look ${slider.label}`));
    row.appendChild(label);
    row.appendChild(input);
    row.appendChild(output);
    host.appendChild(row);
  }
}
