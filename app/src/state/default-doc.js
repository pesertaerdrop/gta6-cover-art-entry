// The starting document and the caption deck. The deck holds six
// ready-made captions; every cover draws its title, script line, tagline,
// review quote and outlet, billing line, volume tag and coming-soon line
// from the deck entry its caption index points at. Anything the user types
// by hand wins over the deck entry. The `field` key picks the title-field
// motif for the cover: palms, a retro grid floor, or a skyline silhouette.
// A deck row is [id, title, script, tagline, quote, outlet, vol, field].
import { SAMPLE_PHOTOS } from '../photos/sample-photos.js';

export const BILLING_LINE = 'A Saltline Pictures production, starring Mira and Suki, shot on the coast, graded by hand';

const DECK_ROWS = [
  ['tideline', 'TIDELINE', 'A coastal epic of two outlaws', 'THEIR STORY BEGINS', 'A poster that pops off the page', 'NEON MAGAZINE', 'VOL. 1', 'palms'],
  ['midnight-tide', 'MIDNIGHT TIDE', 'Midnight tide, moonlit streets', 'A TALE OF TWO TIDES', 'Gorgeous, chaotic, unforgettable', 'SUNSET REVIEW', 'VOL. 2', 'grid'],
  ['ember-coast', 'EMBER COAST', 'One last ride along the coast', 'A FAREWELL TO PARADISE', 'The boldest poster of the year', 'VICE CITY WEEKLY', 'VOL. 3', 'grid'],
  ['saltwater', 'SALTWATER', 'The truth lies beneath', 'THE TIDE ALWAYS RETURNS', 'Raw, real, and beautifully shot', 'COASTLINE REVIEW', 'VOL. 4', 'skyline'],
  ['palm-light', 'PALM LIGHT', 'City of dreams, city of gold', 'A STORY IN NEON', 'A neon-soaked masterpiece', 'PALM BEACH TIMES', 'VOL. 5', 'palms'],
  ['night-market', 'NIGHT MARKET', 'Six ways to see the city', 'A POSTER FOR THE NIGHT', 'Beautifully shot, impossible to ignore', 'NIGHT MARKET REVIEW', 'VOL. 6', 'skyline'],
];

export const CAPTION_DECK = DECK_ROWS.map(([id, title, script, tagline, quote, outlet, vol, field]) => ({
  id, title, script, tagline, quote, outlet,
  billing: BILLING_LINE,
  vol,
  comingSoon: 'COMING SOON',
  field,
}));

// The default look dials, as their own object so a fresh document and a
// reset share the same numbers without repeating them.
function freshLook() {
  return {
    paint: 10,
    grade: 62,
    halftone: 20,
    grain: 22,
    glow: 26,
    titleSize: 100,
    titleLift: 0,
  };
}

// One fresh panel from a sample photo: the photo, its default tag, the
// tag switched on, and the default framing (a little zoomed in, centred).
function freshPanel(photo) {
  return {
    photo: photo.src,
    tag: photo.tag,
    tagOn: true,
    zoom: 1.15,
    panX: 0,
    panY: 0,
    flip: false,
    faceMarked: false,
  };
}

// A fresh document: 16:9 wide, hero mosaic, sunset grade, auto title
// style, the first deck caption, the first seven sample photos in the
// panels, and the default look above.
export function defaultDoc() {
  const doc = {
    size: '16:9',
    layout: 'hero-mosaic',
    grade: 'sunset',
    titleStyle: 'auto',
    caption: 0,
    selected: 0,
    look: freshLook(),
    panels: SAMPLE_PHOTOS.slice(0, 7).map(freshPanel),
  };
  for (const key of ['title', 'script', 'tagline', 'quote', 'outlet', 'billing', 'vol', 'comingSoon']) {
    doc[key] = '';
  }
  return doc;
}
