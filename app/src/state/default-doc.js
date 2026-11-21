// default-doc.js — the starting document for Saltline Cover Studio.
// One document describes a whole cover: size, layout, grade, title, the seven
// look dials, the poster-finish text, and one slot per panel. Panels hold a
// photo, a callout tag, and their own crop (zoom, pan, flip, face mark).
import { SAMPLE_PHOTOS, DEFAULT_TAGS } from '../photos/sample-photos.js';

export const SIZES = {
  '1:1': { label: '1:1 square', width: 1080, height: 1080 },
  '4:5': { label: '4:5 portrait', width: 1080, height: 1350 },
  '16:9': { label: '16:9 wide', width: 1920, height: 1080 },
};

export const DEFAULT_LOOK = {
  paint: 10,
  grade: 62,
  halftone: 20,
  grain: 22,
  glow: 26,
  titleSize: 100,
  titleLift: 0,
};

export function makePanel(photoIndex, tag) {
  return {
    photo: SAMPLE_PHOTOS[photoIndex % SAMPLE_PHOTOS.length].file,
    tag: tag ?? DEFAULT_TAGS[photoIndex % DEFAULT_TAGS.length],
    tagOn: true,
    zoom: 1.15,
    panX: 0,
    panY: 0,
    flip: false,
    faceMarked: true,
  };
}

export function defaultDoc() {
  return {
    size: '16:9',
    layout: 'hero-mosaic',
    grade: 'sunset',
    titleStyle: 'auto',
    title: 'TIDELINE',
    script: 'chasing the last light',
    tagline: 'A SALTLINE ORIGINAL',
    quote: 'Salt air and high stakes, beautifully shot',
    outlet: 'THE BOARDWALK LEDGER',
    billing: 'A Saltline Pictures production, starring Vera, Marcus, June and Otis, shot on the coast, graded by hand',
    vol: 'VOL. 2',
    comingSoon: true,
    sealText: 'SALTLINE ORIGINAL',
    look: { ...DEFAULT_LOOK },
    selected: 0,
    panels: [
      makePanel(14, 'THE ACE'),
      makePanel(1, 'THE SCOUT'),
      makePanel(2, 'THE PILOT'),
      makePanel(3, 'THE HOST'),
      makePanel(4, 'THE RUNNER'),
      makePanel(5, 'THE ARTIST'),
      makePanel(6, 'THE DANCER'),
    ],
  };
}

export function cloneDoc(doc) {
  return JSON.parse(JSON.stringify(doc));
}

export function docToJson(doc) {
  return JSON.stringify(doc);
}

export function docFromJson(text) {
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.panels)) {
    throw new Error('not a Saltline document');
  }
  return parsed;
}
