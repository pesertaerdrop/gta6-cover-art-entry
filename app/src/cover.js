// Neon Coast Cover Studio — the cover renderer.
//
// drawCover paints one complete cover onto a 2D canvas: the photos in
// their panels, the grade wash, the halftone title block, the badge ribbon,
// film grain and a vignette. The preview and the PNG export run the exact
// same function, so what you see is what the file holds.

import { LAYOUTS, GRADES, sizeById } from './presets.js';

const INK = '#150a20';
const PAPER = '#f7e8c9';

// A tiny seeded random generator, so the film grain is identical on every
// render and every export of the same cover is byte for byte the same.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let grainPattern = null;
function grainTile() {
  if (grainPattern) return grainPattern;
  const rand = mulberry32(20261119);
  const tile = document.createElement('canvas');
  tile.width = 140;
  tile.height = 140;
  const tctx = tile.getContext('2d');
  const img = tctx.createImageData(140, 140);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(rand() * 255);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = Math.floor(rand() * 26);
  }
  tctx.putImageData(img, 0, 0);
  grainPattern = tile;
  return tile;
}

let halftonePattern = null;
function halftoneTile() {
  if (halftonePattern) return halftonePattern;
  const tile = document.createElement('canvas');
  tile.width = 14;
  tile.height = 14;
  const tctx = tile.getContext('2d');
  tctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  tctx.beginPath();
  tctx.arc(7, 7, 2.2, 0, Math.PI * 2);
  tctx.fill();
  halftonePattern = tile;
  return tile;
}

export function panelCount(layoutId) {
  return LAYOUTS[layoutId].slots(1, 1).length;
}

export function layoutSlots(layoutId, w, h) {
  return LAYOUTS[layoutId].slots(w, h);
}

