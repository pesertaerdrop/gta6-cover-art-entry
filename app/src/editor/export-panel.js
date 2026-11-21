// The export panel: three size checkboxes and the big export button.
// Each checked size renders the cover at its post size and downloads it
// as a PNG; the filenames name the cover and the size, so a shared file
// is self-describing. Exports run one at a time and report each file as
// it lands.
import { renderCoverToCanvas } from '../render/render-cover.js';
import { applyDocCaption } from '../layouts/plan-cover.js';

export const EXPORT_SIZES = {
  '16:9': { w: 1920, h: 1080, label: '1920 \u00d7 1080 (wide)' },
  '4:5': { w: 1080, h: 1350, label: '1080 \u00d7 1350 (portrait)' },
  '1:1': { w: 1080, h: 1080, label: '1080 \u00d7 1080 (square)' },
};

function slug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'saltline';
}

function download(canvas, name) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return resolve(false);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      resolve(true);
    }, 'image/png');
  });
}

export async function exportAllSizes(studio) {
  const status = document.getElementById('exportStatus');
  const title = slug(applyDocCaption(studio.doc).title);
  const picked = [...document.querySelectorAll('.export-sizes input[type="checkbox"]:checked')]
    .map((box) => box.value)
    .filter((id) => EXPORT_SIZES[id]);
  const sizes = picked.length ? picked : [studio.doc.size];
  let done = 0;
  for (const id of sizes) {
    const size = EXPORT_SIZES[id];
    const canvas = renderCoverToCanvas(studio.doc, studio.images, { size: id, width: size.w, height: size.h });
    const ok = await download(canvas, `${title}-${id}.png`);
    if (ok) done++;
    if (status) status.textContent = `Exported ${done} of ${sizes.length} \u2014 ${size.label}.`;
  }
  if (status) status.textContent = done === sizes.length ? `Ready. Exported ${done} PNG${done === 1 ? '' : 's'}.` : `Exported ${done} of ${sizes.length}.`;
  return done;
}

export function setupExportPanel(studio) {
  const host = document.querySelector('.export-sizes');
  if (host) {
    host.innerHTML = '';
    for (const [id, size] of Object.entries(EXPORT_SIZES)) {
      const label = document.createElement('label');
      const box = document.createElement('input');
      box.type = 'checkbox';
      box.value = id;
      box.checked = id === studio.doc.size;
      label.append(box, document.createTextNode(` ${size.label}`));
      host.appendChild(label);
    }
  }
  const btn = document.getElementById('exportAllBtn');
  if (btn) btn.addEventListener('click', () => exportAllSizes(studio));
}
