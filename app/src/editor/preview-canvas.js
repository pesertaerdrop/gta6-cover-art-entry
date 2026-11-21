// The live preview.
//
// Renders the cover onto #preview (with the editor overlay — numbered
// badges on every panel, an accent outline plus crosshair plus zoom badge
// on the selected one) and owns the pointer listeners: click to select a
// panel, drag to pan it, wheel to zoom it, double-click to reset it,
// Shift-drag to swap it with another. It also keeps the size label and
// the readiness line up to date.
import { renderCover } from '../render/render-cover.js';
import { planCover } from '../layouts/plan-cover.js';
import {
  pointToCanvas,
  startDrag,
  dragPanDelta,
  endDragSwap,
  swapPanelPhotos,
  zoomPanel,
  resetPanel,
} from './panel-gestures.js';

// What the size label says for each cover size, in export pixels.
const EXPORT_LABEL = {
  '16:9': '16:9 wide, 1920 by 1080 export',
  '4:5': '4:5 portrait, 1080 by 1350 export',
  '1:1': '1:1 square, 1080 by 1080 export',
};

export function setupPreviewCanvas(studio) {
  const canvas = document.getElementById('preview');
  let drag = null;
  let draftTimer = null;

  // Draw the cover onto the canvas (resizing the canvas to the plan when
  // the size changed), then refresh the labels. draft draws in fast mode.
  function draw(draft) {
    const plan = planCover(studio.doc);
    if (canvas.width !== plan.w || canvas.height !== plan.h) {
      canvas.width = plan.w;
      canvas.height = plan.h;
    }
    const ctx = canvas.getContext('2d');
    renderCover(ctx, studio.doc, studio.images, { editor: true, draft: draft === true });
    updateReadiness(studio, plan);
    return plan;
  }

  // The size label and the readiness line under the preview: how many
  // panels hold a photo, and how many faces are marked.
  function updateReadiness(studio, plan) {
    const sizeLabel = document.getElementById('sizeLabel');
    if (sizeLabel) sizeLabel.textContent = EXPORT_LABEL[studio.doc.size] || studio.doc.size;
    const readiness = document.getElementById('readiness');
    if (readiness) {
      const filled = plan.panels.filter((panel) => panel.photo).length;
      const marked = plan.panels.filter((panel) => panel.faceMarked).length;
      readiness.textContent = `Ready: ${filled} panels filled${marked ? `, ${marked} face${marked > 1 ? 's' : ''} marked` : ', faces kept whole'}`;
    }
  }

  // Press: pick up the panel under the pointer and select it.
  canvas.addEventListener('pointerdown', (event) => {
    const plan = planCover(studio.doc);
    const point = pointToCanvas(canvas, event.clientX, event.clientY);
    drag = startDrag(plan, point, event.shiftKey);
    if (drag) {
      studio.doc.selected = drag.panelIndex;
      canvas.setPointerCapture(event.pointerId);
      studio.renderPanelsOnly();
    }
  });

  // Move: pan the dragged panel (clamped to the photo) in draft mode.
  canvas.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const plan = planCover(studio.doc);
    const point = pointToCanvas(canvas, event.clientX, event.clientY);
    const rect = plan.panels[drag.panelIndex].rect;
    const delta = dragPanDelta(drag, point, rect);
    const slot = studio.doc.panels[drag.panelIndex];
    slot.panX = Math.max(-1, Math.min(1, (slot.panX || 0) + delta.dx));
    slot.panY = Math.max(-1, Math.min(1, (slot.panY || 0) + delta.dy));
    studio.renderPreviewDraft();
  });

  // Release: a Shift-drag onto another panel swaps the two photos; a
  // plain drag that moved commits the pan.
  canvas.addEventListener('pointerup', (event) => {
    if (!drag) return;
    const plan = planCover(studio.doc);
    const point = pointToCanvas(canvas, event.clientX, event.clientY);
    const target = endDragSwap(plan, drag, point);
    if (target !== null) {
      swapPanelPhotos(studio.doc, drag.panelIndex, target);
      studio.commit('swap panels');
    } else if (drag.moved) {
      studio.commit('pan panel');
    }
    drag = null;
  });

  // Wheel: zoom the selected panel in draft, and commit 400 ms after the
  // last wheel tick so a flurry of ticks becomes one undo step.
  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const slot = studio.selectedSlot();
    if (!slot) return;
    zoomPanel(slot, event.deltaY < 0 ? 1.1 : 0.91);
    studio.renderPreviewDraft();
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => studio.commit('zoom panel'), 400);
  }, { passive: false });

  // Double-click: reset the panel under the pointer.
  canvas.addEventListener('dblclick', (event) => {
    const plan = planCover(studio.doc);
    const point = pointToCanvas(canvas, event.clientX, event.clientY);
    const hit = plan.panels.findIndex((panel) => {
      const r = panel.rect;
      return point.x >= r.x && point.x < r.x + r.w && point.y >= r.y && point.y < r.y + r.h;
    });
    if (hit >= 0) {
      resetPanel(studio.doc.panels[hit]);
      studio.commit('reset panel');
    }
  });

  return { draw };
}