// Shrink the font until the text fits the given width, then return the size.
function fitFontSize(ctx, text, family, weight, startPx, maxWidth) {
  let size = startPx;
  ctx.font = `${weight} ${size}px ${family}`;
  while (size > 10 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

// Draw one photo into one panel: cover-fit, then zoom and pan from the
// panel's own crop settings, then the grade wash and a white frame.
function drawPhotoPanel(ctx, img, slot, panel, grade, w, h) {
  // A soft drop shadow under a tilted card, drawn first so the card sits
  // on top of it.
  if (slot.rot) {
    ctx.save();
    const cx0 = slot.x + slot.w / 2;
    const cy0 = slot.y + slot.h / 2;
    ctx.translate(cx0, cy0);
    ctx.rotate((slot.rot * Math.PI) / 180);
    ctx.translate(-cx0, -cy0);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
    ctx.fillRect(slot.x + w * 0.006, slot.y + h * 0.008, slot.w, slot.h);
    ctx.restore();
  }
  ctx.save();
  const cx = slot.x + slot.w / 2;
  const cy = slot.y + slot.h / 2;
  if (slot.rot) {
    ctx.translate(cx, cy);
    ctx.rotate((slot.rot * Math.PI) / 180);
    ctx.translate(-cx, -cy);
  }
  ctx.beginPath();
  ctx.rect(slot.x, slot.y, slot.w, slot.h);
  ctx.clip();

  if (img) {
    const zoom = panel.zoom || 1;
    const scale = Math.max(slot.w / img.naturalWidth, slot.h / img.naturalHeight) * zoom;
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const ox = (panel.dx || 0) * slot.w;
    const oy = (panel.dy || 0) * slot.h;
    ctx.filter = grade.filter;
    ctx.drawImage(img, cx - dw / 2 + ox, cy - dh / 2 + oy, dw, dh);
    ctx.filter = 'none';
  } else {
    const g = ctx.createLinearGradient(slot.x, slot.y, slot.x, slot.y + slot.h);
    g.addColorStop(0, '#3a1c5c');
    g.addColorStop(1, '#1a0b2e');
    ctx.fillStyle = g;
    ctx.fillRect(slot.x, slot.y, slot.w, slot.h);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = `400 ${Math.max(14, slot.h * 0.06)}px Anton, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ADD A PHOTO', cx, cy);
  }

  // The grade wash: a sunset or neon gradient laid over the photo.
  const wash = ctx.createLinearGradient(slot.x, slot.y, slot.x, slot.y + slot.h);
  wash.addColorStop(0, grade.washTop);
  wash.addColorStop(1, grade.washBottom);
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = wash;
  ctx.fillRect(slot.x, slot.y, slot.w, slot.h);
  ctx.globalCompositeOperation = 'source-over';

  // A white poster frame so the panels read apart.
  ctx.lineWidth = Math.max(2, w * 0.0022);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.strokeRect(slot.x, slot.y, slot.w, slot.h);
  ctx.restore();
}

// The halftone title block across the foot of the cover: the title in big
// Anton capitals with a sunset gradient fill, the subtitle in Pacifico.
function drawTitleBlock(ctx, state, grade, w, h) {
  const bandH = Math.round(h * 0.2);
  const bandY = h - bandH;
  ctx.save();
  ctx.fillStyle = '#12061d';
  ctx.fillRect(0, bandY, w, bandH);
  if (state.halftone) {
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = ctx.createPattern(halftoneTile(), 'repeat');
    ctx.fillRect(0, bandY, w, Math.round(bandH * 0.3));
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, bandY, w, Math.max(3, h * 0.004));

  const title = (state.title || '').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim();
  const cx = w / 2;
  if (title) {
    const size = fitFontSize(ctx, title, 'Anton, sans-serif', 400, Math.round(bandH * 0.56), w * 0.92);
    const grad = ctx.createLinearGradient(0, bandY + bandH * 0.18, 0, bandY + bandH * 0.72);
    grad.addColorStop(0, grade.titleFrom);
    grad.addColorStop(1, grade.titleTo);
    ctx.font = `${size}px Anton, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, size * 0.07);
    ctx.strokeStyle = '#1a0b2e';
    const ty = bandY + (subtitle ? bandH * 0.38 : bandH * 0.52);
    ctx.strokeText(title, cx, ty);
    ctx.fillStyle = grad;
    ctx.fillText(title, cx, ty);
  }
  if (subtitle) {
    const size = fitFontSize(ctx, subtitle, 'Pacifico, cursive', 400, Math.round(bandH * 0.22), w * 0.8);
    ctx.font = `${size}px Pacifico, cursive`;
    ctx.fillStyle = '#ffd319';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = Math.max(2, size * 0.15);
    ctx.fillText(subtitle, cx, bandY + bandH * 0.82);
    ctx.shadowBlur = 0;
  }
  ctx.restore();
}

// The badge ribbon in the top-right corner: a gold tab with notched ends.
function drawBadgeRibbon(ctx, state, w, h) {
  const text = (state.badge || '').trim().toUpperCase();
  if (!text) return;
  const rh = Math.max(18, Math.round(h * 0.042));
  const size = fitFontSize(ctx, text, 'Anton, sans-serif', 400, Math.round(rh * 0.58), w * 0.3);
  ctx.save();
  ctx.font = `${size}px Anton, sans-serif`;
  const tw = ctx.measureText(text).width;
  const rw = tw + rh * 1.6;
  const rx = w - rw - Math.round(w * 0.02);
  const ry = Math.round(h * 0.025);
  ctx.beginPath();
  ctx.moveTo(rx + rh * 0.55, ry);
  ctx.lineTo(rx + rw, ry);
  ctx.lineTo(rx + rw, ry + rh);
  ctx.lineTo(rx + rh * 0.55, ry + rh);
  ctx.lineTo(rx, ry + rh / 2);
  ctx.closePath();
  ctx.fillStyle = '#ffd319';
  ctx.fill();
  ctx.lineWidth = Math.max(2, rh * 0.08);
  ctx.strokeStyle = '#1a0b2e';
  ctx.stroke();
  ctx.fillStyle = '#1a0b2e';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, rx + rh * 0.55 + tw / 2 + rh * 0.1, ry + rh / 2 + 1);
  ctx.restore();
}

// Paint one whole cover. `photos` is a Map from photo id to its <img>.
export function drawCover(canvas, state, photos) {
  const size = sizeById(state.size);
  canvas.width = size.w;
  canvas.height = size.h;
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const grade = GRADES[state.grade];

  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, w, h);

  const slots = layoutSlots(state.layout, w, h);
  slots.forEach((slot, i) => {
    const panel = state.panels[i] || { photoId: null, zoom: 1, dx: 0, dy: 0 };
    const img = panel.photoId ? photos.get(panel.photoId) ?? null : null;
    drawPhotoPanel(ctx, img, slot, panel, grade, w, h);
  });

  drawTitleBlock(ctx, state, grade, w, h);
  drawBadgeRibbon(ctx, state, w, h);

  if (state.grain) {
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = ctx.createPattern(grainTile(), 'repeat');
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
  if (state.vignette) {
    const v = ctx.createRadialGradient(
      w / 2, h / 2, Math.min(w, h) * 0.42,
      w / 2, h / 2, Math.max(w, h) * 0.75,
    );
    v.addColorStop(0, 'rgba(8, 2, 16, 0)');
    v.addColorStop(1, 'rgba(8, 2, 16, 0.42)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
  }
}
