// The seven cover layouts. Each layout is a list of [x, y, w, h] fractions
// of the cover; plan-cover.js compresses them into the mosaic region (the
// top 62%), so the title field along the foot stays clear. Panel 0 is
// always the hero or the first panel; the shot scenes rely on that.
//
// The diagonal trio overlaps on purpose: the panels cascade down-right,
// so the three photos read as one collage. The other six tile the frame.
export const LAYOUT_LIST = [
  { id: 'hero-mosaic', label: 'Hero Mosaic', panels: 6 },
  { id: 'diagonal-trio', label: 'Diagonal Trio', panels: 3 },
  { id: 'hero-plus-three', label: 'Hero + Three', panels: 4 },
  { id: 'filmstrip', label: 'Filmstrip', panels: 5 },
  { id: 'six-grid', label: 'Six Grid', panels: 6 },
  { id: 'postcards', label: 'Postcards', panels: 6 },
  { id: 'seven-mosaic', label: 'Seven Mosaic', panels: 7 },
];

const LAYOUTS = {
  'hero-mosaic': [
    [0, 0, 0.62, 0.62],
    [0.62, 0, 0.38, 0.38],
    [0.62, 0.38, 0.38, 0.24],
    [0, 0.62, 0.38, 0.38],
    [0.38, 0.62, 0.24, 0.38],
    [0.62, 0.62, 0.38, 0.38],
  ],
  'diagonal-trio': [
    [0, 0, 0.62, 0.62],
    [0.38, 0, 0.62, 0.62],
    [0.19, 0.38, 0.62, 0.62],
  ],
  'hero-plus-three': [
    [0, 0, 0.62, 1],
    [0.62, 0, 0.38, 0.34],
    [0.62, 0.34, 0.38, 0.33],
    [0.62, 0.67, 0.38, 0.33],
  ],
  filmstrip: [
    [0, 0, 0.2, 1],
    [0.2, 0, 0.2, 1],
    [0.4, 0, 0.2, 1],
    [0.6, 0, 0.2, 1],
    [0.8, 0, 0.2, 1],
  ],
  'six-grid': [
    [0, 0, 1 / 3, 0.5],
    [1 / 3, 0, 1 / 3, 0.5],
    [2 / 3, 0, 1 / 3, 0.5],
    [0, 0.5, 1 / 3, 0.5],
    [1 / 3, 0.5, 1 / 3, 0.5],
    [2 / 3, 0.5, 1 / 3, 0.5],
  ],
  postcards: [
    [0, 0, 0.5, 1 / 3],
    [0.5, 0, 0.5, 1 / 3],
    [0, 1 / 3, 0.5, 1 / 3],
    [0.5, 1 / 3, 0.5, 1 / 3],
    [0, 2 / 3, 0.5, 1 / 3],
    [0.5, 2 / 3, 0.5, 1 / 3],
  ],
  'seven-mosaic': [
    [0, 0, 0.5, 0.5],
    [0.5, 0, 0.5, 0.25],
    [0.5, 0.25, 0.25, 0.25],
    [0.75, 0.25, 0.25, 0.25],
    [0, 0.5, 0.33, 0.5],
    [0.33, 0.5, 0.34, 0.5],
    [0.67, 0.5, 0.33, 0.5],
  ],
};

export function rectsForLayout(layoutId, w, h) {
  return LAYOUTS[layoutId] || LAYOUTS['hero-mosaic'];
}

export function layoutPanelCount(layoutId) {
  return (LAYOUTS[layoutId] || LAYOUTS['hero-mosaic']).length;
}

export function layoutLabel(layoutId) {
  return (LAYOUT_LIST.find((l) => l.id === layoutId) || LAYOUT_LIST[0]).label;
}
