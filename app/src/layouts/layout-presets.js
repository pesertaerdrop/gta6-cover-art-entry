// The seven panel layouts.
//
// A layout is a split tree: a vertical cut divides a rectangle into a
// left and a right part, a horizontal cut into a top and a bottom part,
// and a leaf is one panel. The trees below are drawn from the covers
// themselves — the hero mosaic's big ace panel beside a scout over a
// thin crew strip, the seven mosaic's crew panel beside the ace over
// the harbour and the rider. A cut leaves a gutter between its two
// halves so no two panels ever touch.
const GUT = 10;

// A vertical cut at `at` (a fraction of the width): left, then right.
const V = (at, a, b) => ({ kind: 'v', at, a, b });
// A horizontal cut at `at` (a fraction of the height): top, then bottom.
const H = (at, a, b) => ({ kind: 'h', at, a, b });
// One panel.
const LEAF = () => ({ kind: 'leaf' });

const LAYOUT_TREES = {
  // Six panels: a big ace on the left, scout over a thin crew strip
  // on the right, then lookout, a narrow runner, and the getaway.
  'hero-mosaic': H(0.6,
    V(0.56, LEAF(), H(0.62, LEAF(), LEAF())),
    V(0.38, LEAF(), V(0.29, LEAF(), LEAF()))),
  // Three panels: one tall artist on the left, ace over captain.
  'diagonal-trio': V(0.55, LEAF(), H(0.5, LEAF(), LEAF())),
  // Seven panels: crew on the left, ace over harbour and rider, then
  // pier, walk and garage along the bottom.
  'seven-mosaic': H(0.5,
    V(0.5, LEAF(), H(0.48, LEAF(), V(0.5, LEAF(), LEAF()))),
    V(0.34, LEAF(), V(0.5, LEAF(), LEAF()))),
  // Two panels, side by side.
  'duo-split': V(0.5, LEAF(), LEAF()),
  // Three equal columns.
  'triptych': V(0.34, LEAF(), V(0.5, LEAF(), LEAF())),
  // A two-by-two grid.
  'quad-grid': V(0.5, H(0.5, LEAF(), LEAF()), H(0.5, LEAF(), LEAF())),
  // Five upright strips, like frames off a film roll.
  'film-strip': V(0.2, LEAF(), V(0.25, LEAF(), V(0.33, LEAF(), V(0.5, LEAF(), LEAF())))),
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

// Walk a tree into leaf rectangles inside `rect`. A cut splits the
// rectangle and leaves half a gutter on each side of the seam.
function walk(node, rect, out) {
  if (node.kind === 'leaf') {
    out.push({ x: rect.x, y: rect.y, w: rect.w, h: rect.h });
    return;
  }
  if (node.kind === 'v') {
    const cut = rect.w * node.at;
    walk(node.a, { x: rect.x, y: rect.y, w: cut - GUT / 2, h: rect.h }, out);
    walk(node.b, { x: rect.x + cut + GUT / 2, y: rect.y, w: rect.w - cut - GUT / 2, h: rect.h }, out);
  } else {
    const cut = rect.h * node.at;
    walk(node.a, { x: rect.x, y: rect.y, w: rect.w, h: cut - GUT / 2 }, out);
    walk(node.b, { x: rect.x, y: rect.y + cut + GUT / 2, w: rect.w, h: rect.h - cut - GUT / 2 }, out);
  }
}

// The panel rectangles for a layout inside a w-by-h zone, in panel order.
export function rectsForLayout(layoutId, w, h) {
  const tree = LAYOUT_TREES[layoutId] || LAYOUT_TREES['hero-mosaic'];
  const out = [];
  walk(tree, { x: 0, y: 0, w, h }, out);
  return out;
}

export function layoutPanelCount(layoutId) {
  const found = LAYOUT_LIST.find((entry) => entry.id === layoutId);
  return found ? found.panels : 6;
}

export function layoutLabel(layoutId) {
  const found = LAYOUT_LIST.find((entry) => entry.id === layoutId);
  return found ? found.label : 'Hero mosaic';
}
