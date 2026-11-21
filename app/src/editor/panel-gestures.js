// Panel gestures: dragging, zooming and swapping on the preview.
//
// Drag a panel to pan its photo, wheel to zoom, Shift-drag onto
// another panel to swap the two photos, double-click to reset the
// crop. The functions here are pure — they take a plan and a point in
// cover pixels and return what changed — so the preview canvas stays
// thin and the logic stays testable.
import { panelAtPoint } from '../layouts/plan-cover.js';

// Convert a pointer event's client position into canvas pixels.
export function pointToCanvas(canvas, clientX, clientY) {
  const box = canvas.getBoundingClientRect();
  const scaleX = canvas.width / box.width;
  const scaleY = canvas.height / box.height;
  return { x: (clientX - box.left) * scaleX, y: (clientY - box.top) * scaleY };
}

// Which panel a point in cover pixels lands on, or -1.
export function hitPanel(plan, point) {
  return panelAtPoint(plan, point.x, point.y);
}

// Begin a drag: returns the drag state, or null when the point hits
// no panel. Shift means "swap" instead of "pan".
export function startDrag(plan, point, shiftKey) {
  const index = hitPanel(plan, point);
  if (index < 0) return null;
  const panel = plan.panels[index];
  return {
    index,
    mode: shiftKey ? 'swap' : 'pan',
    startX: point.x,
    startY: point.y,
    panX: panel.panX,
    panY: panel.panY,
  };
}

// The pan for a drag in progress, in crop units (-1 to 1).
export function dragPanDelta(drag, point, rect) {
  const dx = (point.x - drag.startX) / Math.max(1, rect.w);
  const dy = (point.y - drag.startY) / Math.max(1, rect.h);
  return {
    panX: Math.max(-1, Math.min(1, drag.panX - dx * 2)),
    panY: Math.max(-1, Math.min(1, drag.panY - dy * 2)),
  };
}

// The panel a swap drag ends on, or -1 when it ends where it began.
export function endDragSwap(plan, drag, point) {
  if (drag.mode !== 'swap') return -1;
  const target = hitPanel(plan, point);
  return target === drag.index ? -1 : target;
}

// Swap the photos (and their tags) of two panels.
export function swapPanelPhotos(doc, a, b) {
  const pa = doc.panels[a];
  const pb = doc.panels[b];
  if (!pa || !pb) return;
  const photo = pa.photo;
  const tag = pa.tag;
  pa.photo = pb.photo;
  pa.tag = pb.tag;
  pb.photo = photo;
  pb.tag = tag;
}

// Zoom a panel by a factor, clamped to the 1–3 range.
export function zoomPanel(panel, factor) {
  panel.zoom = Math.max(1, Math.min(3, panel.zoom * factor));
}

// Reset a panel's crop to the fresh values.
export function resetPanel(panel) {
  panel.zoom = 1.15;
  panel.panX = 0;
  panel.panY = 0;
  panel.flip = false;
}
