// export-panel.js — the export panel: per-size checkboxes for the three post
// sizes (1080x1080, 1080x1350, 1920x1080), the big Export all three button,
// and a status line that reports readiness and what was just exported.
// Exports are PNG files downloaded from the canvas on this machine.
import { exportCoverPng } from '../render/render-cover.js';
import { SIZES } from '../state/default-doc.js';

export function setupExportPanel(studio) {
  const button = document.getElementById('exportAllBtn');
  const status = document.getElementById('exportStatus');
  const boxes = [...document.querySelectorAll('[data-export-size]')];
  button.addEventListener('click', async () => {
    const chosen = boxes.filter((box) => box.checked).map((box) => box.dataset.exportSize);
    if (chosen.length === 0) {
      status.textContent = 'Pick at least one size above first.';
      status.classList.remove('ready');
      return;
    }
    button.disabled = true;
    status.textContent = `Exporting ${chosen.length} cover${chosen.length > 1 ? 's' : ''}...`;
    status.classList.remove('ready');
    let done = 0;
    for (const sizeKey of chosen) {
      const blob = await exportCoverPng(studio.doc, studio.images, sizeKey);
      const size = SIZES[sizeKey];
      downloadBlob(blob, `saltline-${studio.doc.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${size.width}x${size.height}.png`);
      done += 1;
      status.textContent = `Exported ${done} of ${chosen.length}...`;
    }
    status.textContent = `Done: ${done} PNG${done > 1 ? 's' : ''} exported (${chosen.join(', ')}).`;
    status.classList.add('ready');
    button.disabled = false;
  });
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function exportStatusReady() {
  const status = document.getElementById('exportStatus');
  if (status) {
    status.textContent = 'Ready to export. Pick sizes above, then export.';
    status.classList.add('ready');
  }
}
