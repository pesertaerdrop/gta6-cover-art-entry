// Turning a document into a cover plan.
//
// A plan is everything the renderer needs: the cover's pixel size, the
// rectangle of every panel with the photo and crop it carries, the
// title field below the panels, and the caption with the user's own
// words winning over the deck. The panels take the top 62% of the
// cover; the title field takes the bottom 38% and is a clean, dark
// space of its own — no panel ever covers the title, and no title ever
// covers a face.
import { CAPTION_DECK } from '../state/default-doc.js';
import { SAMPLE_PHOTOS } from '../photos/sample-photos.js';
import { rectsForLayout, layoutPanelCount } from './layout-presets.js';

// The three export sizes: wide, portrait, square.
export const SIZES = {
  '16:9': { w: 1920, h: 1080, label: '16:9 wide' },
  '4:5': { w: 1080, h: 1350, label: '4:5 portrait' },
  '1:1': { w: 1080, h: 1080, label: '1:1 square' },
};

export const GUTTER = 10;
export const BORDER = 6;
export const FIELD_H = 0.38;

// The caption a cover actually shows: the deck entry, with anything
// the user typed by hand winning over it.
export function applyDocCaption(doc) {
  const deck = CAPTION_DECK[doc.caption] || CAPTION_DECK[0];
  const pick = (key) => (doc[key] !== undefined && doc[key] !== '' ? doc[key] : deck[key]);
  return {
    title: pick('title'),
    script: pick('script'),
    tagline: pick('tagline'),
    quote: pick('quote'),
    outlet: pick('outlet'),
    billing: pick('billing'),
    vol: pick('vol'),
    comingSoon: pick('comingSoon'),
    field: deck.field,
  };
}

// Plan a cover from a document. `overrideSize` draws it at another
// export size without changing the document.
export function planCover(doc, overrideSize) {
  const size = SIZES[overrideSize || doc.size] || SIZES['16:9'];
  const w = size.w;
  const h = size.h;
  const panelH = Math.round(h * (1 - FIELD_H));
  const zone = { x: BORDER, y: BORDER, w: w - 2 * BORDER, h: panelH - BORDER };
  const rects = rectsForLayout(doc.layout, zone.w, zone.h);
  const panels = rects.map((rect, i) => {
    const panel = doc.panels[i] || doc.panels[doc.panels.length - 1];
    return {
      ...panel,
      rect: { x: rect.x + zone.x, y: rect.y + zone.y, w: rect.w, h: rect.h },
      index: i,
    };
  });
  return {
    w,
    h,
    size: doc.size,
    layout: doc.layout,
    caption: applyDocCaption(doc),
    panels,
    panelH,
    field: { x: 0, y: panelH, w, h: h - panelH },
  };
}

// Apply a shot scene to a document: its size, layout, grade, caption
// and the photo, tag and crop of every panel.
export function applyShotScene(doc, scene) {
  doc.size = scene.size;
  doc.layout = scene.layout;
  doc.grade = scene.grade;
  doc.titleStyle = scene.titleStyle || 'auto';
  doc.caption = scene.caption;
  doc.panels = scene.panels.map((shot) => ({
    photo: 'samples/' + shot.file,
    tag: shot.tag,
    tagOn: true,
    zoom: shot.zoom ?? 1.15,
    panX: shot.panX ?? 0,
    panY: shot.panY ?? 0,
    tagDy: shot.tagDy ?? 0,
    flip: false,
    faceMarked: false,
  }));
  doc.selected = 0;
}

// Pick the layout that fits a panel count: two panels split, three go
// diagonal, four grid, five strip, six hero, seven mosaic.
export function autoLayoutFor(doc) {
  const count = doc.panels.length;
  if (count <= 2) return 'duo-split';
  if (count === 3) return 'diagonal-trio';
  if (count === 4) return 'quad-grid';
  if (count === 5) return 'film-strip';
  if (count >= 7) return 'seven-mosaic';
  return 'hero-mosaic';
}

// Which panel, if any, holds the point (in cover pixels).
export function panelAtPoint(plan, x, y) {
  for (const panel of plan.panels) {
    const r = panel.rect;
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return panel.index;
  }
  return -1;
}

// Reshape a document's panels to a layout: keep the photos it has,
// fill the rest from the sample set in order, trim the extras.
export function rematchPanels(doc, layoutId) {
  const want = layoutPanelCount(layoutId);
  const kept = doc.panels.slice(0, want);
  let next = 0;
  while (kept.length < want) {
    const photo = SAMPLE_PHOTOS[next % SAMPLE_PHOTOS.length];
    next += 1;
    kept.push({
      photo: photo.src,
      tag: photo.tag,
      tagOn: true,
      zoom: 1.15,
      panX: 0,
      panY: 0,
      flip: false,
      faceMarked: false,
    });
  }
  doc.panels = kept;
  doc.layout = layoutId;
  if (doc.selected >= kept.length) doc.selected = 0;
}
