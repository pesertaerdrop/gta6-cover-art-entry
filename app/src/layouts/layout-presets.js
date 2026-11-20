// layout-presets.js — the seven cover layouts. Each preset is a function of
// the cover's pixel size returning panel rectangles as fractions of the
// frame, so the same layout works at 1080x1080, 1080x1350 and 1920x1080.
// The seven are maximally distinct: a hero mosaic, a hero with a stacked
// right column, a six grid, a diagonal trio, a seven mosaic, a filmstrip of
// vertical strips, and tilted postcards on a paper backing.
export const LAYOUTS = [
  {
    id: 'hero-mosaic',
    name: 'Hero Mosaic',
    blurb: 'One big hero, four around it',
    panels: (w, h) => [
      { x: 0, y: 0, w: 0.62, h: 0.66, tilt: 0 },
      { x: 0.62, y: 0, w: 0.38, h: 0.33, tilt: 0 },
      { x: 0.62, y: 0.33, w: 0.38, h: 0.33, tilt: 0 },
      { x: 0, y: 0.66, w: 0.5, h: 0.34, tilt: 0 },
      { x: 0.5, y: 0.66, w: 0.5, h: 0.34, tilt: 0 },
    ],
  },
  {
    id: 'hero-plus-three',
    name: 'Hero Plus Three',
    blurb: 'Tall hero left, stacked right',
    panels: (w, h) => [
      { x: 0, y: 0, w: 0.55, h: 1, tilt: 0 },
      { x: 0.55, y: 0, w: 0.225, h: 0.5, tilt: 0 },
      { x: 0.775, y: 0, w: 0.225, h: 0.5, tilt: 0 },
      { x: 0.55, y: 0.5, w: 0.15, h: 0.5, tilt: 0 },
      { x: 0.7, y: 0.5, w: 0.15, h: 0.5, tilt: 0 },
      { x: 0.85, y: 0.5, w: 0.15, h: 0.5, tilt: 0 },
    ],
  },
  {
    id: 'six-grid',
    name: 'Six Grid',
    blurb: 'Three across, two down',
    panels: (w, h) => {
      const out = [];
      for (let row = 0; row < 2; row += 1) {
        for (let col = 0; col < 3; col += 1) {
          out.push({ x: col / 3, y: row / 2, w: 1 / 3, h: 0.5, tilt: 0 });
        }
      }
      return out;
    },
  },
  {
    id: 'diagonal-trio',
    name: 'Diagonal Trio',
    blurb: 'Three tall frames stepping down',
    panels: (w, h) => [
      { x: 0.0, y: 0.16, w: 0.4, h: 0.68, tilt: -2 },
      { x: 0.3, y: 0.08, w: 0.4, h: 0.76, tilt: 0 },
      { x: 0.6, y: 0.0, w: 0.4, h: 0.84, tilt: 2 },
    ],
  },
  {
    id: 'seven-mosaic',
    name: 'Seven Mosaic',
    blurb: 'Three up top, hero middle, two below',
    panels: (w, h) => [
      { x: 0, y: 0, w: 1 / 3, h: 0.34, tilt: 0 },
      { x: 1 / 3, y: 0, w: 1 / 3, h: 0.34, tilt: 0 },
      { x: 2 / 3, y: 0, w: 1 / 3, h: 0.34, tilt: 0 },
      { x: 0, y: 0.34, w: 0.6, h: 0.33, tilt: 0 },
      { x: 0.6, y: 0.34, w: 0.4, h: 0.33, tilt: 0 },
      { x: 0, y: 0.67, w: 0.5, h: 0.33, tilt: 0 },
      { x: 0.5, y: 0.67, w: 0.5, h: 0.33, tilt: 0 },
    ],
  },
  {
    id: 'filmstrip',
    name: 'Filmstrip',
    blurb: 'Five tall strips, staggered',
    panels: (w, h) => [
      { x: 0, y: 0.06, w: 0.2, h: 0.88, tilt: 0 },
      { x: 0.2, y: 0, w: 0.2, h: 0.94, tilt: 0 },
      { x: 0.4, y: 0.03, w: 0.2, h: 0.91, tilt: 0 },
      { x: 0.6, y: 0.09, w: 0.2, h: 0.85, tilt: 0 },
      { x: 0.8, y: 0, w: 0.2, h: 0.97, tilt: 0 },
    ],
  },
  {
    id: 'postcards',
    name: 'Postcards',
    blurb: 'Four tilted prints on paper',
    panels: (w, h) => [
      { x: 0.03, y: 0.04, w: 0.44, h: 0.44, tilt: -3 },
      { x: 0.53, y: 0.02, w: 0.44, h: 0.44, tilt: 2.5 },
      { x: 0.05, y: 0.52, w: 0.44, h: 0.44, tilt: 2 },
      { x: 0.51, y: 0.5, w: 0.44, h: 0.46, tilt: -2.5 },
    ],
  },
];

export function layoutById(id) {
  return LAYOUTS.find((layout) => layout.id === id) ?? LAYOUTS[0];
}

export function layoutPanelCount(id) {
  const layout = layoutById(id);
  return layout.panels(100, 100).length;
}

export function layoutNames() {
  return LAYOUTS.map((layout) => layout.name);
}
