// Drawing a photo into a panel, poster-style.
//
// A panel photo is the photo cover-fitted into its rectangle at the
// panel's zoom and pan, then graded and finished: the grade's colour
// map, a posterize pass, a halftone dot screen, seeded grain, and a
// soft glow. The grain is seeded from the photo and the panel, never
// from Math.random, so the same document always renders the same
// bytes — the determinism check depends on it.
import { buildLut } from './grade-presets.js';

// A small string hash (FNV-1a) for seeding the grain.
function hashSeed(str) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

// A seeded pseudo-random generator: the same seed always gives the
// same numbers, so the grain never changes between runs.
function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The source rectangle of the photo that cover-fits `rect` at the
// given zoom and pan. Pan moves the crop window: panX -1 is all the
// way left, +1 all the way right; panY -1 is up, +1 is down.
function coverSource(img, rect, zoom, panX, panY) {
  const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * zoom;
  const sw = rect.w / scale;
  const sh = rect.h / scale;
  const maxX = img.naturalWidth - sw;
  const maxY = img.naturalHeight - sh;
  const sx = Math.max(0, Math.min(maxX, maxX / 2 + (panX || 0) * maxX / 2));
  const sy = Math.max(0, Math.min(maxY, maxY / 2 + (panY || 0) * maxY / 2));
  return { sx, sy, sw, sh };
}

// Draw the image into `rect` with the look applied. `opts` carries
// the grade object, the look sliders, and a seed string for the grain.
export function applyPosterPhoto(ctx, img, rect, opts = {}) {
  const look = opts.look || {};
  const w = Math.max(1, Math.round(rect.w));
  const h = Math.max(1, Math.round(rect.h));
  const scratch = document.createElement('canvas');
  scratch.width = w;
  scratch.height = h;
  const sctx = scratch.getContext('2d');
  const src = coverSource(img, rect, opts.zoom || 1, opts.panX || 0, opts.panY || 0);
  if (opts.flip) {
    sctx.save();
    sctx.translate(w, 0);
    sctx.scale(-1, 1);
    sctx.drawImage(img, src.sx, src.sy, src.sw, src.sh, 0, 0, w, h);
    sctx.restore();
  } else {
    sctx.drawImage(img, src.sx, src.sy, src.sw, src.sh, 0, 0, w, h);
  }
  // Grade + paint: remap every pixel through the grade table, then
  // posterize when the paint slider is up.
  const gradeStrength = look.grade ?? 62;
  const paint = look.paint ?? 10;
  if (opts.grade && gradeStrength > 0) {
    const lut = buildLut(opts.grade, gradeStrength);
    const data = sctx.getImageData(0, 0, w, h);
    const px = data.data;
    const steps = paint > 0 ? Math.max(2, Math.round(16 - paint / 8)) : 0;
    for (let i = 0; i < px.length; i += 4) {
      const r = px[i];
      const g = px[i + 1];
      const b = px[i + 2];
      // Each channel runs through the grade's curve on its own, so the
      // photo keeps its colours while taking on the grade's palette.
      // (A single brightness remap would wash everything monochrome.)
      let nr = lut[r * 3];
      let ng = lut[g * 3 + 1];
      let nb = lut[b * 3 + 2];
      if (steps > 0) {
        nr = Math.round(nr / 255 * steps) / steps * 255;
        ng = Math.round(ng / 255 * steps) / steps * 255;
        nb = Math.round(nb / 255 * steps) / steps * 255;
      }
      px[i] = nr;
      px[i + 1] = ng;
      px[i + 2] = nb;
    }
    sctx.putImageData(data, 0, 0);
  }
  // Halftone: a screen of dots, denser in the shadows.
  const halftone = look.halftone ?? 20;
  if (halftone > 0) {
    const gap = 7;
    sctx.fillStyle = `rgba(20, 18, 16, ${halftone / 220})`;
    for (let y = gap / 2; y < h; y += gap) {
      for (let x = gap / 2; x < w; x += gap) {
        sctx.beginPath();
        sctx.arc(x, y, 1.1, 0, Math.PI * 2);
        sctx.fill();
      }
    }
  }
  // Grain: seeded speckles, the same every render.
  const grain = look.grain ?? 22;
  if (grain > 0) {
    const rand = mulberry32(hashSeed(opts.seed || 'saltline'));
    const count = Math.floor((w * h * grain) / 9000);
    sctx.fillStyle = 'rgba(255, 250, 240, 0.5)';
    for (let i = 0; i < count; i++) {
      sctx.fillRect(Math.floor(rand() * w), Math.floor(rand() * h), 1, 1);
    }
    sctx.fillStyle = 'rgba(10, 8, 6, 0.5)';
    for (let i = 0; i < count; i++) {
      sctx.fillRect(Math.floor(rand() * w), Math.floor(rand() * h), 1, 1);
    }
  }
  // Glow: a warm wash from the top, strongest at the edges.
  const glow = look.glow ?? 26;
  if (glow > 0) {
    const wash = sctx.createLinearGradient(0, 0, 0, h);
    wash.addColorStop(0, `rgba(255, 190, 110, ${glow / 320})`);
    wash.addColorStop(1, 'rgba(255, 190, 110, 0)');
    sctx.fillStyle = wash;
    sctx.fillRect(0, 0, w, h);
  }
  ctx.drawImage(scratch, rect.x, rect.y, rect.w, rect.h);
}

// Draw one panel's photo: the panel's crop, its flip, and the look.
export function drawPanelPhoto(ctx, img, rect, panel, look, grade) {
  applyPosterPhoto(ctx, img, rect, {
    zoom: panel.zoom,
    panX: panel.panX,
    panY: panel.panY,
    flip: panel.flip,
    look,
    grade,
    seed: (panel.photo || '') + ':' + (panel.index ?? 0),
  });
}
