// frames.js — the seven layouts of Sunset Strip Studio.
//
// Each layout is a different way to hang photos on the boulevard: a hero
// with a sun disc, a full-bleed backdrop with a row of frames, a
// filmstrip with sprocket holes, tilted postcards over a backdrop, a neon
// marquee on top, a horizon split, a three-column boardwalk. Every
// layout re-flows per size from the same relative rects — never
// stretched, only re-framed.
//
// A layout is: { id, label, desc, band ('bottom' | 'top'), sunDisc,
// film, slots, rects(W, H) } where rects are fractions of the art area
// (the cover minus the title band): { x, y, w, h, rot, frame }.
// frame: 'card' draws a white postcard border, 'film' draws sprocket
// holes around the strip, anything else draws the photo edge to edge.

export const LAYOUTS = [
  {
    id: 'sun-disc', label: 'Sun Disc', desc: 'Hero left, two stacked right, three small below',
    band: 'bottom', sunDisc: true, film: false, slots: 6,
    rects() {
      return [
        { x: 0, y: 0, w: 0.58, h: 0.68, rot: 0, frame: 'none' },
        { x: 0.58, y: 0, w: 0.42, h: 0.34, rot: 0, frame: 'none' },
        { x: 0.58, y: 0.34, w: 0.42, h: 0.34, rot: 0, frame: 'none' },
        { x: 0, y: 0.68, w: 0.333, h: 0.32, rot: 0, frame: 'none' },
        { x: 0.333, y: 0.68, w: 0.334, h: 0.32, rot: 0, frame: 'none' },
        { x: 0.667, y: 0.68, w: 0.333, h: 0.32, rot: 0, frame: 'none' },
      ];
    },
  },
  {
    id: 'boulevard', label: 'Boulevard', desc: 'One big backdrop, four frames across the middle',
    band: 'bottom', sunDisc: false, film: false, slots: 5,
    rects() {
      return [
        { x: 0, y: 0, w: 1, h: 1, rot: 0, frame: 'none' },
        { x: 0.04, y: 0.3, w: 0.21, h: 0.4, rot: -0.02, frame: 'card' },
        { x: 0.27, y: 0.3, w: 0.21, h: 0.4, rot: 0.015, frame: 'card' },
        { x: 0.5, y: 0.3, w: 0.21, h: 0.4, rot: -0.015, frame: 'card' },
        { x: 0.73, y: 0.3, w: 0.21, h: 0.4, rot: 0.02, frame: 'card' },
      ];
    },
  },
  {
    id: 'filmstrip', label: 'Filmstrip', desc: 'Four frames on a strip of tape',
    band: 'bottom', sunDisc: false, film: true, slots: 4,
    rects() {
      return [
        { x: 0.03, y: 0.1, w: 0.22, h: 0.8, rot: 0, frame: 'film' },
        { x: 0.27, y: 0.1, w: 0.22, h: 0.8, rot: 0, frame: 'film' },
        { x: 0.51, y: 0.1, w: 0.22, h: 0.8, rot: 0, frame: 'film' },
        { x: 0.75, y: 0.1, w: 0.22, h: 0.8, rot: 0, frame: 'film' },
      ];
    },
  },
  {
    id: 'postcards', label: 'Postcards', desc: 'Three tilted cards over one big photo',
    band: 'bottom', sunDisc: false, film: false, slots: 4,
    rects() {
      return [
        { x: 0, y: 0, w: 1, h: 1, rot: 0, frame: 'none' },
        { x: 0.06, y: 0.14, w: 0.36, h: 0.62, rot: -0.07, frame: 'card' },
        { x: 0.32, y: 0.2, w: 0.36, h: 0.62, rot: 0.05, frame: 'card' },
        { x: 0.58, y: 0.14, w: 0.36, h: 0.62, rot: -0.04, frame: 'card' },
      ];
    },
  },
  {
    id: 'marquee', label: 'Marquee', desc: 'Neon title on top, four photos below',
    band: 'top', sunDisc: false, film: false, slots: 4,
    rects() {
      return [
        { x: 0, y: 0, w: 0.5, h: 0.5, rot: 0, frame: 'none' },
        { x: 0.5, y: 0, w: 0.5, h: 0.5, rot: 0, frame: 'none' },
        { x: 0, y: 0.5, w: 0.5, h: 0.5, rot: 0, frame: 'none' },
        { x: 0.5, y: 0.5, w: 0.5, h: 0.5, rot: 0, frame: 'none' },
      ];
    },
  },
  {
    id: 'horizon', label: 'Horizon Split', desc: 'One wide shot, three uprights below',
    band: 'bottom', sunDisc: false, film: false, slots: 4,
    rects() {
      return [
        { x: 0, y: 0, w: 1, h: 0.52, rot: 0, frame: 'none' },
        { x: 0, y: 0.52, w: 0.333, h: 0.48, rot: 0, frame: 'none' },
        { x: 0.333, y: 0.52, w: 0.334, h: 0.48, rot: 0, frame: 'none' },
        { x: 0.667, y: 0.52, w: 0.333, h: 0.48, rot: 0, frame: 'none' },
      ];
    },
  },
  {
    id: 'boardwalk', label: 'Boardwalk', desc: 'Tall centre photo, two columns of two',
    band: 'bottom', sunDisc: false, film: false, slots: 5,
    rects() {
      return [
        { x: 0, y: 0, w: 0.28, h: 0.5, rot: 0, frame: 'none' },
        { x: 0, y: 0.5, w: 0.28, h: 0.5, rot: 0, frame: 'none' },
        { x: 0.28, y: 0, w: 0.44, h: 1, rot: 0, frame: 'none' },
        { x: 0.72, y: 0, w: 0.28, h: 0.5, rot: 0, frame: 'none' },
        { x: 0.72, y: 0.5, w: 0.28, h: 0.5, rot: 0, frame: 'none' },
      ];
    },
  },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}

// Panel rects for a layout in a W x artH art area.
export function panelsFor(layout, W, artH) {
  return layout.rects(W, artH);
}
