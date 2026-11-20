// poster-photo.js — turns a raw photo into a poster panel. The treatment is
// dials, not a blanket: Paint posterizes lightly, the grade LUT tints by
// luminance, Halftone adds a dot screen, Grain adds seeded noise, Glow lifts
// the highlights. Defaults keep faces bright and clean; the dials only add
// texture when the maker turns them up. Draft mode skips the two slowest
// passes (halftone and grain) while a slider is being dragged.
export function posterizeValue(value, levels) {
  if (levels <= 1) return value;
  const step = 255 / (levels - 1);
  return Math.round(Math.round(value / step) * step);
}

export function applyLookToImageData(imageData, look, lut, draft) {
  const data = imageData.data;
  const paintLevels = look.paint <= 0 ? 0 : Math.max(2, Math.round(24 - look.paint / 5));
  const glow = look.glow / 100;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    let nr = lut[lum * 3];
    let ng = lut[lum * 3 + 1];
    let nb = lut[lum * 3 + 2];
    // Keep a little of the photo's own colour so faces stay human.
    nr = Math.round(nr * 0.82 + r * 0.18);
    ng = Math.round(ng * 0.82 + g * 0.18);
    nb = Math.round(nb * 0.82 + b * 0.18);
    if (paintLevels > 0) {
      nr = posterizeValue(nr, paintLevels);
      ng = posterizeValue(ng, paintLevels);
      nb = posterizeValue(nb, paintLevels);
    }
    if (glow > 0) {
      const lift = lum / 255;
      nr = Math.min(255, nr + Math.round(glow * 26 * lift));
      ng = Math.min(255, ng + Math.round(glow * 22 * lift));
      nb = Math.min(255, nb + Math.round(glow * 12 * lift));
    }
    data[i] = nr;
    data[i + 1] = ng;
    data[i + 2] = nb;
  }
  if (!draft && look.grain > 0) {
    addSeededGrain(data, imageData.width, imageData.height, look.grain, 20261120);
  }
  return imageData;
}

export function addSeededGrain(data, width, height, amount, seed) {
  let state = seed >>> 0;
  const next = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const strength = amount * 0.55;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (next() - 0.5) * strength;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
}

export function halftonePattern(size, dot) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, dot, 0, Math.PI * 2);
  ctx.fill();
  return canvas;
}

export function drawHalftone(ctx, rect, strength, draft) {
  if (strength <= 0 || draft) return;
  const spacing = 7;
  const pattern = halftonePattern(spacing, 1.6);
  const fill = ctx.createPattern(pattern, 'repeat');
  ctx.save();
  ctx.globalAlpha = strength / 100 * 0.35;
  ctx.fillStyle = fill;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

export function drawPanelPhoto(ctx, image, rect, slot, draft, extraBias) {
  const zoom = slot.zoom || 1;
  const scale = Math.max(rect.w / image.naturalWidth, rect.h / image.naturalHeight) * zoom;
  const dw = image.naturalWidth * scale;
  const dh = image.naturalHeight * scale;
  const faceBias = slot.faceMarked ? -0.1 - (extraBias || 0) : 0;
  const dx = rect.x + (rect.w - dw) / 2 + (slot.panX || 0) * rect.w * 0.1;
  const dy = rect.y + (rect.h - dh) / 2 + (slot.panY || 0) * rect.h * 0.1 + faceBias * rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (slot.flip) {
    ctx.translate(rect.x + rect.w / 2, 0);
    ctx.scale(-1, 1);
    ctx.translate(-(rect.x + rect.w / 2), 0);
  }
  ctx.drawImage(image, dx, dy, dw, dh);
  ctx.restore();
}
