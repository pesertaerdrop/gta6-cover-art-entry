// The live preview: renders the cover onto #preview (with the editor
// overlay — numbered badges, a pink outline plus crosshair plus zoom badge
// on the selected panel) and owns the pointer listeners: click to select,
// drag to pan, wheel to zoom, double-click to reset, Shift-drag to swap.
// It also keeps the size label and the readiness line up to date.
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

const EXPORT_LABEL = {
  '16:9': '16:9 wide, 1920 by 1080 export',
  '4:5': '4:5 portrait, 1080 by 1350 export',
  '1:1': '1:1 square, 1080 by 1080 export',
};

export function setupPreviewCanvas(studio) {
  const canvas = document.getElementById('preview');
  let drag = null;
  let draftTimer = null;

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

  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const slot = studio.selectedSlot();
    if (!slot) return;
    zoomPanel(slot, event.deltaY < 0 ? 1.1 : 0.91);
    studio.renderPreviewDraft();
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => studio.commit('zoom panel'), 400);
  }, { passive: false });

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
