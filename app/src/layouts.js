// layouts.js — the eight cover layouts. Each layout is a function of the
// art area (width, height in pixels) returning panel rects in relative
// 0..1 coordinates of that area, plus a small SVG sketch for the picker
// tile. Panels may carry a rotation (tilted snapshots) and a frame flag
// (polaroid-style white border). Every layout re-flows for wide, square
// and portrait art areas instead of stretching.
//
// The first layout, Poster Grid, mirrors the classic multi-panel comic
// poster: one large central hero panel (the duo portrait) with seven
// smaller action panels around it — three stacked on the left, three on
// the right, one more under the hero. The panel order is fixed so the
// library's first eight photos land in the right slots: police chase,
// airboat, boat party, hero duo, convertible duo, yacht + blimp,
// dirt-bike jump, drawbridge.
//
// Strip Five is the face-aware one: it takes optional divider positions
// (photo fractions, from faces.js via the state) and places its gutters
// on those dividers instead of the equal split, so no gutter ever lands
// on a face. Without dividers it falls back to five equal strips.

const GUT = 0.012; // gutter, relative to the art area's width

function grid3x3(w, h) {
  const panels = [];
  const gw = GUT;
  const gh = (GUT * w) / h;
  const cw = (1 - gw * 2) / 3;
  const ch = (1 - gh * 2) / 3;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      panels.push({ x: c * (cw + gw), y: r * (ch + gh), w: cw, h: ch, rot: 0, frame: false });
    }
  }
  return panels;
}

function heroAndThree(w, h) {
  const gw = GUT;
  const gh = (GUT * w) / h;
  const heroW = 0.62;
  const sideX = heroW + gw;
  const sideW = 1 - sideX;
  const ch = (1 - gh * 2) / 3;
  return [
    { x: 0, y: 0, w: heroW, h: 1, rot: 0, frame: false },
    { x: sideX, y: 0, w: sideW, h: ch, rot: 0, frame: false },
    { x: sideX, y: ch + gh, w: sideW, h: ch, rot: 0, frame: false },
    { x: sideX, y: 2 * (ch + gh), w: sideW, h: ch, rot: 0, frame: false },
  ];
}

function fullBleed() {
  return [{ x: 0, y: 0, w: 1, h: 1, rot: 0, frame: false }];
}

function tiltedSnaps() {
  return [
    { x: 0.03, y: 0.1, w: 0.34, h: 0.72, rot: -0.07, frame: true },
    { x: 0.33, y: 0.02, w: 0.34, h: 0.72, rot: 0.03, frame: true },
    { x: 0.63, y: 0.12, w: 0.34, h: 0.72, rot: 0.08, frame: true },
  ];
}

// Five vertical strips of one photo. `dividers` is an optional array of
// four positions in (0, 1) — the face-aware divider set for the lead
// photo. Each strip's width follows its slice's width, so the five
// strips still reconstruct the photo with gutters on the dividers.
// Without dividers, five equal strips.
function stripFive(w, h, dividers) {
  const gw = GUT;
  const edges = dividers && dividers.length === 4
    ? [0, ...dividers, 1]
    : [0, 0.2, 0.4, 0.6, 0.8, 1];
  const avail = 1 - gw * 4;
  const panels = [];
  let x = 0;
  for (let i = 0; i < 5; i++) {
    const sliceW = (edges[i + 1] - edges[i]) * avail;
    panels.push({ x, y: 0, w: sliceW, h: 1, rot: 0, frame: false });
    x += sliceW + gw;
  }
  return panels;
}

function splitDuo() {
  const gw = GUT;
  const cw = (1 - gw) / 2;
  return [
    { x: 0, y: 0, w: cw, h: 1, rot: 0, frame: false },
    { x: cw + gw, y: 0, w: cw, h: 1, rot: 0, frame: false },
  ];
}

function comicStrip(w, h) {
  const gh = (GUT * w) / h;
  const gw = GUT;
  const topH = 0.42;
  const botH = 0.3;
  const midH = 1 - topH - botH - gh * 2;
  const midY = topH + gh;
  const botY = midY + midH + gh;
  const cw = (1 - gw) / 2;
  return [
    { x: 0, y: 0, w: 1, h: topH, rot: 0, frame: false },
    { x: 0, y: midY, w: cw, h: midH, rot: 0, frame: false },
    { x: cw + gw, y: midY, w: cw, h: midH, rot: 0, frame: false },
    { x: 0, y: botY, w: 1, h: botH, rot: 0, frame: false },
  ];
}

