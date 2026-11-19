// render.js — the cover renderer.
//
// Panels are drawn to an offscreen art canvas, the grade maps it,
// Poster Ink illustrates it, and the title band (skyline, lettering,
// pill, badge, sash, tagline) is drawn on top. Framing is relative,
// so every size renders natively from the same state — nothing is
// stretched or re-cropped per size.
//
// Title-band geometry (fractions of band height, top = 0):
//   skyline strip ....... 0.00 – 0.30
//   title caps baseline . 0.64 (caps rise to ~0.35)
//   star pill / EST badge  0.37 – 0.63, right side
//   script subtitle ..... baseline 0.78, size 0.16 — its swashes
//                         bottom out near 0.82, clear of the
//                         tagline bar, which starts at 0.85
//   tagline bar ......... 0.85 – 1.00
// The script used to sit at 0.86, inside the tagline bar, so its tails
// were clipped. It now has its own clear zone.

import { layoutById, TITLE_BAND } from "./layouts.js";
import { frameWindow } from "./photos.js";
import { gradeCanvas, levelsCanvas, gradeById } from "./grades.js";
import { applyPosterInk } from "./ink.js";
import {
  drawSkyline,
  drawStarPill,
  drawEstBadge,
  drawCornerRibbon,
  drawStarburst,
} from "./keyart.js";
import {
  drawCoverTitle,
  drawScriptSubtitle,
  drawTaglineBar,
} from "./lettering.js";

// The three export sizes the app promises.
export const SIZES = {
  square: { w: 1080, h: 1080, label: "Square 1080 x 1080" },
  portrait: { w: 1080, h: 1350, label: "Portrait 1080 x 1350" },
  wide: { w: 1920, h: 1080, label: "Wide 1920 x 1080" },
};

// The whole cover onto `canvas` (sized W x H by the caller).
// cover: { layout, grade, inkOn, inkStrength, title, subtitle, tagline,
//          badge, frames, photoById, extras: { skyline, starPill,
//          starburst, ribbon } }
// opts.fast: while dragging — grade only, ink comes back on pointerup.
export function renderCover(canvas, W, H, cover, opts = {}) {
  const ctx = canvas.getContext("2d");
  const bandH = Math.round(H * TITLE_BAND);
  const artH = H - bandH;
  const art = buildArtCanvas(W, artH, cover, opts);
  ctx.fillStyle = "#0d0508";
  ctx.fillRect(0, 0, W, H);
  ctx.drawImage(art, 0, 0);
  drawTitleBand(ctx, W, H, artH, bandH, cover);
  // starburst sticker on the art's top-left corner
  const extras = cover.extras || {};
  if (extras.starburst !== false) {
    drawStarburst(ctx, Math.round(W * 0.075), Math.round(artH * 0.09), Math.round(Math.min(W, H) * 0.055), "FRESH INK", "SUMMER 2026");
  }
  return canvas;
}

