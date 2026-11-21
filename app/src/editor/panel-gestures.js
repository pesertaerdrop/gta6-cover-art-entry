// Panel gestures: the pointer maths behind dragging a panel. A point is
// carried in cover coordinates (the preview scales client pixels into
// them); a drag is either a pan (move the photo inside its panel) or a
// swap (Shift-drag onto another panel drops the photo there). Pan amounts
// are fractions of the panel, matching the panel's panX/panY fields.
import { panelAtPoint } from '../layouts/plan-cover.js';

// Client pixels on a canvas element into canvas pixels.
export function pointToCanvas(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left) * (canvas.width / rect.width),
    y: (clientY - rect.top) * (canvas.height / rect.height),
  };
}

// The panel under a point in cover coordinates, or -1.
export function hitPanel(plan, point) {
  return panelAtPoint(plan, point.x, point.y);
}

// Begin a drag on a plan: which panel, where it started, and whether the
// Shift key makes it a swap instead of a pan.
export function startDrag(plan, point, shiftKey) {
  const index = hitPanel(plan, point);
  if (index === -1) return null;
  return { index, startX: point.x, startY: point.y, swap: !!shiftKey, over: index };
}

// How far a pan drag has moved, in panel fractions (x and y).
export function dragPanDelta(drag, point, rect) {
  return {
    dx: ((point.x - drag.startX) / rect.w) * 2,
    dy: ((point.y - drag.startY) / rect.h) * 2,
  };
}

// Finish a swap drag: which panels trade photos, or null when the pointer
// never left its panel.
export function endDragSwap(plan, drag, point) {
  if (!drag.swap) return null;
  const over = hitPanel(plan, point);
  if (over === -1 || over === drag.index) return null;
  return { from: drag.index, to: over };
}

// Trade two panels' photos (and their tags) in a document.
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

// Zoom a panel, clamped so a photo never shrinks below its frame.
export function zoomPanel(panel, factor) {
  panel.zoom = Math.max(0.6, Math.min(3, (panel.zoom || 1.15) * factor));
}

// Put a panel back to its default framing.
export function resetPanel(panel) {
  panel.zoom = 1.15;
  panel.panX = 0;
  panel.panY = 0;
  panel.flip = false;
}
