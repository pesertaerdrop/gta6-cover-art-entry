// The starting document and the caption deck.
//
// Every cover draws its words from one deck entry: the title, the
// script line under it, the tagline on the ribbon, the review quote
// and its outlet, the billing line, the volume tag and the coming-soon
// line. The deck entry a cover uses is the one its caption index
// points at. Anything the user types by hand wins over the deck —
// applyDocCaption in layouts/plan-cover.js resolves that. The `field`
// key picks the motif drawn behind the title: palms, a retro grid
// floor, or a skyline silhouette.
import { SAMPLE_PHOTOS } from '../photos/sample-photos.js';

// The one billing line every cover carries, word for word.
export const BILLING_LINE =
  'A Saltline Pictures production, starring Mira and Suki, shot on the coast, graded by hand';

// Six ready-made captions. The first three are the ones the screenshots
// show: TIDELINE on the wide cover, MIDNIGHT TIDE in the editor,
// EMBER COAST on the portrait cover, SALTWATER on the square one.
export const CAPTION_DECK = [
  {
    id: 'tideline',
    title: 'TIDELINE',
    script: 'A coastal epic of two outlaws',
    tagline: 'THEIR STORY BEGINS',
    quote: 'A poster that pops off the page',
    outlet: 'NEON MAGAZINE',
    billing: BILLING_LINE,
    vol: 'VOL. 1',
    comingSoon: 'COMING SOON',
    field: 'palms',
  },
  {
    id: 'midnight-tide',
    title: 'MIDNIGHT TIDE',
    script: 'Midnight tide, moonlit streets',
    tagline: 'A TALE OF TWO TIDES',
    quote: 'Gorgeous, chaotic, unforgettable',
    outlet: 'SUNSET REVIEW',
    billing: BILLING_LINE,
    vol: 'VOL. 2',
    comingSoon: 'COMING SOON',
    field: 'grid',
  },
  {
    id: 'ember-coast',
    title: 'EMBER COAST',
    script: 'One last ride along the coast',
    tagline: 'A FAREWELL TO PARADISE',
    quote: 'The boldest poster of the year',
    outlet: 'VICE CITY WEEKLY',
    billing: BILLING_LINE,
    vol: 'VOL. 3',
    comingSoon: 'COMING SOON',
    field: 'grid',
  },
  {
    id: 'saltwater',
    title: 'SALTWATER',
    script: 'The truth lies beneath',
    tagline: 'THE TIDE ALWAYS RETURNS',
    quote: 'Raw, real, and beautifully shot',
    outlet: 'COASTLINE REVIEW',
    billing: BILLING_LINE,
    vol: 'VOL. 4',
    comingSoon: 'COMING SOON',
    field: 'skyline',
  },
  {
    id: 'palm-light',
    title: 'PALM LIGHT',
    script: 'City of dreams, city of gold',
    tagline: 'A STORY IN NEON',
    quote: 'A neon-soaked masterpiece',
    outlet: 'PALM BEACH TIMES',
    billing: BILLING_LINE,
    vol: 'VOL. 5',
    comingSoon: 'COMING SOON',
    field: 'palms',
  },
  {
    id: 'night-market',
    title: 'NIGHT MARKET',
    script: 'Six ways to see the city',
    tagline: 'A POSTER FOR THE NIGHT',
    quote: 'Beautifully shot, impossible to ignore',
    outlet: 'NIGHT MARKET REVIEW',
    billing: BILLING_LINE,
    vol: 'VOL. 6',
    comingSoon: 'COMING SOON',
    field: 'skyline',
  },
];

// The default look: the seven sliders at the values the screenshots use.
function freshLook() {
  return { paint: 10, grade: 62, halftone: 20, grain: 22, glow: 26, titleSize: 100, titleLift: 0 };
}

// A fresh panel for a photo: the photo fills the panel, its callout tag
// shows, and the crop sits at a gentle zoom so faces stay whole.
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
// style, the first deck caption, and the first seven sample photos in
// the panels.
export function defaultDoc() {
  return {
    size: '16:9',
    layout: 'hero-mosaic',
    grade: 'sunset',
    titleStyle: 'auto',
    caption: 0,
    title: '',
    script: '',
    tagline: '',
    quote: '',
    outlet: '',
    billing: '',
    vol: '',
    comingSoon: '',
    look: freshLook(),
    selected: 0,
    panels: SAMPLE_PHOTOS.slice(0, 7).map((photo) => freshPanel(photo)),
  };
}
