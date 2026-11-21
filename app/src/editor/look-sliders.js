// The look sliders: the seven controls that grade the cover.
//
// Paint, grade, halftone, grain and glow shape the photos; title size
// and title lift shape the title. The rows are built here from the
// list below, so the editor's look card always matches the document's
// look object. Dragging a slider re-renders live and records the
// change when the drag ends.
const SLIDERS = [
  { key: 'paint', label: 'Paint', min: 0, max: 100 },
  { key: 'grade', label: 'Grade', min: 0, max: 100 },
  { key: 'halftone', label: 'Halftone', min: 0, max: 100 },
  { key: 'grain', label: 'Grain', min: 0, max: 100 },
  { key: 'glow', label: 'Glow', min: 0, max: 100 },
  { key: 'titleSize', label: 'Title size', min: 50, max: 150 },
  { key: 'titleLift', label: 'Title lift', min: -20, max: 20 },
];

export function renderLookSliders(studio) {
  const host = document.getElementById('look-sliders');
  if (!host) return;
  if (!host.dataset.built) {
    for (const slider of SLIDERS) {
      const row = document.createElement('div');
      row.className = 'slider-row';
      const label = document.createElement('label');
      label.textContent = slider.label;
      label.htmlFor = 'look-' + slider.key;
      const input = document.createElement('input');
      input.type = 'range';
      input.id = 'look-' + slider.key;
      input.min = String(slider.min);
      input.max = String(slider.max);
      const output = document.createElement('output');
      output.id = 'look-' + slider.key + '-value';
      input.addEventListener('input', () => {
        studio.doc.look[slider.key] = Number(input.value);
        output.textContent = input.value;
        studio.render();
      });
      input.addEventListener('change', () => studio.commit());
      row.append(label, input, output);
      host.appendChild(row);
    }
    host.dataset.built = '1';
  }
  for (const slider of SLIDERS) {
    const input = document.getElementById('look-' + slider.key);
    const output = document.getElementById('look-' + slider.key + '-value');
    if (!input || !output) continue;
    if (document.activeElement !== input) input.value = String(studio.doc.look[slider.key]);
    output.textContent = String(studio.doc.look[slider.key]);
  }
}
