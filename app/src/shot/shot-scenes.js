// shot-scenes.js — the four screenshot scenes. The app reads ?shot= from
// the URL: cover scenes draw one cover full-frame (the app itself drawing
// the cover, no composited picture), and the editor scene opens the editor
// with a photo loaded and a panel selected. Each scene is a different
// poster: different layout, grade, title and quote, one franchise system.
import { CAPTION_DECK } from '../editor/cover-actions.js';
import { SAMPLE_PHOTOS, DEFAULT_TAGS } from '../photos/sample-photos.js';
import { rematchPanels } from '../layouts/plan-cover.js';

export const SHOT_SCENES = {
  cover1: {
    mode: 'cover',
    size: '16:9',
    layout: 'hero-mosaic',
    grade: 'sunset',
    caption: 0,
    photos: [14, 1, 2, 3, 4],
  },
  editor: {
    mode: 'editor',
    size: '16:9',
    layout: 'diagonal-trio',
    grade: 'neon-night',
    caption: 1,
    photos: [10, 2, 11],
    selected: 1,
  },
  cover3: {
    mode: 'cover',
    size: '4:5',
    layout: 'six-grid',
    grade: 'golden-hour',
    caption: 2,
    photos: [15, 5, 9, 6, 7, 4],
  },
  cover4: {
    mode: 'cover',
    size: '1:1',
    layout: 'seven-mosaic',
    grade: 'tropic-teal',
    caption: 3,
    photos: [16, 0, 5, 8, 11, 1, 3],
  },
};

export function sceneFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (!shot) return null;
  return SHOT_SCENES[shot] ?? null;
}

export function applyShotScene(doc, scene) {
  const caption = CAPTION_DECK[scene.caption];
  doc.size = scene.size;
  doc.layout = scene.layout;
  doc.grade = scene.grade;
  doc.titleStyle = 'auto';
  doc.title = caption.title;
  doc.script = caption.script;
  doc.tagline = caption.tagline;
  doc.quote = caption.quote;
  doc.outlet = caption.outlet;
  doc.vol = caption.vol;
  doc.panels = scene.photos.map((photoIndex, i) => ({
    photo: SAMPLE_PHOTOS[photoIndex].file,
    tag: DEFAULT_TAGS[i % DEFAULT_TAGS.length],
    tagOn: true,
    zoom: 1.15,
    panX: 0,
    panY: 0,
    flip: false,
    faceMarked: true,
  }));
  doc.panels = rematchPanels(doc, doc.layout);
  doc.selected = scene.selected ?? 0;
  return doc;
}

export function sceneMode(scene) {
  return scene ? scene.mode : 'editor';
}
