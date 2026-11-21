// The cover plan: where every panel and the title field sit, and which
// caption the cover shows. A cover is two bands: the panel band on top
// (62% of the height) and the title field below it (38%). The plan is a
// plain object the renderer, the inspector and the gesture code all read:
//   { size, w, h, panelArea, field, panels, caption, style, grade }
// where panels carry both their rect and their document data (photo, tag,
// zoom, pan, flip), merged so the renderer never looks the doc up again.
import { CAPTION_DECK } from '../state/default-doc.js';
import { SAMPLE_PHOTOS } from '../photos/sample-photos.js';
import { rectsForLayout, layoutPanelCount } from './layout-presets.js';
import { gradeById } from '../effects/grade-presets.js';
import { resolveTitleStyle } from '../lettering/title-styles.js';

export const SIZES = {
  '16:9': { w: 1920, h: 1080, label: '16:9 wide' },
  '4:5': { w: 1080, h: 1350, label: '4:5 portrait' },
  '1:1': { w: 1080, h: 1080, label: '1:1 square' },
};

export const GUTTER = 10;
export const BORDER = 6;
export const FIELD_H = 0.38;

// Resolve the caption a document shows: the deck entry at doc.caption,
// with any field the user typed by hand winning over the deck.
export function applyDocCaption(doc) {
  const deck = CAPTION_DECK[doc.caption] || CAPTION_DECK[0];
  const pick = (key) => (doc[key] !== undefined && doc[key] !== '' ? doc[key] : deck[key]);
  return {
    id: deck.id,
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

// Build the full plan for a document, optionally at another size.
export function planCover(doc, overrideSize) {
  const size = SIZES[overrideSize || doc.size] || SIZES['16:9'];
  const w = size.w;
  const h = size.h;
  const panelH = Math.round(h * (1 - FIELD_H));
  const panelArea = { x: 0, y: 0, w, h: panelH };
  const field = { x: 0, y: panelH, w, h: h - panelH };
  const rects = rectsForLayout(doc.layout, w, panelH);
  const caption = applyDocCaption(doc);
  const panels = rects.map((rect, i) => {
    const data = doc.panels[i] || doc.panels[0];
    return { ...data, rect, index: i };
  });
  return {
    size, w, h, panelArea, field, panels, caption,
    style: resolveTitleStyle(doc.titleStyle, doc.grade),
    grade: gradeById(doc.grade),
  };
}

// Apply a shot scene to a document in place: size, layout, grade,
// caption, the scene's panels (photo, tag, zoom, pan) and selection.
export function applyShotScene(doc, scene) {
  if (!scene) return doc;
  if (scene.size) doc.size = scene.size;
  if (scene.layout) doc.layout = scene.layout;
  if (scene.grade) doc.grade = scene.grade;
  if (scene.titleStyle) doc.titleStyle = scene.titleStyle;
  if (scene.caption !== undefined) doc.caption = scene.caption;
  if (scene.panels) {
    doc.panels = scene.panels.map((p) => ({
      photo: p.photo,
      tag: p.tag,
      tagOn: p.tagOn !== false,
      zoom: p.zoom ?? 1.15,
      panX: p.panX ?? 0,
      panY: p.panY ?? 0,
      flip: !!p.flip,
      faceMarked: !!p.faceMarked,
    }));
  }
  if (scene.selected !== undefined) doc.selected = scene.selected;
  return doc;
}

// Pick the layout that fits a document's panel count.
export function autoLayoutFor(doc) {
  const n = doc.panels.length;
  if (n <= 2) return 'duo-split';
  if (n === 3) return 'diagonal-trio';
  if (n === 4) return 'quad-grid';
  if (n === 5) return 'film-strip';
  if (n === 6) return 'hero-mosaic';
  return 'seven-mosaic';
}

// The index of the panel under a point in cover coordinates, or -1.
export function panelAtPoint(plan, x, y) {
  for (let i = 0; i < plan.panels.length; i++) {
    const r = plan.panels[i].rect;
    if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return i;
  }
  return -1;
}

// Resize a document's panels to a layout's panel count, keeping the
// photos already placed and filling new slots from the samples.
export function rematchPanels(doc, layoutId) {
  const want = layoutPanelCount(layoutId);
  const next = doc.panels.slice(0, want);
  for (let i = next.length; i < want; i++) {
    const photo = SAMPLE_PHOTOS[i % SAMPLE_PHOTOS.length];
    next.push({
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
  doc.panels = next;
  doc.layout = layoutId;
  if (doc.selected >= want) doc.selected = 0;
  return doc;
}
