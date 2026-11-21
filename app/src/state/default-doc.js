// The starting document and the caption deck. The deck holds six
// ready-made captions; every cover draws its title, script line, tagline,
// review quote and outlet, billing line, volume tag and coming-soon line
// from the deck entry its caption index points at. Anything the user types
// by hand wins over the deck entry.
import { SAMPLE_PHOTOS } from '../photos/sample-photos.js';

export const CAPTION_DECK = [
  {
    id: 'tideline',
    title: 'TIDELINE',
    script: 'A coastal epic of two outlaws',
    tagline: 'THEIR STORY BEGINS',
    quote: 'A poster that pops off the page',
    outlet: 'NEON MAGAZINE',
    billing: 'A Saltline Pictures production, starring Mira and Suki, shot on the coast, graded by hand',
    vol: 'VOL. 1',
    comingSoon: 'COMING SOON',
  },
  {
    id: 'midnight-tide',
    title: 'MIDNIGHT TIDE',
    script: 'Midnight tide, moonlit streets',
    tagline: 'A TALE OF TWO TIDES',
    quote: 'Gorgeous, chaotic, unforgettable',
    outlet: 'SUNSET REVIEW',
    billing: 'A Saltline Pictures production, starring Mira and Suki, shot on the coast, graded by hand',
    vol: 'VOL. 2',
    comingSoon: 'COMING SOON',
  },
  {
    id: 'ember-coast',
    title: 'EMBER COAST',
    script: 'One last ride along the coast',
    tagline: 'A FAREWELL TO PARADISE',
    quote: 'The boldest poster of the year',
    outlet: 'VICE CITY WEEKLY',
    billing: 'A Saltline Pictures production, starring Mira and Suki, shot on the coast, graded by hand',
    vol: 'VOL. 3',
    comingSoon: 'COMING SOON',
  },
  {
    id: 'saltwater',
    title: 'SALTWATER',
    script: 'The truth lies beneath',
    tagline: 'SEASON ONE',
    quote: 'Raw, real, and beautifully shot',
    outlet: 'COASTLINE REVIEW',
    billing: 'A Saltline Pictures production, starring Mira and Suki, shot on the coast, graded by hand',
    vol: 'VOL. 4',
    comingSoon: 'COMING SOON',
  },
  {
    id: 'palm-light',
    title: 'PALM LIGHT',
    script: 'City of dreams, city of gold',
    tagline: 'A STORY IN NEON',
    quote: 'A neon-soaked masterpiece',
    outlet: 'PALM BEACH TIMES',
    billing: 'A Saltline Pictures production, starring Mira and Suki, shot on the coast, graded by hand',
    vol: 'VOL. 5',
    comingSoon: 'COMING SOON',
  },
  {
    id: 'night-market',
    title: 'NIGHT MARKET',
    script: 'Six ways to see the city',
    tagline: 'A POSTER FOR THE NIGHT',
    quote: 'Beautifully shot, impossible to ignore',
    outlet: 'NIGHT MARKET REVIEW',
    billing: 'A Saltline Pictures production, starring Mira and Suki, shot on the coast, graded by hand',
    vol: 'VOL. 6',
    comingSoon: 'COMING SOON',
  },
];

// A fresh document: 16:9 wide, hero mosaic, sunset grade, auto title
// style, the first deck caption, the first seven sample photos in the
// panels, and the default look (paint 10, grade 62, halftone 20, grain 22,
// glow 26, title size 100, title lift 0).
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
    look: { paint: 10, grade: 62, halftone: 20, grain: 22, glow: 26, titleSize: 100, titleLift: 0 },
    selected: 0,
    panels: SAMPLE_PHOTOS.slice(0, 7).map((photo) => ({
      photo: photo.src,
      tag: photo.tag,
      tagOn: true,
      zoom: 1.15,
      panX: 0,
      panY: 0,
      flip: false,
      faceMarked: false,
    })),
  };
}
