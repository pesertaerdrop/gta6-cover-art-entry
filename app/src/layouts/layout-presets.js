// The seven panel layouts. A layout is a tree of splits, not a table of
// coordinates: each node cuts its rectangle either across (dir 'x', a
// vertical cut) or down (dir 'y', a horizontal cut) at a fraction, and a
// leaf is one panel. Reading the tree left to right, top to bottom gives
// the panels their order. An optional inset shifts a leaf inside its slot
// (the diagonal trio's bottom panel sits right of centre on purpose).
// Rects come out in cover pixels; the gutter is applied by the resolver,
// so every layout shares the same spacing.
const SPLIT = (dir, at, first, second) => ({ dir, at, first, second });
const LEAF = (inset) => ({ leaf: true, inset: inset || null });

const LAYOUT_TREES = {
  'hero-mosaic': SPLIT('y', 0.58,
    SPLIT('x', 0.62, LEAF(), SPLIT('y', 0.62, LEAF(), LEAF())),
    SPLIT('x', 0.40, LEAF(), SPLIT('x', 0.38, LEAF(), LEAF()))),
  'diagonal-trio': SPLIT('y', 0.55,
    SPLIT('x', 0.55, LEAF(), LEAF()),
    LEAF({ l: 0.20, t: 0, r: 0, b: 0 })),
  'seven-mosaic': SPLIT('y', 0.48,
    SPLIT('x', 0.50, LEAF(), SPLIT('y', 0.45, LEAF(), SPLIT('x', 0.50, LEAF(), LEAF()))),
    SPLIT('x', 0.33, LEAF(), SPLIT('x', 0.50, LEAF(), LEAF()))),
  'duo-split': SPLIT('x', 0.50, LEAF(), LEAF()),
  triptych: SPLIT('x', 0.333, LEAF(), SPLIT('x', 0.50, LEAF(), LEAF())),
  'quad-grid': SPLIT('y', 0.50,
    SPLIT('x', 0.50, LEAF(), LEAF()),
    SPLIT('x', 0.50, LEAF(), LEAF())),
  'film-strip': SPLIT('x', 0.55, LEAF(),
    SPLIT('y', 0.25, LEAF(), SPLIT('y', 0.333, LEAF(), SPLIT('y', 0.50, LEAF(), LEAF())))),
};

export const LAYOUT_LIST = [
  { id: 'hero-mosaic', label: 'Hero mosaic', panels: 6 },
  { id: 'diagonal-trio', label: 'Diagonal trio', panels: 3 },
  { id: 'seven-mosaic', label: 'Seven mosaic', panels: 7 },
  { id: 'duo-split', label: 'Duo split', panels: 2 },
  { id: 'triptych', label: 'Triptych', panels: 3 },
  { id: 'quad-grid', label: 'Quad grid', panels: 4 },
  { id: 'film-strip', label: 'Film strip', panels: 5 },
];

const GUT = 10;

function walk(node, rect, out) {
  if (node.leaf) {
    const inset = node.inset || {};
    const r = {
      x: rect.x + rect.w * (inset.l || 0),
      y: rect.y + rect.h * (inset.t || 0),
      w: rect.w * (1 - (inset.l || 0) - (inset.r || 0)),
      h: rect.h * (1 - (inset.t || 0) - (inset.b || 0)),
    };
    out.push({ x: r.x + GUT / 2, y: r.y + GUT / 2, w: r.w - GUT, h: r.h - GUT });
    return;
  }
  if (node.dir === 'x') {
    const cut = rect.w * node.at;
    walk(node.first, { x: rect.x, y: rect.y, w: cut, h: rect.h }, out);
    walk(node.second, { x: rect.x + cut, y: rect.y, w: rect.w - cut, h: rect.h }, out);
  } else {
    const cut = rect.h * node.at;
    walk(node.first, { x: rect.x, y: rect.y, w: rect.w, h: cut }, out);
    walk(node.second, { x: rect.x, y: rect.y + cut, w: rect.w, h: rect.h - cut }, out);
  }
}

export function rectsForLayout(layoutId, w, h) {
  const tree = LAYOUT_TREES[layoutId] || LAYOUT_TREES['hero-mosaic'];
  const out = [];
  walk(tree, { x: 0, y: 0, w, h }, out);
  return out;
}

export function layoutPanelCount(layoutId) {
  const found = LAYOUT_LIST.find((l) => l.id === layoutId);
  return found ? found.panels : 6;
}

export function layoutLabel(layoutId) {
  const found = LAYOUT_LIST.find((l) => l.id === layoutId);
  return found ? found.label : 'Hero mosaic';
}
