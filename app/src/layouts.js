// layouts.js — seven layouts. Each one turns the art area (the cover
// above the title band) into panel rects in relative units, so the same
// layout re-flows at every export size without stretching. Panels carry
// an optional tilt and polaroid frame; Strip Five is one photo sliced
// into five independent crops (see framesForLayout).

export const TITLE_BAND = 0.21; // fraction of the cover height

function gridPanels(W, H, cols, rows, gutter) {
  const out = [];
  const cw = (W - gutter * (cols - 1)) / cols;
  const ch = (H - gutter * (rows - 1)) / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      out.push({
        x: (c * (cw + gutter)) / W,
        y: (r * (ch + gutter)) / H,
        w: cw / W,
        h: ch / H,
      });
    }
  }
  return out;
}

export const LAYOUTS = [
  {
    id: "nine",
    name: "Nine-Panel Grid",
    blurb: "The classic poster wall",
    panels(W, H) {
      const g = Math.round(Math.min(W, H) * 0.014);
      return gridPanels(W, H, 3, 3, g);
    },
  },
  {
    id: "heroThree",
    name: "Hero and Three",
    blurb: "One big moment, three more",
    panels(W, H) {
      const g = Math.round(Math.min(W, H) * 0.014);
      const heroW = (W - g) * 0.62;
      const sideW = W - heroW - g;
      const sideH = (H - 2 * g) / 3;
      const panels = [{ x: 0, y: 0, w: heroW / W, h: 1 }];
      for (let i = 0; i < 3; i++) {
        panels.push({
          x: (heroW + g) / W,
          y: (i * (sideH + g)) / H,
          w: sideW / W,
          h: sideH / H,
        });
      }
      return panels;
    },
  },
  {
    id: "fullBleed",
    name: "Full Bleed",
    blurb: "One photo edge to edge",
    panels() {
      return [{ x: 0, y: 0, w: 1, h: 1 }];
    },
  },
  {
    id: "snapshots",
    name: "Tilted Snapshots",
    blurb: "Polaroid prints, tossed down",
    panels(W, H) {
      const g = Math.round(Math.min(W, H) * 0.02);
      const pw = (W - 2 * g) / 3;
      const ph = H * 0.82;
      const tilts = [-4, 2.5, -2];
      return [0, 1, 2].map((i) => ({
        x: (i * (pw + g)) / W,
        y: (H * 0.06) / H,
        w: pw / W,
        h: ph / H,
        tilt: tilts[i],
        polaroid: true,
      }));
    },
  },
  {
    id: "stripFive",
    name: "Strip Five",
    blurb: "One photo, five shots",
    panels(W, H) {
      const g = Math.round(Math.min(W, H) * 0.012);
      const sw = (W - 4 * g) / 5;
      return [0, 1, 2, 3, 4].map((i) => ({
        x: (i * (sw + g)) / W,
        y: 0,
        w: sw / W,
        h: 1,
      }));
    },
  },
  {
    id: "splitDuo",
    name: "Split Duo",
    blurb: "Two moments, side by side",
    panels(W, H) {
      const g = Math.round(Math.min(W, H) * 0.014);
      const w = (W - g) / 2;
      return [
        { x: 0, y: 0, w: w / W, h: 1 },
        { x: (w + g) / W, y: 0, w: w / W, h: 1 },
      ];
    },
  },
  {
    id: "comicStrip",
    name: "Comic Strip",
    blurb: "Three frames, one story",
    panels(W, H) {
      const g = Math.round(Math.min(W, H) * 0.014);
      const h = (H - 2 * g) / 3;
      return [0, 1, 2].map((i) => ({
        x: 0,
        y: (i * (h + g)) / H,
        w: 1,
        h: h / H,
      }));
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
  const artW = 1000;
  const artH = 1000;
  const panels = layout.panels(artW, artH);
  if (layoutId === "stripFive") {
    const photo = deal[0];
    return panels.map((p, i) => {
      const f = smartFrame(photo, p.w / p.h);
      f.panX = -0.8 + (i / Math.max(1, panels.length - 1)) * 1.6;
      f.zoom = 1.35;
      return f;
    });
  }
  return panels.map((p, i) => {
    const photo = deal[i % deal.length];
    return smartFrame(photo, p.w / p.h);
  });
}

// Mini-drawing of a layout for its picker tile: the panel rects as an
// SVG, so the tile shows the layout instead of describing it.
export function layoutTileSVG(layoutId) {
  const layout = layoutById(layoutId);
  const W = 100;
  const H = 62;
  const panels = layout.panels(W, H);
  const rects = panels
    .map((p) => {
      const x = (p.x * W).toFixed(1);
      const y = (p.y * H).toFixed(1);
      const w = (p.w * W).toFixed(1);
      const h = (p.h * H).toFixed(1);
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="#f5b942" fill-opacity="0.85" transform="rotate(${p.tilt || 0} ${( +x + +w / 2).toFixed(1)} ${( +y + +h / 2).toFixed(1)})"/>`;
    })
    .join("");
  return `<svg viewBox="0 0 100 62" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="0" y="0" width="100" height="62" rx="4" fill="#241016"/>${rects}</svg>`;
}
