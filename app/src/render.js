// render.js — the cover renderer: panels to an art canvas, grade, ink,
// then the title band on top. Every size renders natively from the same
// relative state (relative zooms, pans and panel rects), so the square,
// portrait and wide exports are the same cover, re-framed, never
// stretched.
//
// Strip Five panels are slices, not crops: a panel carries
// slice { x0, x1, fx } — the horizontal span of the lead photo it shows
// and the focus point inside it. sliceWindow keeps the visible window
// inside the slice, so a face that sits wholly inside a slice can never
// be cut by a gutter. A normal panel carries { zoom, x, y } and uses the
// cover-fit cropWindow instead.

import { panelsFor } from './layouts.js';
import { gradeById, applyGrade } from './grades.js';
import { applyInk } from './ink.js';
import { drawSkyline, drawHeatPill, drawEstBadge, drawRibbon, drawStarburst } from './keyart.js';
import { drawTitle, drawSubtitle, drawTagline } from './lettering.js';

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

// Cover-fit source window for a photo inside a panel: the window keeps
// the panel's aspect, scales by zoom, and centres on (x, y) — fractions
// of the photo. y defaults to the upper third, where faces live.
export function cropWindow(img, rectW, rectH, crop) {
  const base = Math.max(rectW / img.naturalWidth, rectH / img.naturalHeight);
  const scale = base * (crop.zoom || 1);
  const sw = rectW / scale;
  const sh = rectH / scale;
  const cx = (crop.x ?? 0.5) * img.naturalWidth;
  const cy = (crop.y ?? 0.32) * img.naturalHeight;
  let sx = cx - sw / 2;
  let sy = cy - sh / 2;
  sx = Math.min(Math.max(sx, 0), Math.max(0, img.naturalWidth - sw));
  sy = Math.min(Math.max(sy, 0), Math.max(0, img.naturalHeight - sh));
  return { sx, sy, sw, sh, scale };
}

// Source window for a strip slice: the window keeps the panel's aspect,
// scales by zoom, and centres horizontally on the slice's focus point
// (fx) and vertically on y. The window never leaves the slice: sx is
// clamped to [x0, x1 - sw], so the gutter between two strips can never
// show half a face. Zoom below 1 is a no-op here — a slice is already
// the widest view of its own span; zooming out would bleed into the
// neighbouring strip.
export function sliceWindow(img, rectW, rectH, slice, y, zoom) {
  const imgW = img.naturalWidth;
  const imgH = img.naturalHeight;
  const slicePx = (slice.x1 - slice.x0) * imgW;
  const fit = Math.max(rectW / slicePx, rectH / imgH);
  const scale = fit * Math.max(zoom || 1, 1);
  const sw = rectW / scale;
  const sh = rectH / scale;
  const fxPx = (slice.fx ?? (slice.x0 + slice.x1) / 2) * imgW;
  const cy = (y ?? 0.35) * imgH;
  let sx = fxPx - sw / 2;
  let sy = cy - sh / 2;
  const minSx = slice.x0 * imgW;
  const maxSx = Math.max(minSx, slice.x1 * imgW - sw);
  sx = Math.min(Math.max(sx, minSx), maxSx);
  sy = Math.min(Math.max(sy, 0), Math.max(0, imgH - sh));
  return { sx, sy, sw, sh, scale };
}

// The source window for any panel: a slice window for Strip Five
// panels, a cover-fit crop for everything else. Always carries `scale`
// (panel pixels per photo pixel) so the drag handler can turn a pointer
// move into a photo-space pan.
export function panelWindow(photo, rectW, rectH, panel) {
  if (panel.slice) {
    return sliceWindow(photo.img, rectW, rectH, panel.slice, panel.y, panel.zoom);
  }
  const win = cropWindow(photo.img, rectW, rectH, panel);
  return win;
}

// Draw one photo into one panel (offscreen, at panel pixels).
function drawPanel(photo, rect, crop, grade, ink) {
  const w = Math.max(2, Math.round(rect.w));
  const h = Math.max(2, Math.round(rect.h));
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  const win = panelWindow(photo, w, h, crop);
  ctx.drawImage(photo.img, win.sx, win.sy, win.sw, win.sh, 0, 0, w, h);
  const img = ctx.getImageData(0, 0, w, h);
  applyGrade(img, grade);
  ctx.putImageData(img, 0, 0);
  if (ink.on && ink.strength > 0) {
    const inked = applyInk(c, ink.strength);
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(inked, 0, 0);
  }
  return c;
}