// Render one size at full resolution and hand back a PNG blob.
export function exportCoverBlob(cover, sizeId) {
  const size = SIZES[sizeId];
  const canvas = makeCanvas(size.w, size.h);
  renderCover(canvas, size.w, size.h, cover);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

// Panels + grade + ink on an offscreen art canvas, W x artH.
// opts.fast: while dragging — grade only, ink comes back on pointerup.
function buildArtCanvas(W, artH, cover, opts) {
  const layout = layoutById(cover.layout);
  const panels = layout.panels(W, artH).map((p) => ({
    ...p,
    px: Math.round(p.x * W),
    py: Math.round(p.y * artH),
    pxW: Math.round(p.w * W),
    pxH: Math.round(p.h * artH),
  }));
  const art = makeCanvas(W, artH);
  const ac = art.getContext("2d");
  ac.fillStyle = "#160708";
  ac.fillRect(0, 0, W, artH);
  panels.forEach((panel, i) => {
    const frame = cover.frames[i];
    if (!frame) return;
    const photo = cover.photoById[frame.photoId];
    if (!photo || !photo.ready) return;
    paintPanel(ac, panel, photo, frame);
  });
  if (gradeById(cover.grade).mix === 0) levelsCanvas(ac, W, artH);
  else gradeCanvas(ac, W, artH, cover.grade);
  if (cover.inkOn && !opts.fast) {
    applyPosterInk(ac, W, artH, cover.inkStrength);
  }
  return art;
}

// Draw one panel: a polaroid print (white frame, tilt) or a plain panel.
function paintPanel(c, panel, photo, frame) {
  if (!panel.polaroid) {
    paintPhoto(c, panel, photo, frame);
    return;
  }
  const cx = panel.px + panel.pxW / 2;
  const cy = panel.py + panel.pxH / 2;
  c.save();
  c.translate(cx, cy);
  c.rotate(((panel.tilt || 0) * Math.PI) / 180);
  c.translate(-cx, -cy);
  // white print frame, thicker at the bottom; the photo is drawn
  // inside the same rotated space so frame and print tilt together
  const pad = panel.pxW * 0.045;
  const foot = panel.pxH * 0.13;
  c.fillStyle = "#f7f2e8";
  c.fillRect(panel.px - pad, panel.py - pad, panel.pxW + pad * 2, panel.pxH + pad + foot);
  paintPhoto(c, panel, photo, frame);
  c.restore();
}

// Draw one panel's photo into its rect, honouring its frame.
function paintPhoto(c, panel, photo, frame) {
  const win = frameWindow(photo, panel.pxW, panel.pxH, frame);
  c.save();
  c.beginPath();
  c.rect(panel.px, panel.py, panel.pxW, panel.pxH);
  c.clip();
  c.drawImage(
    photo.img, win.sx, win.sy, win.sw, win.sh,
    panel.px, panel.py, panel.pxW, panel.pxH
  );
  c.restore();
}

// The title band: skyline, title, script, pill, badge, sash, tagline.
function drawTitleBand(g, W, H, bandY, bandH, cover) {
  const gradient = g.createLinearGradient(0, bandY, 0, H);
  gradient.addColorStop(0, "#220a10");
  gradient.addColorStop(1, "#0d0508");
  g.fillStyle = gradient;
  g.fillRect(0, bandY, W, bandH);

  const edge = Math.round(W * 0.035);
  const flags = cover.extras || {};
  // skyline strip across the top of the band
  if (flags.skyline !== false) {
    drawSkyline(g, 0, bandY, W, bandH * 0.3, cover.title);
  }
  // title row: title left, star pill and EST badge right, with a gap
  // between pill and badge so they never collide
  const titleBaseline = bandY + bandH * 0.64;
  const badgeRadius = Math.round(bandH * 0.13);
  const space = Math.round(W * 0.012);
  const pillWidth = Math.round(Math.max(W * 0.19, bandH * 1.05)); // wide enough for HEAT + 5 stars
  const pillHeight = Math.round(bandH * 0.2);
  const pillLeft = W - edge - badgeRadius * 2 - space - pillWidth;
  drawCoverTitle(g, cover.title, edge, titleBaseline, pillLeft - edge, bandH * 0.4);
  // neon script subtitle, tucked under the caps with clear space below
  if (cover.subtitle) {
    drawScriptSubtitle(
      g, cover.subtitle,
      edge + W * 0.06, bandY + bandH * 0.78,
      W * 0.6, bandH * 0.16
    );
  }
  // star pill + EST badge on the right of the title row
  if (flags.starPill !== false) {
    drawStarPill(g, pillLeft, bandY + bandH * 0.4, pillWidth, pillHeight, 4);
  }
  if (flags.badge !== false) {
    drawEstBadge(g, W - edge - badgeRadius, bandY + bandH * 0.5, badgeRadius);
  }
  // corner sash across the band's top-right corner (never over a
  // photo). The sash sizes itself to its text; when the words
  // cannot fit it draws nothing, so the band never shows a clipped
  // wedge.
  if (flags.ribbon) {
    drawCornerRibbon(g, 0, bandY, W, bandH, "NOW SHOWING");
  }
  // tagline bar along the bottom edge
  if (cover.tagline) {
    drawTaglineBar(g, cover.tagline, 0, H - Math.round(bandH * 0.15), W, Math.round(bandH * 0.15));
  }
}
