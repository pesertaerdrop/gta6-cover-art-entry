// render.js — the cover renderer. Panels are drawn to an offscreen
// art canvas, the grade maps it, Poster Ink illustrates it, and the
// title band (skyline, lettering, pill, badge, ribbon, tagline) is
// drawn on top. Framing is relative, so every size renders natively
// from the same state — nothing is stretched or re-cropped per size.

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

export const SIZES = {
  square: { w: 1080, h: 1080, label: "Square 1080 x 1080" },
  portrait: { w: 1080, h: 1350, label: "Portrait 1080 x 1350" },
  wide: { w: 1920, h: 1080, label: "Wide 1920 x 1080" },
};

function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

// Draw one panel's photo into its rect, honouring its frame.
function drawPanelPhoto(actx, panel, photo, frame) {
  const pw = panel.pxW;
  const ph = panel.pxH;
  const win = frameWindow(photo, pw, ph, frame);
  actx.save();
  actx.beginPath();
  actx.rect(panel.px, panel.py, pw, ph);
  actx.clip();
  actx.drawImage(photo.img, win.sx, win.sy, win.sw, win.sh, panel.px, panel.py, pw, ph);
  actx.restore();
}

// Draw one panel: a polaroid print (white frame, tilt) or a plain panel.
function drawPanel(actx, panel, photo, frame) {
  if (panel.polaroid) {
    const cx = panel.px + panel.pxW / 2;
    const cy = panel.py + panel.pxH / 2;
    actx.save();
    actx.translate(cx, cy);
    actx.rotate(((panel.tilt || 0) * Math.PI) / 180);
    actx.translate(-cx, -cy);
    // white print frame, thicker at the bottom; the photo is drawn
    // inside the same rotated space so frame and print tilt together
    const pad = panel.pxW * 0.045;
    const foot = panel.pxH * 0.13;
    actx.fillStyle = "#f7f2e8";
    actx.fillRect(panel.px - pad, panel.py - pad, panel.pxW + pad * 2, panel.pxH + pad + foot);
    drawPanelPhoto(actx, panel, photo, frame);
    actx.restore();
    return;
  }
  drawPanelPhoto(actx, panel, photo, frame);
}

// The whole cover onto `canvas` (sized W x H by the caller).
// cover: { layout, grade, inkOn, inkStrength, title, subtitle, tagline,
//          badge, frames, photoById, extras: { skyline, starPill,
//          starburst, ribbon } }
// opts.fast: while dragging — grade only, ink comes back on pointerup.
export function renderCover(canvas, W, H, cover, opts = {}) {
  const ctx = canvas.getContext("2d");
  const bandH = Math.round(H * TITLE_BAND);
  const artH = H - bandH;
  const layout = layoutById(cover.layout);
  const panels = layout.panels(W, artH).map((p) => ({
    ...p,
    px: Math.round(p.x * W),
    py: Math.round(p.y * artH),
    pxW: Math.round(p.w * W),
    pxH: Math.round(p.h * artH),
  }));

  // 1. art canvas: panels first
  const art = makeCanvas(W, artH);
  const actx = art.getContext("2d");
  actx.fillStyle = "#160708";
  actx.fillRect(0, 0, W, artH);
  panels.forEach((panel, i) => {
    const frame = cover.frames[i];
    if (!frame) return;
    const photo = cover.photoById[frame.photoId];
    if (!photo || !photo.ready) return;
    drawPanel(actx, panel, photo, frame);
  });

  // 2. grade, then ink (skipped while dragging)
  if (gradeById(cover.grade).mix === 0) levelsCanvas(actx, W, artH);
  else gradeCanvas(actx, W, artH, cover.grade);
  if (cover.inkOn && !opts.fast) {
    applyPosterInk(actx, W, artH, cover.inkStrength);
  }

  // 3. art onto the cover, then the title band
  ctx.fillStyle = "#0d0508";
  ctx.fillRect(0, 0, W, H);
  ctx.drawImage(art, 0, 0);
  const bandY = artH;
  const bandGrad = ctx.createLinearGradient(0, bandY, 0, H);
  bandGrad.addColorStop(0, "#220a10");
  bandGrad.addColorStop(1, "#0d0508");
  ctx.fillStyle = bandGrad;
  ctx.fillRect(0, bandY, W, bandH);

  const margin = Math.round(W * 0.035);
  const extras = cover.extras || {};
  // skyline strip across the top of the band
  if (extras.skyline !== false) {
    drawSkyline(ctx, 0, bandY, W, bandH * 0.3, cover.title);
  }
  // title row: title left, star pill and EST badge right, with a gap
  // between pill and badge so they never collide
  const titleY = bandY + bandH * 0.66;
  const badgeR = Math.round(bandH * 0.13);
  const gap = Math.round(W * 0.012);
  const pillW = Math.round(W * 0.19);
  const pillH = Math.round(bandH * 0.2);
  const pillX = W - margin - badgeR * 2 - gap - pillW;
  const titleMaxW = pillX - margin;
  drawCoverTitle(ctx, cover.title, margin, titleY, titleMaxW, bandH * 0.4);
  // neon script subtitle, overlapping the caps
  if (cover.subtitle) {
    drawScriptSubtitle(
      ctx, cover.subtitle,
      margin + W * 0.06, bandY + bandH * 0.86,
      W * 0.6, bandH * 0.2
    );
  }
  // star pill + EST badge on the right of the title row
  if (extras.starPill !== false) {
    drawStarPill(ctx, pillX, bandY + bandH * 0.4, pillW, pillH, 4);
  }
  if (extras.badge !== false) {
    drawEstBadge(ctx, W - margin - badgeR, bandY + bandH * 0.5, badgeR);
  }
  // corner ribbon on the band (never over a photo)
  if (extras.ribbon) {
    drawCornerRibbon(ctx, W - Math.round(W * 0.2), bandY, Math.round(W * 0.2), Math.round(bandH * 0.45), "NOW SHOWING");
  }
  // tagline bar along the bottom edge
  if (cover.tagline) {
    drawTaglineBar(ctx, cover.tagline, 0, H - Math.round(bandH * 0.15), W, Math.round(bandH * 0.15));
  }
  // starburst sticker on the art's top-left corner
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
