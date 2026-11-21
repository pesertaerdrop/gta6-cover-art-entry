// The live preview canvas: draws the document's cover into #preview and
// wires the pointer at it. Drag pans the photo inside its panel, the
// wheel zooms, Shift-drag swaps two panels' photos, double-click resets
// a panel's framing, and dropping a photo on a panel places it there.
// The canvas is sized to the cover's aspect inside a 1280x720 box, so
// client pixels map to cover pixels with one scale factor. A pan drag
// checkpoints when it starts, so one drag is one undo step even though
// the photo moves on every pointer move.
import { renderCoverToCanvas } from '../render/render-cover.js';
import { planCover } from '../layouts/plan-cover.js';
import { pointToCanvas, hitPanel, startDrag, dragPanDelta, endDragSwap, swapPanelPhotos, zoomPanel, resetPanel } from './panel-gestures.js';

function fitBox(w, h, maxW, maxH) {
  const s = Math.min(maxW / w, maxH / h, 1);
  return { w: Math.round(w * s), h: Math.round(h * s), scale: s };
}

export function setupPreviewCanvas(studio) {
  const canvas = document.getElementById('preview');
  const label = document.getElementById('sizeLabel');
  const readiness = document.getElementById('readiness');

  // Draw the document's cover into the preview canvas, fitted in the box.
  studio.drawPreview = () => {
    const plan = planCover(studio.doc);
    const box = fitBox(plan.w, plan.h, 1280, 720);
    canvas.width = box.w;
    canvas.height = box.h;
    const cover = renderCoverToCanvas(studio.doc, studio.images, { width: box.w, height: box.h });
    const ctx = canvas.getContext('2d');
    ctx.drawImage(cover, 0, 0);
    studio.previewScale = plan.w / box.w;
    studio.previewPlan = plan;
    if (label) label.textContent = `${studio.doc.size} ${plan.w === 1920 ? 'wide' : plan.w === 1080 && plan.h === 1350 ? 'portrait' : 'square'}, ${plan.w} by ${plan.h} export`;
    if (readiness) {
      const filled = studio.doc.panels.filter((p) => p.photo).length;
      readiness.textContent = `Ready: ${filled} panels filled, faces kept whole`;
    }
  };

  const toCover = (clientX, clientY) => {
    const p = pointToCanvas(canvas, clientX, clientY);
    const s = studio.previewScale || 1;
    return { x: p.x * s, y: p.y * s };
  };

  let drag = null;
  let dragBase = null;

  canvas.addEventListener('pointerdown', (e) => {
    const point = toCover(e.clientX, e.clientY);
    drag = startDrag(studio.previewPlan, point, e.shiftKey);
    if (drag) {
      dragBase = { panX: studio.doc.panels[drag.index].panX, panY: studio.doc.panels[drag.index].panY };
      canvas.setPointerCapture(e.pointerId);
      studio.select(drag.index);
      if (!drag.swap) studio.checkpoint();
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const point = toCover(e.clientX, e.clientY);
    if (drag.swap) {
      drag.over = hitPanel(studio.previewPlan, point);
      return;
    }
    const rect = studio.previewPlan.panels[drag.index].rect;
    const d = dragPanDelta(drag, point, rect);
    const panel = studio.doc.panels[drag.index];
    panel.panX = Math.max(-1, Math.min(1, dragBase.panX + d.dx));
    panel.panY = Math.max(-1, Math.min(1, dragBase.panY + d.dy));
    studio.drawPreview();
  });

  canvas.addEventListener('pointerup', (e) => {
    if (!drag) return;
    const point = toCover(e.clientX, e.clientY);
    const swap = endDragSwap(studio.previewPlan, drag, point);
    if (swap) {
      studio.commit(() => swapPanelPhotos(studio.doc, swap.from, swap.to));
    } else {
      studio.drawPreview();
    }
    drag = null;
    dragBase = null;
  });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const point = toCover(e.clientX, e.clientY);
    const index = hitPanel(studio.previewPlan, point);
    if (index === -1) return;
    studio.commit(() => zoomPanel(studio.doc.panels[index], e.deltaY < 0 ? 1.1 : 0.9));
  }, { passive: false });

  canvas.addEventListener('dblclick', (e) => {
    const point = toCover(e.clientX, e.clientY);
    const index = hitPanel(studio.previewPlan, point);
    if (index === -1) return;
    studio.commit(() => resetPanel(studio.doc.panels[index]));
  });

  canvas.addEventListener('dragover', (e) => e.preventDefault());
  canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    const src = e.dataTransfer.getData('text/plain');
    if (!src) return;
    const point = toCover(e.clientX, e.clientY);
    const index = hitPanel(studio.previewPlan, point);
    if (index === -1) return;
    studio.commit(() => {
      studio.doc.panels[index].photo = src;
      studio.select(index);
    });
  });
}
