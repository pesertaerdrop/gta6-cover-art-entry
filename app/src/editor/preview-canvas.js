// preview-canvas.js — the live preview: renders the cover onto #preview and
// draws the editor overlay onto #overlay: numbered badges on every panel,
// a pink outline plus crosshair plus zoom badge on the selected panel.
// It also owns the pointer listeners (click to select, drag to pan, wheel
// to zoom, double-click to reset, Shift-drag to swap) and keeps the preview
// canvas sized to the document's aspect ratio.
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

export function setupPreviewCanvas(studio) {
  const canvas = document.getElementById('preview');
  const overlay = document.getElementById('overlay');
  let drag = null;
  let draftTimer = null;

  function draw(draft) {
    const plan = renderCover(canvas, studio.doc, studio.images, { draft: draft === true });
    drawOverlay(overlay, plan, studio.doc);
    updateReadiness(studio, plan);
    return plan;
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
    const panel = plan.panels[drag.panelIndex];
    if (!panel) return;
    const delta = dragPanDelta(drag, point, panel.rect);
    const slot = panel.slot;
    slot.panX = Math.max(-1, Math.min(1, (slot.panX || 0) + delta.dx));
    slot.panY = Math.max(-1, Math.min(1, (slot.panY || 0) + delta.dy));
    draw(true);
  });

  canvas.addEventListener('pointerup', (event) => {
    if (!drag) return;
    const plan = planCover(studio.doc);
    const point = pointToCanvas(canvas, event.clientX, event.clientY);
    const swap = endDragSwap(plan, drag, point);
    const moved = drag.moved;
    drag = null;
    if (swap) {
      swapPanelPhotos(studio.doc, swap.from, swap.to);
      studio.commit('swap panels');
    } else if (moved) {
      studio.commit('pan panel');
    } else {
      studio.renderPanelsOnly();
    }
  });

  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const plan = planCover(studio.doc);
    const point = pointToCanvas(canvas, event.clientX, event.clientY);
    const panel = plan.panels.find((p) => {
      const r = p.rect;
      return point.x >= r.x && point.x <= r.x + r.w && point.y >= r.y && point.y <= r.y + r.h;
    });
    if (!panel) return;
    zoomPanel(panel.slot, event.deltaY < 0 ? 1.08 : 0.93);
    studio.doc.selected = panel.index;
    draw(true);
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => studio.render(), 220);
  }, { passive: false });

  canvas.addEventListener('dblclick', (event) => {
    const plan = planCover(studio.doc);
    const point = pointToCanvas(canvas, event.clientX, event.clientY);
    const panel = plan.panels.find((p) => {
      const r = p.rect;
      return point.x >= r.x && point.x <= r.x + r.w && point.y >= r.y && point.y <= r.y + r.h;
    });
    if (!panel) return;
    resetPanel(panel.slot);
    studio.commit('reset panel');
  });

  return { draw };
}

export function drawOverlay(overlay, plan, doc) {
  overlay.width = plan.size.width;
  overlay.height = plan.size.height;
  const ctx = overlay.getContext('2d');
  ctx.clearRect(0, 0, overlay.width, overlay.height);
  const badgeR = Math.max(18, Math.round(plan.size.width * 0.016));
  plan.panels.forEach((panel) => {
    const { rect } = panel;
    const cx = rect.x + badgeR + 6;
    const cy = rect.y + badgeR + 6;
    ctx.beginPath();
    ctx.arc(cx, cy, badgeR, 0, Math.PI * 2);
    ctx.fillStyle = panel.index === doc.selected ? '#e8531f' : 'rgba(20, 18, 16, 0.9)';
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `700 ${Math.round(badgeR * 0.95)}px Oswald, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(panel.number), cx, cy + 1);
    if (panel.index === doc.selected) {
      ctx.save();
      ctx.strokeStyle = '#e84a7a';
      ctx.lineWidth = Math.max(3, Math.round(plan.size.width * 0.003));
      ctx.strokeRect(rect.x - 3, rect.y - 3, rect.w + 6, rect.h + 6);
      const mx = rect.x + rect.w / 2;
      const my = rect.y + rect.h / 2;
      const arm = Math.min(rect.w, rect.h) * 0.14;
      ctx.beginPath();
      ctx.moveTo(mx - arm, my);
      ctx.lineTo(mx + arm, my);
      ctx.moveTo(mx, my - arm);
      ctx.lineTo(mx, my + arm);
      ctx.stroke();
      const zoomText = `${(panel.slot.zoom || 1).toFixed(1)}x`;
      ctx.font = `700 ${Math.round(badgeR * 0.9)}px Oswald, sans-serif`;
      const tw = ctx.measureText(zoomText).width + badgeR;
      ctx.fillStyle = '#e84a7a';
      ctx.fillRect(rect.x + rect.w - tw - 8, rect.y + 8, tw, badgeR * 1.7);
      ctx.fillStyle = '#fff';
      ctx.fillText(zoomText, rect.x + rect.w - tw / 2 - 8, rect.y + 8 + badgeR * 0.85);
      ctx.restore();
    }
  });
}

export function updateReadiness(studio, plan) {
  const filled = plan.panels.filter((p) => p.slot.photo).length;
  const faces = plan.panels.filter((p) => p.slot.faceMarked).length;
  const out = document.getElementById('readiness');
  if (out) out.textContent = `Ready: ${filled} panels filled, ${faces} faces kept whole`;
  const sizeLabel = document.getElementById('sizeLabel');
  if (sizeLabel) {
    sizeLabel.textContent = `${plan.size.label ?? studio.doc.size}, ${plan.size.width} by ${plan.size.height} export`;
  }
}
