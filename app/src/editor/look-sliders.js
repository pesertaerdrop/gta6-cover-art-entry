// The look sliders: the seven dials that tune a cover's finish — paint
// (posterise), grade (ramp strength), halftone (dot overlay), grain
// (noise), glow (highlight lift), title size and title lift. Dragging a
// slider redraws the preview live; the change is checkpointed when the
// drag starts, so one drag is one undo step.
const SLIDER_DEFS = [
  { key: 'paint', label: 'Paint', min: 0, max: 100 },
  { key: 'grade', label: 'Grade', min: 0, max: 100 },
  { key: 'halftone', label: 'Halftone', min: 0, max: 100 },
  { key: 'grain', label: 'Grain', min: 0, max: 100 },
  { key: 'glow', label: 'Glow', min: 0, max: 100 },
  { key: 'titleSize', label: 'Title size', min: 50, max: 150 },
  { key: 'titleLift', label: 'Title lift', min: -30, max: 30 },
];

export function renderLookSliders(studio) {
  const host = document.getElementById('lookSliders');
  if (!host) return;
  host.innerHTML = '';
  for (const def of SLIDER_DEFS) {
    const row = document.createElement('div');
    row.className = 'slider-row';
    const label = document.createElement('label');
    label.textContent = def.label;
    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(def.min);
    input.max = String(def.max);
    input.value = String(studio.doc.look[def.key]);
    input.setAttribute('aria-label', def.label);
    const out = document.createElement('output');
    out.textContent = String(studio.doc.look[def.key]);
    input.addEventListener('pointerdown', () => studio.checkpoint());
    input.addEventListener('input', () => {
      studio.doc.look[def.key] = Number(input.value);
      out.textContent = input.value;
      studio.drawPreview();
    });
    input.addEventListener('change', () => studio.drawPreview());
    row.append(label, input, out);
    host.appendChild(row);
  }
}