// Render the whole cover into ctx at W x H. `state` is the cover state,
// `library` the loaded photo records. The art area is the top 74% of
// the cover; the title band takes the bottom 26%.
export function renderCover(ctx, W, H, state, library) {
  const bandH = Math.round(H * 0.26);
  const bandY = H - bandH;
  const artH = bandY;
  ctx.fillStyle = '#1a0b14';
  ctx.fillRect(0, 0, W, H);

  const byId = new Map(library.map((p) => [p.id, p]));
  const rects = panelsFor(state.layout, W, artH, state.stripDividers);
  const grade = gradeById(state.grade);

  rects.forEach((r, i) => {
    const panel = state.panels[i];
    if (!panel) return;
    const photo = byId.get(panel.photoId);
    if (!photo || !photo.img) return;
    const px = r.x * W;
    const py = r.y * artH;
    const pw = r.w * W;
    const ph = r.h * artH;
    const drawn = drawPanel(photo, { w: pw, h: ph }, panel, grade, state.ink);
    ctx.save();
    if (r.rot) {
      ctx.translate(px + pw / 2, py + ph / 2);
      ctx.rotate(r.rot);
      ctx.translate(-pw / 2, -ph / 2);
    } else {
      ctx.translate(px, py);
    }
    if (r.frame) {
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = Math.max(6, W * 0.012);
      ctx.shadowOffsetY = Math.max(3, W * 0.006);
      ctx.fillStyle = '#f6efe4';
      const pad = Math.max(4, W * 0.008);
      ctx.fillRect(-pad, -pad, pw + pad * 2, ph + pad * 2);
      ctx.shadowColor = 'transparent';
      ctx.drawImage(drawn, 0, 0);
    } else {
      ctx.drawImage(drawn, 0, 0);
    }
    ctx.restore();
  });

  // Starburst sticker on the art area's top-left corner.
  const sbR = Math.min(W, artH) * 0.062;
  drawStarburst(ctx, W * 0.065, artH * 0.09, sbR, 'FRESH INK', 'SUMMER 2026');

  // Title band: dark gradient, skyline, title, pill, badge, ribbon.
  const bandGrad = ctx.createLinearGradient(0, bandY, 0, H);
  bandGrad.addColorStop(0, '#2a0e1e');
  bandGrad.addColorStop(1, '#12060d');
  ctx.fillStyle = bandGrad;
  ctx.fillRect(0, bandY, W, bandH);
  drawSkyline(ctx, 0, bandY, W, bandH * 0.26, 7);

  const titleSize = drawTitle(
    ctx, state.title, W * 0.03, bandY + bandH * 0.56, W * 0.58, H * 0.115,
  );
  void titleSize;

  // HEAT pill + EST badge on the band's right side.
  const badgeR = bandH * 0.17;
  const badgeCx = W - W * 0.045;
  const badgeCy = bandY + bandH * 0.56;
  const pillMaxW = badgeCx - badgeR - W * 0.02 - W * 0.6;
  drawHeatPill(ctx, W * 0.6, bandY + bandH * 0.47, bandH * 0.17, Math.max(60, pillMaxW));
  drawEstBadge(ctx, badgeCx, badgeCy, badgeR);

  // Subtitle in its own clear zone, above the tagline bar.
  drawSubtitle(
    ctx, state.subtitle, W * 0.035,
    bandY + bandH * 0.6, bandH * 0.22, W * 0.5, H * 0.045,
  );

  // The tagline bar caps the bottom of the cover.
  drawTagline(ctx, state.tagline, 0, H - bandH * 0.16, W, bandH * 0.16);

  // NOW SHOWING ribbon across the band's top-right corner.
  drawRibbon(ctx, 0, bandY, W, bandH);
}

// Render a cover to a fresh canvas at the given pixel size.
export function renderToCanvas(W, H, state, library) {
  const c = makeCanvas(W, H);
  renderCover(c.getContext('2d'), W, H, state, library);
  return c;
}

// The three post sizes the app exports, in the order it exports them.
export const EXPORT_SIZES = [
  { id: 'square', label: 'Square', w: 1080, h: 1080 },
  { id: 'portrait', label: 'Portrait', w: 1080, h: 1350 },
  { id: 'wide', label: 'Wide', w: 1920, h: 1080 },
];
