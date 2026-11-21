// The export panel: the three post sizes and the big orange button.
//
// A cover exports as a PNG in the common post sizes — 1080 by 1080,
// 1080 by 1350 and 1920 by 1080. Each size is rendered fresh from
// the document at its own pixel size, so the PNG is the cover itself,
// never a screenshot of the preview.
import { SIZES } from '../layouts/plan-cover.js';
import { renderCoverToCanvas } from '../render/render-cover.js';

export const EXPORT_SIZES = {
  '16:9': { label: '1920 × 1080 (wide)', file: 'saltline-wide.png' },
  '4:5': { label: '1080 × 1350 (portrait)', file: 'saltline-portrait.png' },
  '1:1': { label: '1080 × 1080 (square)', file: 'saltline-square.png' },
};

// Render every checked size and download it as a PNG.
export async function exportAllSizes(studio) {
  const status = document.getElementById('export-status');
  const sizes = Object.keys(EXPORT_SIZES).filter((size) => {
    const box = document.getElementById('export-' + size);
    return !box || box.checked;
  });
  const picked = sizes.length > 0 ? sizes : ['16:9'];
  for (const size of picked) {
    const canvas = renderCoverToCanvas(studio.doc, studio.images, { size });
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) continue;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = EXPORT_SIZES[size].file;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 5000);
  }
  if (status) {
    status.textContent = `Exported ${picked.length} PNG${picked.length > 1 ? 's' : ''} — ${SIZES[picked[0]].label}.`;
    status.classList.add('ready');
  }
}

export function setupExportPanel(studio) {
  const button = document.getElementById('export-all');
  if (button) button.addEventListener('click', () => exportAllSizes(studio));
}
