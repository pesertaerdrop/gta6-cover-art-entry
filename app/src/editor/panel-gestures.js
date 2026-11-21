// The pointer math for the preview.
//
// Hit-testing a point against the plan's rectangles, dragging to pan a
// panel, wheeling to zoom, double-clicking to reset, and Shift-dragging
// one panel onto another to swap their photos. The preview canvas owns
// the listeners; this module owns the geometry so the gestures stay
// testable and small.
import { panelAtPoint } from '../layouts/plan-cover.js';

// Convert a pointer event's client coordinates into canvas pixels.
export function pointToCanvas(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left) * (canvas.width / rect.width),
    y: (clientY - rect.top) * (canvas.height / rect.height),
  };
}

// The panel under a point, or null when the point falls on no panel.
export function hitPanel(plan, point) {
  return panelAtPoint(plan, point.x, point.y);
}

// Begin a drag on the panel under the point (or null). The drag records
// where it started, where it was last, and whether Shift was held (a
// Shift-drag swaps photos on release instead of panning).
export function startDrag(plan, point, shiftKey) {
  const panel = hitPanel(plan, point);
  if (!panel) return null;
  return {
    panelIndex: panel.index,
    startX: point.x,
    startY: point.y,
    lastX: point.x,
    lastY: point.y,
    shiftKey,
    moved: false,
  };
}

// The pan for a drag step: the pointer's movement as a fraction of the
// panel, scaled up (×2.2) so a drag moves the photo a useful amount.
// A move of more than 4 px marks the drag as moved.
export function dragPanDelta(drag, point, rect) {
  const dx = (point.x - drag.lastX) / Math.max(1, rect.w);
  const dy = (point.y - drag.lastY) / Math.max(1, rect.h);
  drag.lastX = point.x;
  drag.lastY = point.y;
  if (Math.abs(point.x - drag.startX) > 4 || Math.abs(point.y - drag.startY) > 4) drag.moved = true;
  return { dx: dx * 2.2, dy: dy * 2.2 };
}

// The swap target for a Shift-drag's release: the panel under the point,
// or null when the drag was not a Shift-drag or landed on its own panel.
export function endDragSwap(plan, drag, point) {
  if (!drag.shiftKey) return null;
  const target = hitPanel(plan, point);
  if (!target || target.index === drag.panelIndex) return null;
  return target.index;
}

// Swap the photos of two document panels (their tags stay with the slots).
export function swapPanelPhotos(doc, a, b) {
  const photo = doc.panels[a].photo;
  doc.panels[a].photo = doc.panels[b].photo;
  doc.panels[b].photo = photo;
}

// Zoom a panel by a factor, clamped to 1×–4×.
export function zoomPanel(panel, factor) {
  panel.zoom = Math.max(1, Math.min(4, (panel.zoom || 1) * factor));
}

// Reset a panel's crop: zoom 1×, no pan, no flip, no face mark.
export function resetPanel(panel) {
  panel.zoom = 1;
  panel.panX = 0;
  panel.panY = 0;
  panel.flip = false;
  panel.faceMarked = false;
}
