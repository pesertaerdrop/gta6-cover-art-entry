// Turns a raw photo into a poster panel. The treatment is dials, not a
// blanket: Paint posterizes lightly, the grade LUT tints by brightness,
// Halftone prints a dot screen, Grain adds noise, Glow lifts the centre.
// Draft mode skips the per-pixel pass so a slider drag stays live; the
// full treatment lands on release and on export.
import { buildLut, gradeById } from './grade-presets.js';

function posterize(value, levels) {
  if (levels >= 256) return value;
  const step = 256 / levels;
  return Math.min(255, Math.floor(value / step) * step + step / 2);
}

// The source rectangle for a cover-fit draw of img into rect at the given
// zoom and pan, biased upward when the panel's face is marked (faces sit
// in the upper part of a photo, so the crop keeps them in frame).
function coverSource(img, rect, zoom, panX, panY, faceMarked) {
  const scale = Math.max(rect.w / img.width, rect.h / img.height) * zoom;
  const sw = rect.w / scale;
  const sh = rect.h / scale;
  let sx = (img.width - sw) / 2 + (panX || 0) * (img.width - sw) / 2;
  let sy;
  const portraitPhoto = img.height > img.width;
  const landscapePanel = rect.w > rect.h;
  if (portraitPhoto && landscapePanel) {
    // Faces sit in the upper third of a portrait photo; a centred crop
    // would keep only the torso. Start the crop near the top instead
    // (higher still when the face is marked).
    const topBias = faceMarked ? 0.08 : 0.15;
    sy = (img.height - sh) * topBias + (panY || 0) * (img.height - sh) / 2;
  } else {
    sy = (img.height - sh) / 2 + (panY || 0) * (img.height - sh) / 2;
    if (faceMarked) sy = Math.max(0, sy - sh * 0.12);
  }
  sx = Math.max(0, Math.min(img.width - sw, sx));
  sy = Math.max(0, Math.min(img.height - sh, sy));
  return { sx, sy, sw, sh };
}

function applyPixels(imageData, lut, paint, grain) {
  const data = imageData.data;
  const levels = Math.max(2, Math.round(16 - paint * 0.6));
  const noise = grain * 0.5;
  for (let i = 0; i < data.length; i += 4) {
    let r = lut[data[i] * 3];
    let g = lut[data[i + 1] * 3 + 1];
    let b = lut[data[i + 2] * 3 + 2];
    if (paint > 0) {
      r = posterize(r, levels);
      g = posterize(g, levels);
      b = posterize(b, levels);
    }
    if (noise > 0) {
      const n = (Math.random() - 0.5) * noise;
      r = Math.max(0, Math.min(255, r + n));
      g = Math.max(0, Math.min(255, g + n));
      b = Math.max(0, Math.min(255, b + n));
    }
    data[i] = r; data[i + 1] = g; data[i + 2] = b;
  }
}

function drawHalftone(ctx, rect, strength) {
  if (strength <= 0) return;
  const spacing = 6;
  const alpha = (strength / 100) * 0.45;
  ctx.save();
  ctx.fillStyle = `rgba(0,0,0,${alpha})`;
  for (let y = rect.y + spacing / 2; y < rect.y + rect.h; y += spacing) {
    for (let x = rect.x + spacing / 2; x < rect.x + rect.w; x += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawGlow(ctx, rect, strength) {
  if (strength <= 0) return;
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h * 0.35;
  const radius = Math.max(rect.w, rect.h) * 0.7;
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  gradient.addColorStop(0, `rgba(255,255,255,${0.18 * (strength / 100)})`);
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = gradient;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

// Draw img into rect on ctx with the full poster treatment. opts: grade id,
// look {paint, grade, halftone, grain, glow}, zoom, panX, panY, flip,
// faceMarked, draft (skip the per-pixel pass).
export function applyPosterPhoto(ctx, img, rect, opts = {}) {
  const look = opts.look || {};
  const grade = gradeById(opts.grade || 'sunset');
  const zoom = opts.zoom || 1;
  const flip = !!opts.flip;
  const src = coverSource(img, rect, zoom, opts.panX || 0, opts.panY || 0, !!opts.faceMarked);

  if (opts.draft) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    if (flip) {
      ctx.translate(rect.x + rect.w, rect.y);
      ctx.scale(-1, 1);
      ctx.drawImage(img, src.sx, src.sy, src.sw, src.sh, 0, 0, rect.w, rect.h);
    } else {
      ctx.drawImage(img, src.sx, src.sy, src.sw, src.sh, rect.x, rect.y, rect.w, rect.h);
    }
    ctx.restore();
    return;
  }

  const off = document.createElement('canvas');
  off.width = Math.max(1, Math.round(rect.w));
  off.height = Math.max(1, Math.round(rect.h));
  const octx = off.getContext('2d');
  if (flip) {
    octx.translate(off.width, 0);
    octx.scale(-1, 1);
    octx.drawImage(img, src.sx, src.sy, src.sw, src.sh, 0, 0, off.width, off.height);
  } else {
    octx.drawImage(img, src.sx, src.sy, src.sw, src.sh, 0, 0, off.width, off.height);
  }
  const imageData = octx.getImageData(0, 0, off.width, off.height);
  applyPixels(imageData, buildLut(grade, look.grade ?? 62), look.paint ?? 10, look.grain ?? 22);
  octx.putImageData(imageData, 0, 0);
  drawHalftone(octx, { x: 0, y: 0, w: off.width, h: off.height }, look.halftone ?? 20);
  drawGlow(octx, { x: 0, y: 0, w: off.width, h: off.height }, look.glow ?? 26);
  ctx.drawImage(off, rect.x, rect.y, rect.w, rect.h);
}

// Draw one document panel (a photo plus its treatment settings) into rect.
export function drawPanelPhoto(ctx, img, rect, panel, look, grade) {
  applyPosterPhoto(ctx, img, rect, {
    grade,
    look,
    zoom: panel.zoom || 1,
    panX: panel.panX || 0,
    panY: panel.panY || 0,
    flip: !!panel.flip,
    faceMarked: !!panel.faceMarked,
    draft: !!panel.draft,
  });
}
