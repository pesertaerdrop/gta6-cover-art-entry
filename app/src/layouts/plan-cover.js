// plan-cover.js — turns a document into a concrete cover plan: pixel
// rectangles for every panel (with gutters and white borders), the title
// band, and which panel slot each rectangle shows. Changing size re-matches
// photos: the plan always fills every rectangle from the document's panels
// in order, wrapping, so no panel is ever empty after a size change.
import { layoutById } from './layout-presets.js';
import { SIZES } from '../state/default-doc.js';

export function planCover(doc) {
  const size = SIZES[doc.size] ?? SIZES['16:9'];
  const layout = layoutById(doc.layout);
  const gutter = Math.round(size.width * 0.012);
  const fractions = layout.panels(size.width, size.height);
  const panels = fractions.map((fraction, index) => {
    const slot = doc.panels[index % doc.panels.length];
    const rect = {
      x: Math.round(fraction.x * size.width) + gutter / 2,
      y: Math.round(fraction.y * size.height) + gutter / 2,
      w: Math.round(fraction.w * size.width) - gutter,
      h: Math.round(fraction.h * size.height) - gutter,
    };
    // Leave the bottom strip for the review-quote bar so no callout tag
    // ever slides under it.
    const bottomLimit = Math.round(size.height * 0.935);
    if (rect.y + rect.h > bottomLimit) rect.h = Math.max(40, bottomLimit - rect.y);
    return { rect, tilt: fraction.tilt ?? 0, slot, index, number: index + 1 };
  });
  const titleZone = {
    x: Math.round(size.width * 0.04),
    y: Math.round(size.height * 0.66),
    w: Math.round(size.width * 0.92),
    h: Math.round(size.height * 0.3),
  };
  return { size, layout, panels, titleZone, gutter };
}

export function rematchPanels(doc, layoutId) {
  const layout = layoutById(layoutId);
  const needed = layout.panels(100, 100).length;
  const panels = doc.panels.slice(0, needed);
  while (panels.length < needed) {
    const source = doc.panels[panels.length % doc.panels.length];
    panels.push({ ...source });
  }
  return panels;
}

export function panelCenter(panel) {
  return {
    x: panel.rect.x + panel.rect.w / 2,
    y: panel.rect.y + panel.rect.h / 2,
  };
}

export function panelAtPoint(plan, px, py) {
  for (let i = plan.panels.length - 1; i >= 0; i -= 1) {
    const { rect } = plan.panels[i];
    if (px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h) {
      return plan.panels[i];
    }
  }
  return null;
}
