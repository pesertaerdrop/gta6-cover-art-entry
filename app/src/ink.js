// ink.js — Poster Ink, the signature illustrated-photo pipeline.
//
// Blur -> posterize luminance into bands keeping hue -> lift darks ->
// halftone dots in the shadows -> Sobel ink lines -> grain + vignette.
// The pipeline runs on the art canvas in place, then blends back at
// `strength`, so the editor can offer a real dial, not just on/off.

function newCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, w);
  c.height = Math.max(1, h);
  return c;
}

// Two-pass box blur (canvas blur filter) of the art canvas.
function softBlur(src, w, h) {
  const first = newCanvas(w, h);
  const fctx = first.getContext("2d");
  fctx.filter = "blur(2px)";
  fctx.drawImage(src, 0, 0);
  const second = newCanvas(w, h);
  const sctx = second.getContext("2d");
  sctx.filter = "blur(2px)";
  sctx.drawImage(first, 0, 0);
  return second;
}

// Posterize lookup: input luminance 0..255 -> output luminance after
// banding into 5 steps and lifting the darkest band toward 0.47 mean,
// so shadow detail survives the flattening.
const POSTER_LUT = (() => {
  const lut = new Uint8Array(256);
  for (let l = 0; l < 256; l++) {
    let q = Math.round((l / 255) * 4) / 4;
    let out = q * 255;
    if (out < 120) out = out + (120 - out) * 0.45;
    lut[l] = Math.round(out);
  }
  return lut;
})();

// Posterize into 5 luminance bands, keeping hue by scaling the
// channels with the banded luminance.
function posterize(ctx, w, h) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    const l = (r * 299 + g * 587 + b * 114) >> 10;
    const s = (POSTER_LUT[l] + 1) / (l + 1);
    d[i] = Math.min(255, r * s);
    d[i + 1] = Math.min(255, g * s);
    d[i + 2] = Math.min(255, b * s);
  }
  ctx.putImageData(img, 0, 0);
  return img;
}

// Halftone dots where the (posterized) luminance is under 0.28.
function halftone(ctx, w, h, img) {
  const d = img.data;
  const step = Math.max(5, Math.round(w / 280));
  ctx.save();
  ctx.fillStyle = "#160708";
  ctx.beginPath();
  for (let y = step / 2; y < h; y += step) {
    for (let x = step / 2; x < w; x += step) {
      const i = ((y | 0) * w + (x | 0)) * 4;
      const l = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) >> 10;
      if (l < 71) {
        const r = ((71 - l) / 71) * step * 0.52;
        ctx.moveTo(x + r, y);
        ctx.arc(x, y, r, 0, Math.PI * 2);
      }
    }
  }
  ctx.fill();
  ctx.restore();
}

// Sobel ink lines from a half-size smoothed copy; edges come back as
// dark lines drawn over the art at full size.
function sobelEdges(ctx, w, h, smooth) {
  const hw = Math.max(2, w >> 1);
  const hh = Math.max(2, h >> 1);
  const half = newCanvas(hw, hh);
  half.getContext("2d").drawImage(smooth, 0, 0, hw, hh);
  const src = half.getContext("2d").getImageData(0, 0, hw, hh).data;
  const gray = new Uint8Array(hw * hh);
  for (let i = 0; i < hw * hh; i++) {
    gray[i] = (src[i * 4] * 299 + src[i * 4 + 1] * 587 + src[i * 4 + 2] * 114) >> 10;
  }
  const edge = newCanvas(hw, hh);
  const ectx = edge.getContext("2d");
  const out = ectx.createImageData(hw, hh);
  const od = out.data;
  for (let y = 1; y < hh - 1; y++) {
    for (let x = 1; x < hw - 1; x++) {
      const i = y * hw + x;
      const gx = -gray[i - hw - 1] - 2 * gray[i - 1] - gray[i + hw - 1]
        + gray[i - hw + 1] + 2 * gray[i + 1] + gray[i + hw + 1];
      const gy = -gray[i - hw - 1] - 2 * gray[i - hw] - gray[i - hw + 1]
        + gray[i + hw - 1] + 2 * gray[i + hw] + gray[i + hw + 1];
      const mag = Math.abs(gx) + Math.abs(gy);
      if (mag > 110) {
        od[i * 4] = 24;
        od[i * 4 + 1] = 8;
        od[i * 4 + 2] = 10;
        od[i * 4 + 3] = Math.min(255, (mag - 110) * 1.4);
      }
    }
  }
  ectx.putImageData(out, 0, 0);
  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(edge, 0, 0, w, h);
  ctx.restore();
}

let noiseTile = null;
function grain(ctx, w, h) {
  if (!noiseTile) {
    noiseTile = newCanvas(128, 128);
    const nctx = noiseTile.getContext("2d");
    const img = nctx.createImageData(128, 128);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = 96 + Math.floor(Math.random() * 64);
      d[i] = v;
      d[i + 1] = v;
      d[i + 2] = v;
      d[i + 3] = 255;
    }
    nctx.putImageData(img, 0, 0);
  }
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.globalCompositeOperation = "overlay";
  ctx.fillStyle = ctx.createPattern(noiseTile, "repeat");
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function vignette(ctx, w, h) {
  const g = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42,
    w / 2, h / 2, Math.max(w, h) * 0.72
  );
  g.addColorStop(0, "rgba(12,4,6,0)");
  g.addColorStop(1, "rgba(12,4,6,0.22)");
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

// Full pipeline: grade the art first (grades.js), then ink it.
// `strength` 0..1 blends the inked art back over the graded art.
export function applyPosterInk(ctx, w, h, strength) {
  if (strength <= 0.01) return;
  const smooth = softBlur(ctx.canvas, w, h);
  const inked = newCanvas(w, h);
  const ictx = inked.getContext("2d");
  ictx.drawImage(ctx.canvas, 0, 0);
  const img = posterize(ictx, w, h);
  halftone(ictx, w, h, img);
  sobelEdges(ictx, w, h, smooth);
  grain(ictx, w, h);
  vignette(ictx, w, h);
  ctx.save();
  ctx.globalAlpha = Math.min(1, strength);
  ctx.drawImage(inked, 0, 0);
  ctx.restore();
}
