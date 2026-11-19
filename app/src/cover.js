// The cover renderer. drawCover() draws a whole cover onto any canvas at
// any size: every geometry is computed from the canvas size, and every
// panel framing is a relative value (zoom, panX, panY), so the same state
// renders identically at 1080x1080, 1080x1350 and 1920x1080. Exports render
// natively at their own size — never a scaled-up preview.

import { layoutById } from './layouts.js';
import { gradeById, buildGradeLUT, gradeCanvasInPlace } from './grades.js';
import { SIZES } from './state.js';

let grainTile = null;

function getGrainTile() {
  if (grainTile) return grainTile;
  const tile = document.createElement('canvas');
  tile.width = 140;
  tile.height = 140;
  const tctx = tile.getContext('2d');
  const img = tctx.createImageData(140, 140);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(Math.random() * 255);
    img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  tctx.putImageData(img, 0, 0);
  grainTile = tile;
  return tile;
}

// Where the photo's focal point sits. Square and portrait photos in wide
// panels start looking at the upper third, where faces are, instead of the
// middle — otherwise a cover-fit crop can leave a headless torso.
export function smartFrame(img, rectW, rectH) {
  const tallPhoto = img.naturalHeight >= img.naturalWidth;
  const widePanel = rectW > rectH * 1.15;
  if (tallPhoto && widePanel) return { zoom: 1, panX: 0, panY: -0.6 };
  return { zoom: 1, panX: 0, panY: 0 };
}

function drawPhotoInto(ctx, img, rect, framing, lut) {
  const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * framing.zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const fx = 0.5 + framing.panX * 0.3;
  const fy = 0.5 + framing.panY * 0.3;
  const dx = rect.x + rect.w / 2 - dw * fx;
  const dy = rect.y + rect.h / 2 - dh * fy;

  const temp = document.createElement('canvas');
  temp.width = Math.max(2, Math.round(rect.w));
  temp.height = Math.max(2, Math.round(rect.h));
  const tctx = temp.getContext('2d');
  tctx.drawImage(img, dx - rect.x, dy - rect.y, dw, dh);
  gradeCanvasInPlace(temp, lut);
  ctx.drawImage(temp, rect.x, rect.y, rect.w, rect.h);
}

