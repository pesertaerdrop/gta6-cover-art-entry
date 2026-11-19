// layouts.js — seven layouts for Afterglow Cover Studio.
//
// A layout turns the art area (the cover above the title band) into
// panel rects in relative units, so the same layout re-flows at every
// export size without stretching. A panel may carry a tilt and a
// polaroid frame. Strip Five is one photo sliced into five
// independent crops (see framesForLayout).

export const TITLE_BAND = 0.21; // fraction of the cover height

// One rect, relative: x/y/w/h in 0..1 of the art area.
function rect(x, y, w, h, extra) {
  return { x, y, w, h, ...(extra || {}) };
}

function gridPanels(W, H, cols, rows, gutter) {
  const cw = (W - gutter * (cols - 1)) / cols;
  const ch = (H - gutter * (rows - 1)) / rows;
  const out = [];
  for (let i = 0; i < cols * rows; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    out.push(rect((c * (cw + gutter)) / W, (r * (ch + gutter)) / H, cw / W, ch / H));
  }
  return out;
}

function gutter(W, H, frac) {
  return Math.round(Math.min(W, H) * frac);
}

export const LAYOUTS = [
  { id: "nine", name: "Nine-Panel Grid", blurb: "The classic poster wall",
    panels(W, H) { return gridPanels(W, H, 3, 3, gutter(W, H, 0.014)); } },
  { id: "heroThree", name: "Hero and Three", blurb: "One big moment, three more",
    panels(W, H) {
      const g = gutter(W, H, 0.014);
      const heroW = (W - g) * 0.62;
      const sideW = W - heroW - g;
      const sideH = (H - 2 * g) / 3;
      const out = [rect(0, 0, heroW / W, 1)];
      for (let i = 0; i < 3; i++) {
        out.push(rect((heroW + g) / W, (i * (sideH + g)) / H, sideW / W, sideH / H));
      }
      return out;
    } },
  { id: "fullBleed", name: "Full Bleed", blurb: "One photo edge to edge",
    panels() { return [rect(0, 0, 1, 1)]; } },
  { id: "snapshots", name: "Tilted Snapshots", blurb: "Polaroid prints, tossed down",
    panels(W, H) {
      const g = gutter(W, H, 0.02);
      const pw = (W - 2 * g) / 3;
      const ph = H * 0.82;
      const tilts = [-4, 2.5, -2];
      return [0, 1, 2].map((i) =>
        rect((i * (pw + g)) / W, 0.06, pw / W, ph / H, { tilt: tilts[i], polaroid: true }));
    } },
  { id: "stripFive", name: "Strip Five", blurb: "One photo, five shots",
    panels(W, H) {
      const g = gutter(W, H, 0.012);
      const sw = (W - 4 * g) / 5;
      return [0, 1, 2, 3, 4].map((i) => rect((i * (sw + g)) / W, 0, sw / W, 1));
    } },
  { id: "splitDuo", name: "Split Duo", blurb: "Two moments, side by side",
    panels(W, H) {
      const g = gutter(W, H, 0.014);
      const w = (W - g) / 2;
      return [rect(0, 0, w / W, 1), rect((w + g) / W, 0, w / W, 1)];
    } },
  { id: "comicStrip", name: "Comic Strip", blurb: "Three frames, one story",
    panels(W, H) {
      const g = gutter(W, H, 0.014);
      const h = (H - 2 * g) / 3;
      return [0, 1, 2].map((i) => rect(0, (i * (h + g)) / H, 1, h / H));
    } },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}

// Frames for a layout's panels. Strip Five is special: one photo fills
// all five strips, each strip its own crop window panned across it.
// Every other layout deals a different photo per panel.
export function framesForLayout(layoutId, library, deal, smartFrame) {
  const layout = layoutById(layoutId);
  const panels = layout.panels(1000, 1000);
  if (layoutId === "stripFive") {
    const photo = deal[0];
    return panels.map((p, i) => {
      const f = smartFrame(photo, p.w / p.h);
      f.panX = -0.8 + (i / Math.max(1, panels.length - 1)) * 1.6;
      f.zoom = 1.35;
      return f;
    });
  }
  return panels.map((p, i) => smartFrame(deal[i % deal.length], p.w / p.h));
}

// Mini-drawing of a layout for its picker tile: the panel rects as an
// SVG, so the tile shows the layout instead of describing it.
export function layoutTileSVG(layoutId) {
  const W = 100;
  const H = 62;
  const rects = layoutById(layoutId).panels(W, H).map((p) => {
    const x = p.x * W;
    const y = p.y * H;
    const w = p.w * W;
    const h = p.h * H;
    const cx = (x + w / 2).toFixed(1);
    const cy = (y + h / 2).toFixed(1);
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="2" fill="#f5b942" fill-opacity="0.85" transform="rotate(${p.tilt || 0} ${cx} ${cy})"/>`;
  });
  return `<svg viewBox="0 0 100 62" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="0" y="0" width="100" height="62" rx="4" fill="#241016"/>${rects.join("")}</svg>`;
}
