// The preview canvas: the live cover in the middle of the stage.
//
// The canvas shows the cover the document describes, drawn at its
// export size and scaled to fit. Dragging pans the photo under the
// pointer, the wheel zooms, Shift-drag swaps two panels, and a
// double-click resets the crop. The canvas is sized to its box at the
// device pixel ratio so the preview stays sharp.
import { planCover } from '../layouts/plan-cover.js';
import { renderCoverToCanvas } from '../render/render-cover.js';
import { pointToCanvas, startDrag, dragPanDelta, endDragSwap, swapPanelPhotos, zoomPanel, resetPanel } from './panel-gestures.js';

// Draw the current cover into the preview canvas, scaled to fit.
export function drawPreview(studio) {
  const canvas = document.getElementById('preview-canvas');
  if (!canvas) return;
  const plan = planCover(studio.doc);
  const box = canvas.parentElement.getBoundingClientRect();
  const cssW = Math.max(320, Math.floor(box.width));
  const cssH = Math.round((cssW * plan.h) / plan.w);
  const ratio = window.devicePixelRatio || 1;
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  canvas.width = Math.round(cssW * ratio);
  canvas.height = Math.round(cssH * ratio);
  const cover = renderCoverToCanvas(studio.doc, studio.images);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(cover, 0, 0, canvas.width, canvas.height);
  const meta = document.getElementById('preview-meta');
  if (meta) {
    const size = plan.w + ' by ' + plan.h;
    meta.textContent = plan.size + ', ' + size + ' export';
  }
  const readiness = document.getElementById('readiness');
  if (readiness) {
    readiness.textContent = `Ready: ${plan.panels.length} panels filled, faces kept whole`;
  }
}

export function setupPreviewCanvas(studio) {
  const canvas = document.getElementById('preview-canvas');
  if (!canvas) return;
  let drag = null;
  const toCoverPoint = (event) => {
    const point = pointToCanvas(canvas, event.clientX, event.clientY);
    const plan = planCover(studio.doc);
    return { x: (point.x / canvas.width) * plan.w, y: (point.y / canvas.height) * plan.h, plan };
  };
  canvas.addEventListener('pointerdown', (event) => {
    const { x, y, plan } = toCoverPoint(event);
    drag = startDrag(plan, { x, y }, event.shiftKey);
    if (drag) {
      studio.doc.selected = drag.index;
      studio.render();
      canvas.setPointerCapture(event.pointerId);
    }
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!drag || drag.mode !== 'pan') return;
    const { x, y, plan } = toCoverPoint(event);
    const panel = studio.doc.panels[drag.index];
    const rect = plan.panels[drag.index].rect;
    const next = dragPanDelta(drag, { x, y }, rect);
    panel.panX = next.panX;
    panel.panY = next.panY;
    studio.render();
  });
  canvas.addEventListener('pointerup', (event) => {
    if (!drag) return;
    const { x, y, plan } = toCoverPoint(event);
    const target = endDragSwap(plan, drag, { x, y });
    if (target >= 0) {
      swapPanelPhotos(studio.doc, drag.index, target);
      studio.doc.selected = target;
    }
    drag = null;
    studio.commit();
    studio.render();
  });
  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const { x, y, plan } = toCoverPoint(event);
    const index = plan.panels.findIndex((p) => {
      const r = p.rect;
      return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
    });
    if (index < 0) return;
    studio.doc.selected = index;
    zoomPanel(studio.doc.panels[index], event.deltaY < 0 ? 1.12 : 1 / 1.12);
    studio.commit();
    studio.render();
  }, { passive: false });
  canvas.addEventListener('dblclick', (event) => {
    const { x, y, plan } = toCoverPoint(event);
    const index = plan.panels.findIndex((p) => {
      const r = p.rect;
      return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
    });
    if (index < 0) return;
    resetPanel(studio.doc.panels[index]);
    studio.commit();
    studio.render();
  });
}