function fitFont(ctx, text, maxWidth, startSize, family) {
  let size = startSize;
  while (size > 12) {
    ctx.font = `${size}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  }
  ctx.font = `${size}px ${family}`;
  return size;
}

function drawHalftone(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = 'rgba(255, 210, 63, 0.10)';
  const step = Math.max(10, Math.round(w / 72));
  for (let row = 0; row * step < h; row++) {
    for (let col = 0; col * step < w; col++) {
      const cx = x + col * step + (row % 2 ? step / 2 : 0);
      const cy = y + row * step;
      const r = Math.max(0.6, step * 0.16 * (1 - row / Math.max(1, h / step)));
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawTitleBand(ctx, state, W, H, photoAreaH) {
  const bandY = photoAreaH;
  const bandH = H - photoAreaH;
  ctx.save();
  ctx.fillStyle = '#170a10';
  ctx.fillRect(0, bandY, W, bandH);
  drawHalftone(ctx, W * 0.04, bandY + bandH * 0.08, W * 0.92, bandH * 0.3);

  const title = (state.title || 'NEON COAST').toUpperCase();
  const maxW = W * 0.9;
  const titleSize = fitFont(ctx, title, maxW, Math.round(bandH * 0.58), "Anton, 'Arial Narrow', sans-serif");
  const grad = ctx.createLinearGradient(0, bandY, 0, bandY + bandH * 0.62);
  grad.addColorStop(0, '#ffd23f');
  grad.addColorStop(0.55, '#ff8a00');
  grad.addColorStop(1, '#ff5a1f');
  ctx.fillStyle = grad;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(title, W / 2, bandY + bandH * 0.6);

  if (state.subtitle) {
    const subSize = Math.max(14, Math.round(bandH * 0.2));
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.fillStyle = '#ffe9c4';
    ctx.fillText(state.subtitle, W / 2, bandY + bandH * 0.92);
  }
  ctx.restore();
  return titleSize;
}

function drawBadge(ctx, state, W, H) {
  if (!state.badge) return;
  const label = state.badge;
  const pad = Math.max(10, Math.round(W * 0.012));
  const h = Math.max(22, Math.round(H * 0.028));
  ctx.save();
  ctx.font = `${Math.round(h * 0.52)}px Anton, 'Arial Narrow', sans-serif`;
  const tw = ctx.measureText(label).width;
  const w = tw + pad * 2 + h * 0.5;
  const x = W - w - Math.round(W * 0.02);
  const y = Math.round(H * 0.02);
  ctx.beginPath();
  ctx.moveTo(x + h * 0.5, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + h * 0.5, y + h);
  ctx.lineTo(x, y + h / 2);
  ctx.closePath();
  ctx.fillStyle = '#ffd23f';
  ctx.fill();
  ctx.fillStyle = '#170a10';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + pad + h * 0.25, y + h / 2 + 1);
  ctx.restore();
}

function drawGrainAndVignette(ctx, W, H) {
  const pattern = ctx.createPattern(getGrainTile(), 'repeat');
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.72);
  vg.addColorStop(0, 'rgba(12, 5, 9, 0)');
  vg.addColorStop(1, 'rgba(12, 5, 9, 0.3)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
}

export function drawCover(canvas, state, images) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const layout = layoutById(state.layoutId);
  const grade = gradeById(state.gradeId);
  const lut = buildGradeLUT(grade);
  const gutter = Math.max(3, Math.round(W * 0.004));

  const titleH = Math.round(H * 0.2);
  const photoH = layout.titleOverlay ? H : H - titleH;
  const photoW = W;

  ctx.fillStyle = '#14090f';
  ctx.fillRect(0, 0, W, H);

  const rects = layout.panels().map((p) => ({
    x: p.x * photoW,
    y: p.y * photoH,
    w: p.w * photoW,
    h: p.h * photoH,
    rot: p.rot,
    z: p.z ?? 0,
  }));

  const order = rects.map((r, i) => i).sort((a, b) => rects[a].z - rects[b].z);
  for (const i of order) {
    const rect = rects[i];
    const panel = state.panels[i];
    if (!panel) continue;
    const img = images.get(panel.photoId);
    if (!img) continue;
    const inset = {
      x: rect.x + gutter / 2,
      y: rect.y + gutter / 2,
      w: Math.max(2, rect.w - gutter),
      h: Math.max(2, rect.h - gutter),
    };
    if (rect.rot) {
      const temp = document.createElement('canvas');
      temp.width = Math.max(2, Math.round(inset.w));
      temp.height = Math.max(2, Math.round(inset.h));
      const tctx = temp.getContext('2d');
      drawPhotoInto(tctx, img, { x: 0, y: 0, w: temp.width, h: temp.height }, panel, lut);
      ctx.save();
      ctx.translate(inset.x + inset.w / 2, inset.y + inset.h / 2);
      ctx.rotate(rect.rot);
      ctx.drawImage(temp, -inset.w / 2, -inset.h / 2, inset.w, inset.h);
      ctx.strokeStyle = '#14090f';
      ctx.lineWidth = Math.max(3, Math.round(W * 0.004));
      ctx.strokeRect(-inset.w / 2, -inset.h / 2, inset.w, inset.h);
      ctx.strokeStyle = 'rgba(255, 210, 63, 0.55)';
      ctx.lineWidth = 1;
      ctx.strokeRect(-inset.w / 2 + 4, -inset.h / 2 + 4, inset.w - 8, inset.h - 8);
      ctx.restore();
    } else {
      drawPhotoInto(ctx, img, inset, panel, lut);
      ctx.strokeStyle = '#14090f';
      ctx.lineWidth = Math.max(3, Math.round(W * 0.004));
      ctx.strokeRect(inset.x, inset.y, inset.w, inset.h);
      ctx.strokeStyle = 'rgba(255, 210, 63, 0.55)';
      ctx.lineWidth = 1;
      ctx.strokeRect(inset.x + 4, inset.y + 4, inset.w - 8, inset.h - 8);
    }
  }

  if (layout.titleOverlay) {
    const bandH = titleH;
    const bandY = H - bandH;
    ctx.save();
    ctx.fillStyle = 'rgba(23, 10, 16, 0.88)';
    ctx.fillRect(0, bandY, W, bandH);
    ctx.restore();
    drawTitleBand(ctx, state, W, H, bandY);
  } else {
    drawTitleBand(ctx, state, W, H, photoH);
  }

  drawBadge(ctx, state, W, H);
  drawGrainAndVignette(ctx, W, H);
}

// Render one size and return its PNG data URL. The framing is relative,
// so the same state exports correctly at every size.
export function exportPNGDataURL(sizeId, state, images) {
  const size = SIZES[sizeId];
  if (!size) throw new Error(`unknown size ${sizeId}`);
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  drawCover(canvas, state, images);
  return canvas.toDataURL('image/png');
}