function posterPanels(w, h) {
  const gw = GUT;
  const gh = (GUT * w) / h;
  if (w / h > 1.2) {
    // Wide: three columns. Left and right columns hold three stacked
    // action panels each; the centre column holds the hero above one
    // more action panel. Order: left top/mid/bottom, hero, centre
    // bottom, right top/mid/bottom.
    const sideW = 0.26;
    const midW = 1 - sideW * 2 - gw * 2;
    const midX = sideW + gw;
    const rightX = midX + midW + gw;
    const ch = (1 - gh * 2) / 3;
    const heroH = 0.62;
    return [
      { x: 0, y: 0, w: sideW, h: ch, rot: 0, frame: false },
      { x: 0, y: ch + gh, w: sideW, h: ch, rot: 0, frame: false },
      { x: 0, y: 2 * (ch + gh), w: sideW, h: ch, rot: 0, frame: false },
      { x: midX, y: 0, w: midW, h: heroH, rot: 0, frame: false },
      { x: midX, y: heroH + gh, w: midW, h: 1 - heroH - gh, rot: 0, frame: false },
      { x: rightX, y: 0, w: sideW, h: ch, rot: 0, frame: false },
      { x: rightX, y: ch + gh, w: sideW, h: ch, rot: 0, frame: false },
      { x: rightX, y: 2 * (ch + gh), w: sideW, h: ch, rot: 0, frame: false },
    ];
  }
  // Square and portrait: the hero takes the full-width top band, then
  // two rows of three action panels, then the convertible duo spans the
  // bottom row. Same panel order as the wide version.
  const rowH = 0.2;
  const heroH = 1 - rowH * 3 - gh * 3;
  const cw = (1 - gw * 2) / 3;
  const row1Y = heroH + gh;
  const row2Y = row1Y + rowH + gh;
  const row3Y = row2Y + rowH + gh;
  return [
    { x: 0, y: row1Y, w: cw, h: rowH, rot: 0, frame: false },
    { x: cw + gw, y: row1Y, w: cw, h: rowH, rot: 0, frame: false },
    { x: 2 * (cw + gw), y: row1Y, w: cw, h: rowH, rot: 0, frame: false },
    { x: 0, y: 0, w: 1, h: heroH, rot: 0, frame: false },
    { x: 0, y: row3Y, w: 1, h: rowH, rot: 0, frame: false },
    { x: 0, y: row2Y, w: cw, h: rowH, rot: 0, frame: false },
    { x: cw + gw, y: row2Y, w: cw, h: rowH, rot: 0, frame: false },
    { x: 2 * (cw + gw), y: row2Y, w: cw, h: rowH, rot: 0, frame: false },
  ];
}

export const LAYOUTS = [
  {
    id: 'poster',
    name: 'Poster Grid',
    blurb: 'Hero duo, seven scenes',
    minPhotos: 8,
    panels: posterPanels,
    tile: '<rect x="2" y="2" width="9" height="10"/><rect x="2" y="14" width="9" height="10"/><rect x="2" y="26" width="9" height="10"/><rect x="13" y="2" width="14" height="22"/><rect x="13" y="26" width="14" height="10"/><rect x="29" y="2" width="9" height="10"/><rect x="29" y="14" width="9" height="10"/><rect x="29" y="26" width="9" height="10"/>',
  },
  {
    id: 'nine',
    name: 'Nine-Panel Grid',
    blurb: 'The classic poster wall',
    minPhotos: 9,
    panels: grid3x3,
    tile: '<rect x="2" y="2" width="10" height="10"/><rect x="14" y="2" width="10" height="10"/><rect x="26" y="2" width="10" height="10"/><rect x="2" y="14" width="10" height="10"/><rect x="14" y="14" width="10" height="10"/><rect x="26" y="14" width="10" height="10"/><rect x="2" y="26" width="10" height="10"/><rect x="14" y="26" width="10" height="10"/><rect x="26" y="26" width="10" height="10"/>',
  },
  {
    id: 'hero',
    name: 'Hero and Three',
    blurb: 'One big face, three moments',
    minPhotos: 4,
    panels: heroAndThree,
    tile: '<rect x="2" y="2" width="20" height="34"/><rect x="24" y="2" width="12" height="10"/><rect x="24" y="14" width="12" height="10"/><rect x="24" y="26" width="12" height="10"/>',
  },
  {
    id: 'bleed',
    name: 'Full Bleed',
    blurb: 'One photo, edge to edge',
    minPhotos: 1,
    panels: fullBleed,
    tile: '<rect x="2" y="2" width="34" height="34"/>',
  },
  {
    id: 'tilted',
    name: 'Tilted Snapshots',
    blurb: 'Polaroids on the table',
    minPhotos: 3,
    panels: tiltedSnaps,
    tile: '<rect x="3" y="6" width="12" height="26" transform="rotate(-6 9 19)"/><rect x="14" y="4" width="12" height="26" transform="rotate(3 20 17)"/><rect x="24" y="7" width="12" height="26" transform="rotate(7 30 20)"/>',
  },
  {
    id: 'strip',
    name: 'Strip Five',
    blurb: 'One photo, five crops',
    minPhotos: 1,
    panels: stripFive,
    tile: '<rect x="2" y="2" width="6" height="34"/><rect x="9" y="2" width="6" height="34"/><rect x="16" y="2" width="6" height="34"/><rect x="23" y="2" width="6" height="34"/><rect x="30" y="2" width="6" height="34"/>',
  },
  {
    id: 'duo',
    name: 'Split Duo',
    blurb: 'Two halves, one story',
    minPhotos: 2,
    panels: splitDuo,
    tile: '<rect x="2" y="2" width="16" height="34"/><rect x="20" y="2" width="16" height="34"/>',
  },
  {
    id: 'comic',
    name: 'Comic Strip',
    blurb: 'Three beats, stacked',
    minPhotos: 3,
    panels: comicStrip,
    tile: '<rect x="2" y="2" width="34" height="12"/><rect x="2" y="16" width="16" height="9"/><rect x="20" y="16" width="16" height="9"/><rect x="2" y="27" width="34" height="9"/>',
  },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}

// Panel rects for a layout in a given art area (pixels). `dividers` is
// only read by Strip Five; other layouts ignore it.
export function panelsFor(layoutId, w, h, dividers) {
  return layoutById(layoutId).panels(w, h, dividers);
}
