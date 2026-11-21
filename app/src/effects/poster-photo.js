// The poster photo pipeline: how a sample photo becomes a panel. Every
// panel is drawn cover-fit (the photo fills the panel, cropped to its
// aspect), then graded, posterised, halftoned and grained on an offscreen
// canvas before it lands on the cover. All randomness is seeded from the
// photo and the panel, so the same document always draws the same pixels.
import { buildLut } from './grade-presets.js';

// A tiny seeded PRNG (mulberry32) fed by a string hash: stable per panel.
function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The source rectangle of a cover-fit draw: the photo is scaled so its
// smaller side covers the panel, then zoomed and panned. Pan is in
// fractions of the panel (0 keeps the centre, ±1 moves a full panel).
function coverSource(img, rect, zoom, panX, panY) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const sx = (dw - rect.w) / 2 / scale - (panX * rect.w) / 2 / scale;
  const sy = (dh - rect.h) / 2 / scale - (panY * rect.h) / 2 / scale;
  return { sx: Math.max(0, Math.min(iw - rect.w / scale, sx)), sy: Math.max(0, Math.min(ih - rect.h / scale, sy)), sw: rect.w / scale, sh: rect.h / scale };
}

// Draw an image into a rect with the poster treatment. opts: { zoom,
// panX, panY, flip, look, grade, seed }. look carries paint (posterise),
// grade (ramp strength), halftone (dot overlay), grain (noise) and glow
// (highlight lift). Pass a grade object from gradeById, or null for none.
export function applyPosterPhoto(ctx, img, rect, opts = {}) {
  const look = opts.look || {};
  const zoom = opts.zoom || 1;
  const panX = opts.panX || 0;
  const panY = opts.panY || 0;
  const w = Math.max(2, Math.round(rect.w));
  const h = Math.max(2, Math.round(rect.h));
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  const octx = off.getContext('2d');
  const src = coverSource(img, { w, h }, zoom, panX, panY);
  if (opts.flip) {
    octx.save();
    octx.translate(w, 0);
    octx.scale(-1, 1);
    octx.drawImage(img, src.sx, src.sy, src.sw, src.sh, 0, 0, w, h);
    octx.restore();
  } else {
    octx.drawImage(img, src.sx, src.sy, src.sw, src.sh, 0, 0, w, h);
  }
  const imageData = octx.getImageData(0, 0, w, h);
  const data = imageData.data;
  const lut = opts.grade ? buildLut(opts.grade, look.grade ?? 60) : null;
  const paint = look.paint ?? 10;
  const steps = Math.max(3, Math.round(16 - paint * 0.13));
  const stepSize = 255 / (steps - 1);
  const grainAmt = (look.grain ?? 22) * 0.45;
  const glowAmt = (look.glow ?? 26) / 100;
  const rand = mulberry32(hashSeed(`${opts.seed || img.src || 'panel'}`));
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    if (lut) {
      r = lut[r * 3];
      g = lut[g * 3 + 1];
      b = lut[b * 3 + 2];
    }
    if (paint > 0) {
      r = Math.round(r / stepSize) * stepSize;
      g = Math.round(g / stepSize) * stepSize;
      b = Math.round(b / stepSize) * stepSize;
    }
    if (glowAmt > 0) {
      const lift = (r / 255) * (r / 255) * glowAmt * 40;
      r = Math.min(255, r + lift);
      g = Math.min(255, g + lift * 0.9);
      b = Math.min(255, b + lift * 0.8);
    }
    if (grainAmt > 0) {
      const n = (rand() - 0.5) * 2 * grainAmt;
      r = Math.max(0, Math.min(255, r + n));
      g = Math.max(0, Math.min(255, g + n));
      b = Math.max(0, Math.min(255, b + n));
    }
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
  octx.putImageData(imageData, 0, 0);
  // Halftone: a faint grid of dots, stronger where the look asks for it.
  const halftone = look.halftone ?? 20;
  if (halftone > 0) {
    const gap = 7;
    octx.fillStyle = `rgba(10, 8, 12, ${0.05 + (halftone / 100) * 0.16})`;
    for (let y = gap / 2; y < h; y += gap) {
      for (let x = gap / 2; x < w; x += gap) {
        octx.beginPath();
        octx.arc(x, y, 1.1, 0, Math.PI * 2);
        octx.fill();
      }
    }
  }
  ctx.drawImage(off, rect.x, rect.y, rect.w, rect.h);
}

// Draw one panel's photo: cover-fit with the panel's zoom, pan and flip,
// graded by the cover's grade, seeded by the panel's photo and index.
export function drawPanelPhoto(ctx, img, rect, panel, look, grade) {
  applyPosterPhoto(ctx, img, rect, {
    zoom: panel.zoom ?? 1.15,
    panX: panel.panX ?? 0,
    panY: panel.panY ?? 0,
    flip: !!panel.flip,
    look,
    grade,
    seed: `${img.src || ''}#${panel.index ?? 0}`,
  });
}
