// canvas.js — the cover renderer: panels to an art canvas, grade, tape,
// then the title block on top. Every size renders natively from the same
// relative state (relative zooms, pans and panel rects), so the square,
// portrait and wide exports are the same cover, re-framed, never
// stretched.
//
// A panel carries { photoId, zoom, x, y }: the photo it shows, a zoom
// factor, and a focus point in fractions of the photo. cropWindow keeps
// the visible window inside the photo; when the photo has a measured
// face, the window centres on it, so a face can never be cropped out by
// a panel edge — drags and zooms move around the face, never off it.

import { layoutById } from './frames.js';
import { gradeById, applyGrade } from './tint.js';
import { applyTape } from './tape.js';
import { drawTitleBlock, drawSunDisc, drawSprockets } from './marquee.js';

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

// Cover-fit source window for a photo inside a panel: the window keeps
// the panel's aspect, scales by zoom, and centres on the focus point —
// fractions of the photo. With a face, the focus is the face's centre;
// without one it defaults to the upper third, where faces live.
export function cropWindow(img, rectW, rectH, crop, face) {
  const base = Math.max(rectW / img.naturalWidth, rectH / img.naturalHeight);
  const scale = base * (crop.zoom || 1);
  const sw = rectW / scale;
  const sh = rectH / scale;
  let cx;
  let cy;
  if (face) {
    cx = ((face[0] + face[2]) / 2) * img.naturalWidth;
    cy = ((face[1] + face[3]) / 2) * img.naturalHeight;
  } else {
    cx = (crop.x ?? 0.5) * img.naturalWidth;
    cy = (crop.y ?? 0.32) * img.naturalHeight;
  }
  // A drag moves the focus, but the window is clamped so it can never
  // slide a measured face out of frame.
  if (face && (crop.x !== undefined || crop.y !== undefined)) {
    const fx0 = face[0] * img.naturalWidth;
    const fx1 = face[2] * img.naturalWidth;
    const fy0 = face[1] * img.naturalHeight;
    const fy1 = face[3] * img.naturalHeight;
    const m = 0.015 * img.naturalWidth;
    cx = Math.min(Math.max(cx, fx0 - m + sw / 2), fx1 + m - sw / 2);
    cy = Math.min(Math.max(cy, fy0 - m + sh / 2), fy1 + m - sh / 2);
    if (sw >= fx1 - fx0 + 2 * m) cx = (fx0 + fx1) / 2;
    if (sh >= fy1 - fy0 + 2 * m) cy = (fy0 + fy1) / 2;
  }
  let sx = cx - sw / 2;
  let sy = cy - sh / 2;
  sx = Math.min(Math.max(sx, 0), Math.max(0, img.naturalWidth - sw));
  sy = Math.min(Math.max(sy, 0), Math.max(0, img.naturalHeight - sh));
  return { sx, sy, sw, sh, scale };
}

// Draw one photo into one panel (offscreen, at panel pixels).
function drawPanel(photo, rect, crop, grade, tape, face, seed) {
  const w = Math.max(2, Math.round(rect.w));
  const h = Math.max(2, Math.round(rect.h));
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  const win = cropWindow(photo.img, w, h, crop, face);
  ctx.drawImage(photo.img, win.sx, win.sy, win.sw, win.sh, 0, 0, w, h);
  const img = ctx.getImageData(0, 0, w, h);
  applyGrade(img, grade);
  ctx.putImageData(img, 0, 0);
  if (tape.on && tape.strength > 0) {
    const taped = applyTape(c, tape.strength, seed);
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(taped, 0, 0);
  }
  return { canvas: c, win, scale: win.scale };
}

// Render the whole cover into ctx at W x H. `state` is the cover state,
// `library` the loaded photo records. The title band takes the bottom
// 24% of the cover (or the top 24% for the Marquee layout); the art
// area is the rest.
export function renderCover(ctx, W, H, state, library) {
  const layout = layoutById(state.layout);
  const bandH = Math.round(H * 0.24);
  const topBand = layout.band === 'top';
  const bandY = topBand ? 0 : H - bandH;
  const artY = topBand ? bandH : 0;
  const artH = H - bandH;
  ctx.fillStyle = '#160a18';
  ctx.fillRect(0, 0, W, H);

  const byId = new Map(library.map((p) => [p.id, p]));
  const rects = layout.rects(W, artH);
  const grade = gradeById(state.grade);

  rects.forEach((r, i) => {
    const panel = state.panels[i];
    if (!panel) return;
    const photo = byId.get(panel.photoId);
    if (!photo || !photo.img) return;
    const px = r.x * W;
    const py = artY + r.y * artH;
    const pw = r.w * W;
    const ph = r.h * artH;
    const face = photo.faces && photo.faces.length ? photo.faces[0] : null;
    const drawn = drawPanel(photo, { w: pw, h: ph }, panel, grade, state.tape, face, 1337 + i * 97);
    ctx.save();
    if (r.rot) {
      ctx.translate(px + pw / 2, py + ph / 2);
      ctx.rotate(r.rot);
      ctx.translate(-pw / 2, -ph / 2);
    } else {
      ctx.translate(px, py);
    }
    if (r.frame === 'card') {
      // White postcard border with a soft drop shadow.
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = Math.max(6, W * 0.012);
      ctx.shadowOffsetY = Math.max(3, W * 0.006);
      ctx.fillStyle = '#f7f1e3';
      const pad = Math.max(5, W * 0.009);
      ctx.fillRect(-pad, -pad, pw + pad * 2, ph + pad * 2);
      ctx.shadowColor = 'transparent';
      ctx.drawImage(drawn.canvas, 0, 0);
    } else {
      ctx.drawImage(drawn.canvas, 0, 0);
    }
    ctx.restore();
  });

  // Filmstrip sprocket holes run along the top and bottom of the strip.
  if (layout.film) drawSprockets(ctx, 0, artY, W, artH);

  // The sun disc rises behind the hero on the Sun Disc layout.
  if (layout.sunDisc) {
    drawSunDisc(ctx, W * 0.58, artY + artH * 0.1, Math.min(W, artH) * 0.16);
  }

  // Title block: sun disc, big title, neon script subtitle, tagline
  // bar, ticket stub, clock badge and palm silhouettes.
  drawTitleBlock(ctx, W, H, bandY, bandH, state, layout);
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
