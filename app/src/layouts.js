// layouts.js — seven layouts for Afterglow Cover Studio.
//
// A layout turns the art area (the cover above the title band) into
// panel rects in relative units, so the same layout re-flows at every
// export size without stretching. A panel may carry a tilt and a
// polaroid frame. Strip Five is one photo sliced into five
// independent crops (see framesForLayout).

export const TITLE_BAND = 0.21; // fraction of the cover height

// One panel, relative: x/y/w/h in 0..1 of the art area.
function cell(x, y, w, h, extra) {
  return { x, y, w, h, ...(extra || {}) };
}

function gapSize(W, H, frac) {
  return Math.round(Math.min(W, H) * frac);
}

function grid(W, H, cols, rows, gap) {
  const cw = (W - gap * (cols - 1)) / cols;
  const ch = (H - gap * (rows - 1)) / rows;
  const out = [];
  for (let i = 0; i < cols * rows; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    out.push(cell((c * (cw + gap)) / W, (r * (ch + gap)) / H, cw / W, ch / H));
  }
  return out;
}

export const LAYOUTS = [
  {
    id: "nine", name: "Nine-Panel Grid",
    blurb: "The classic poster wall",
    panels(W, H) { return grid(W, H, 3, 3, gapSize(W, H, 0.014)); },
  },
  {
    id: "heroThree", name: "Hero and Three",
    blurb: "One big moment, three more",
    panels(W, H) {
      const gap = gapSize(W, H, 0.014);
      const heroWidth = (W - gap) * 0.62;
      const sideWidth = W - heroWidth - gap;
      const sideHeight = (H - 2 * gap) / 3;
      const out = [cell(0, 0, heroWidth / W, 1)];
      for (let i = 0; i < 3; i++) {
        out.push(cell((heroWidth + gap) / W, (i * (sideHeight + gap)) / H, sideWidth / W, sideHeight / H));
      }
      return out;
    },
  },
  {
    id: "fullBleed", name: "Full Bleed",
    blurb: "One photo edge to edge",
    panels() { return [cell(0, 0, 1, 1)]; },
  },
  {
    id: "snapshots", name: "Tilted Snapshots",
    blurb: "Polaroid prints, tossed down",
    panels(W, H) {
      const gap = gapSize(W, H, 0.02);
      const printW = (W - 2 * gap) / 3;
      const printH = H * 0.82;
      const tilts = [-4, 2.5, -2];
      return [0, 1, 2].map((i) =>
        cell((i * (printW + gap)) / W, 0.06, printW / W, printH / H, { tilt: tilts[i], polaroid: true }));
    },
  },
  {
    id: "stripFive", name: "Strip Five",
    blurb: "One photo, five shots",
    panels(W, H) {
      const gap = gapSize(W, H, 0.012);
      const stripW = (W - 4 * gap) / 5;
      return [0, 1, 2, 3, 4].map((i) => cell((i * (stripW + gap)) / W, 0, stripW / W, 1));
    },
  },
  {
    id: "splitDuo", name: "Split Duo",
    blurb: "Two moments, side by side",
    panels(W, H) {
      const gap = gapSize(W, H, 0.014);
      const halfW = (W - gap) / 2;
      return [cell(0, 0, halfW / W, 1), cell((halfW + gap) / W, 0, halfW / W, 1)];
    },
  },
  {
    id: "comicStrip", name: "Comic Strip",
    blurb: "Three frames, one story",
    panels(W, H) {
      const gap = gapSize(W, H, 0.014);
      const stripH = (H - 2 * gap) / 3;
      return [0, 1, 2].map((i) => cell(0, (i * (stripH + gap)) / H, 1, stripH / H));
    },
  },
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
  const boxes = layoutById(layoutId).panels(W, H).map((p) => {
    const x = p.x * W;
    const y = p.y * H;
    const w = p.w * W;
    const h = p.h * H;
    const cx = (x + w / 2).toFixed(1);
    const cy = (y + h / 2).toFixed(1);
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="2" fill="#f5b942" fill-opacity="0.85" transform="rotate(${p.tilt || 0} ${cx} ${cy})"/>`;
  });
  return `<svg viewBox="0 0 100 62" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="0" y="0" width="100" height="62" rx="4" fill="#241016"/>${boxes.join("")}</svg>`;
}
