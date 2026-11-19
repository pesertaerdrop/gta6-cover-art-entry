// Cover layouts. Every layout describes its panels as fractions of the
// photo area (the cover above the title band), so the same layout draws
// correctly at 1080x1080, 1080x1350 and 1920x1080. `titleOverlay` means the
// title band sits on top of the photo area instead of below it.

export const LAYOUTS = [
  {
    id: 'grid9',
    name: 'Nine-Panel Grid',
    blurb: 'The classic poster wall',
    panelCount: 9,
    titleOverlay: false,
    panels() {
      const out = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          out.push({ x: c / 3, y: r / 3, w: 1 / 3, h: 1 / 3, rot: 0 });
        }
      }
      return out;
    },
  },
  {
    id: 'hero-three',
    name: 'Hero and Three',
    blurb: 'One big moment, three more',
    panelCount: 4,
    titleOverlay: false,
    panels() {
      return [
        { x: 0, y: 0, w: 0.62, h: 1, rot: 0 },
        { x: 0.62, y: 0, w: 0.38, h: 1 / 3, rot: 0 },
        { x: 0.62, y: 1 / 3, w: 0.38, h: 1 / 3, rot: 0 },
        { x: 0.62, y: 2 / 3, w: 0.38, h: 1 / 3, rot: 0 },
      ];
    },
  },
  {
    id: 'full-bleed',
    name: 'Full Bleed',
    blurb: 'One photo, edge to edge',
    panelCount: 1,
    titleOverlay: true,
    panels() {
      return [{ x: 0, y: 0, w: 1, h: 1, rot: 0 }];
    },
  },
  {
    id: 'tilted',
    name: 'Tilted Snapshot',
    blurb: 'Three prints, tossed on the table',
    panelCount: 3,
    titleOverlay: true,
    panels() {
      return [
        { x: 0.03, y: 0.06, w: 0.42, h: 0.78, rot: -0.07, z: 0 },
        { x: 0.3, y: 0.12, w: 0.42, h: 0.78, rot: 0.02, z: 1 },
        { x: 0.56, y: 0.05, w: 0.42, h: 0.78, rot: 0.07, z: 0 },
      ];
    },
  },
  {
    id: 'split-duo',
    name: 'Split Duo',
    blurb: 'Two moments, side by side',
    panelCount: 2,
    titleOverlay: false,
    panels() {
      return [
        { x: 0, y: 0, w: 0.55, h: 1, rot: 0 },
        { x: 0.55, y: 0, w: 0.45, h: 1, rot: 0 },
      ];
    },
  },
  {
    id: 'comic-strip',
    name: 'Comic Strip',
    blurb: 'Three beats, top to bottom',
    panelCount: 3,
    titleOverlay: false,
    panels() {
      return [
        { x: 0, y: 0, w: 1, h: 0.42, rot: 0 },
        { x: 0, y: 0.42, w: 1, h: 0.3, rot: 0 },
        { x: 0, y: 0.72, w: 1, h: 0.28, rot: 0 },
      ];
    },
  },
  {
    id: 'portrait-trio',
    name: 'Portrait Trio',
    blurb: 'Three tall frames',
    panelCount: 3,
    titleOverlay: false,
    panels() {
      return [
        { x: 0, y: 0, w: 1 / 3, h: 1, rot: 0 },
        { x: 1 / 3, y: 0, w: 1 / 3, h: 1, rot: 0 },
        { x: 2 / 3, y: 0, w: 1 / 3, h: 1, rot: 0 },
      ];
    },
  },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}
