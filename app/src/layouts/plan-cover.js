// Turns a document into a concrete cover plan: pixel rectangles for every
// panel (with gutters and white borders), the title and script rectangles,
// the resolved title style, and the panels the document describes. Also
// the caption lookup, the shot-scene applier, and the auto-layout picker.
import { CAPTION_DECK } from '../state/default-doc.js';
import { rectsForLayout, layoutPanelCount } from './layout-presets.js';
import { resolveTitleStyle } from '../lettering/title-styles.js';
import { SAMPLE_PHOTOS } from '../photos/sample-photos.js';

export const SIZES = {
  '16:9': { w: 1280, h: 720 },
  '4:5': { w: 1024, h: 1280 },
  '1:1': { w: 1080, h: 1080 },
};

export const GUTTER = 10;
export const BORDER = 6;

export function planCover(doc, overrideSize) {
  const size = overrideSize || SIZES[doc.size] || SIZES['16:9'];
  const { w, h } = size;
  const rects = rectsForLayout(doc.layout, w, h);
  const panels = rects.map((frac, i) => {
    const panel = doc.panels[i] || {};
    const x = Math.round(frac[0] * w) + (i === 0 ? 0 : GUTTER);
    const y = Math.round(frac[1] * h) + (i === 0 ? 0 : GUTTER);
    const pw = Math.round(frac[2] * w) - GUTTER;
    const ph = Math.round(frac[3] * h) - GUTTER;
    const inner = {
      x: x + BORDER,
      y: y + BORDER,
      w: pw - BORDER * 2,
      h: ph - BORDER * 2,
    };
    return {
      ...panel,
      rect: { x, y, w: pw, h: ph },
      inner,
      tag: panel.tag || '',
      tagOn: panel.tagOn !== false,
    };
  });
  const titleText = doc.title && doc.title.trim()
    ? doc.title
    : (CAPTION_DECK[doc.caption]?.title || '');
  return {
    w,
    h,
    panels,
    titleRect: { x: 0.04 * w, y: 0.58 * h, w: 0.92 * w, h: 0.26 * h },
    scriptRect: { x: 0.05 * w, y: 0.9 * h, w: 0.9 * w, h: 0.05 * h },
    titleStyle: resolveTitleStyle(doc.titleStyle, doc.grade),
    titleSize: w * 0.075 * (doc.look.titleSize / 100),
    titleLift: h * 0.03 * (doc.look.titleLift / 100),
    caption: CAPTION_DECK[doc.caption] || CAPTION_DECK[0],
    titleText,
  };
}

// Fill the caption fields of a document from the deck entry it points at,
// letting anything the user typed by hand win over the deck.
export function applyDocCaption(doc) {
  const entry = CAPTION_DECK[doc.caption] || CAPTION_DECK[0];
  for (const field of ['title', 'script', 'tagline', 'quote', 'outlet', 'billing', 'vol', 'comingSoon']) {
    if (!doc[field]) doc[field] = entry[field];
  }
}

// Apply a shot scene to a document: size, layout, grade, title style and
// caption, then one panel per photo index, with optional per-panel zoom
// and pan overrides (scene.panelZooms / scene.panelPans).
export function applyShotScene(doc, scene) {
  doc.size = scene.size;
  doc.layout = scene.layout;
  doc.grade = scene.grade;
  doc.titleStyle = scene.titleStyle || 'auto';
  doc.caption = scene.caption;
  applyDocCaption(doc);
  const photoList = scene.photos || [];
  const tags = scene.tags || [];
  doc.panels = photoList.map((photoIndex, i) => {
    const photo = SAMPLE_PHOTOS[photoIndex];
    return {
      photo: photo ? photo.src : '',
      tag: tags[i] || (photo ? photo.tag : ''),
      tagOn: true,
      zoom: scene.panelZooms ? (scene.panelZooms[i] ?? 1.15) : 1.15,
      panX: scene.panelPans ? (scene.panelPans[i]?.[0] ?? 0) : 0,
      panY: scene.panelPans ? (scene.panelPans[i]?.[1] ?? 0) : 0,
      flip: false,
      faceMarked: scene.faceMarked ? scene.faceMarked.includes(i) : false,
    };
  });
  doc.selected = scene.selected ?? 0;
}

// The layout that fits a panel count: three panels get the diagonal trio,
// four get hero plus three, five get the filmstrip on wide covers and the
// hero mosaic on tall ones, six get the six grid on wide and postcards on
// tall, seven get the seven mosaic; anything else falls back to hero mosaic.
export function autoLayoutFor(doc) {
  const count = doc.panels.length;
  const wide = (SIZES[doc.size] || SIZES['16:9']).w > (SIZES[doc.size] || SIZES['16:9']).h;
  if (count === 3) return 'diagonal-trio';
  if (count === 4) return 'hero-plus-three';
  if (count === 5) return wide ? 'filmstrip' : 'hero-mosaic';
  if (count === 6) return wide ? 'six-grid' : 'postcards';
  if (count === 7) return 'seven-mosaic';
  return 'hero-mosaic';
}

// The panel whose rectangle contains the point (x, y), with its index, or
// null when the point falls on no panel.
export function panelAtPoint(plan, x, y) {
  for (let i = 0; i < plan.panels.length; i++) {
    const rect = plan.panels[i].rect;
    if (x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h) {
      return { ...plan.panels[i], index: i };
    }
  }
  return null;
}

// Re-match a document's panels to a layout: keep the panels it has, trim
// the extras, and fill any shortfall by cycling through the sample photos
// with their default tags.
export function rematchPanels(doc, layoutId) {
  const count = layoutPanelCount(layoutId);
  const panels = doc.panels.slice(0, count);
  let i = panels.length;
  while (panels.length < count) {
    const photo = SAMPLE_PHOTOS[i % SAMPLE_PHOTOS.length];
    panels.push({
      photo: photo.src,
      tag: photo.tag,
      tagOn: true,
      zoom: 1.15,
      panX: 0,
      panY: 0,
      flip: false,
      faceMarked: false,
    });
    i++;
  }
  return panels;
}
