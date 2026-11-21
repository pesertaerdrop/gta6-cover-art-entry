// The seven cover layouts. A preset is a function of the cover's pixel
// size returning panel rectangles as fractions of the cover (each a
// [x, y, w, h] tuple from the top-left). Some layouts change shape with
// the cover: the hero mosaic and seven mosaic pack differently on wide
// and tall covers, the filmstrip runs across on wide and down on tall,
// and postcards use thirds on wide and halves on tall.
function rect(x, y, w, h) { return [x, y, w, h]; }

function thirds(w, h) {
  return [
    rect(0, 0, 1 / 3, 0.5), rect(1 / 3, 0, 1 / 3, 0.5), rect(2 / 3, 0, 1 / 3, 0.5),
    rect(0, 0.5, 1 / 3, 0.5), rect(1 / 3, 0.5, 1 / 3, 0.5), rect(2 / 3, 0.5, 1 / 3, 0.5),
  ];
}

function halves(w, h) {
  return [
    rect(0, 0, 0.5, 1 / 3), rect(0.5, 0, 0.5, 1 / 3),
    rect(0, 1 / 3, 0.5, 1 / 3), rect(0.5, 1 / 3, 0.5, 1 / 3),
    rect(0, 2 / 3, 0.5, 1 / 3), rect(0.5, 2 / 3, 0.5, 1 / 3),
  ];
}

const LAYOUTS = {
  'hero-mosaic': (w, h) => {
    if (w > h) {
      return [
        rect(0, 0, 0.52, 0.62), rect(0.52, 0, 0.24, 0.62), rect(0.76, 0, 0.24, 0.62),
        rect(0, 0.62, 0.38, 0.38), rect(0.38, 0.62, 0.62, 0.38),
      ];
    }
    return [
      rect(0, 0, 1, 0.52),
      rect(0, 0.52, 0.5, 0.24), rect(0.5, 0.52, 0.5, 0.24),
      rect(0, 0.76, 0.5, 0.24), rect(0.5, 0.76, 0.5, 0.24),
    ];
  },
  'hero-plus-three': (w, h) => [
    rect(0, 0, 0.68, 1),
    rect(0.68, 0, 0.32, 0.34), rect(0.68, 0.34, 0.32, 0.33), rect(0.68, 0.67, 0.32, 0.33),
  ],
  'six-grid': (w, h) => thirds(w, h),
  'diagonal-trio': (w, h) => [
    rect(0, 0, 0.55, 0.55),
    rect(0.45, 0.25, 0.55, 0.55),
    rect(0.12, 0.6, 0.62, 0.4),
  ],
  'seven-mosaic': (w, h) => {
    if (w > h) {
      return [
        rect(0, 0, 0.36, 0.5), rect(0.36, 0, 0.32, 0.5), rect(0.68, 0, 0.32, 0.5),
        rect(0, 0.5, 0.26, 0.5), rect(0.26, 0.5, 0.24, 0.5),
        rect(0.5, 0.5, 0.25, 0.5), rect(0.75, 0.5, 0.25, 0.5),
      ];
    }
    return [
      rect(0, 0, 0.5, 0.38), rect(0.5, 0, 0.5, 0.38),
      rect(0, 0.38, 0.34, 0.31), rect(0.34, 0.38, 0.33, 0.31), rect(0.67, 0.38, 0.33, 0.31),
      rect(0, 0.69, 0.5, 0.31), rect(0.5, 0.69, 0.5, 0.31),
    ];
  },
  filmstrip: (w, h) => {
    if (w > h) return [0, 1, 2, 3, 4].map((i) => rect(i * 0.2, 0, 0.2, 1));
    return [0, 1, 2, 3, 4].map((i) => rect(0, i * 0.2, 1, 0.2));
  },
  postcards: (w, h) => (w > h ? thirds(w, h) : halves(w, h)),
};

export function rectsForLayout(layoutId, w, h) {
  const preset = LAYOUTS[layoutId] || LAYOUTS['hero-mosaic'];
  return preset(w, h);
}

export const LAYOUT_LIST = [
  { id: 'hero-mosaic', label: 'Hero Mosaic', panels: 5 },
  { id: 'hero-plus-three', label: 'Hero + Three', panels: 4 },
  { id: 'six-grid', label: 'Six Grid', panels: 6 },
  { id: 'diagonal-trio', label: 'Diagonal Trio', panels: 3 },
  { id: 'seven-mosaic', label: 'Seven Mosaic', panels: 7 },
  { id: 'filmstrip', label: 'Filmstrip', panels: 5 },
  { id: 'postcards', label: 'Postcards', panels: 6 },
];

export function layoutPanelCount(layoutId) {
  const found = LAYOUT_LIST.find((entry) => entry.id === layoutId);
  return found ? found.panels : 5;
}
