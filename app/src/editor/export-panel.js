// The export panel.
//
// Per-size checkboxes for the three post sizes (1080 by 1080, 1080 by
// 1350, 1920 by 1080), the big Export all three button, and the status
// line. Each chosen size renders the cover at exactly those pixels and
// downloads as a PNG named saltline-<size>.png.
import { renderCoverToCanvas } from '../render/render-cover.js';

// The three post sizes in export pixels.
export const EXPORT_SIZES = {
  '1:1': { w: 1080, h: 1080, label: '1080 by 1080 square' },
  '4:5': { w: 1080, h: 1350, label: '1080 by 1350 portrait' },
  '16:9': { w: 1920, h: 1080, label: '1920 by 1080 wide' },
};

// The sizes whose checkboxes are ticked, in the order they appear.
function checkedSizes() {
  return [...document.querySelectorAll('input[data-export-size]:checked')].map((input) => input.dataset.exportSize);
}

// Download a canvas as a PNG file, resolving true when the blob was made.
function downloadPng(canvas, filename) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) { resolve(false); return; }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      resolve(true);
    }, 'image/png');
  });
}

// Export every ticked size, one after another, and report how many
// landed on the status line.
export async function exportAllSizes(studio) {
  const status = document.getElementById('exportStatus');
  const sizes = checkedSizes();
  if (sizes.length === 0) {
    if (status) {
      status.textContent = 'Tick at least one size above, then export.';
      status.classList.remove('ready');
    }
    return;
  }
  if (status) status.textContent = `Exporting ${sizes.length} size${sizes.length > 1 ? 's' : ''}…`;
  let done = 0;
  for (const sizeId of sizes) {
    const size = EXPORT_SIZES[sizeId];
    if (!size) continue;
    const canvas = renderCoverToCanvas(studio.doc, studio.images, { size: { w: size.w, h: size.h } });
    const ok = await downloadPng(canvas, `saltline-${sizeId.replace(':', 'x')}.png`);
    if (ok) done++;
  }
  if (status) {
    status.textContent = done === sizes.length
      ? `Exported ${done} PNG${done > 1 ? 's' : ''}.`
      : `Exported ${done} of ${sizes.length} sizes — try again for the rest.`;
    status.classList.toggle('ready', done === sizes.length);
  }
}

export function setupExportPanel(studio) {
  const btn = document.getElementById('exportAllBtn');
  if (btn) btn.addEventListener('click', () => exportAllSizes(studio));
}
