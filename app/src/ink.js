// ink.js — Poster Ink: the signature illustrated-photo pipeline.
// Blur -> posterize luminance into bands keeping hue -> lift darks ->
// halftone dots in the shadows -> Sobel ink lines -> grain + vignette.
// Works on the art canvas in place, blended back at `strength` so the
// editor can offer a real dial, not just on/off.

function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, w);
  c.height = Math.max(1, h);
  return c;
}

// Two-pass box blur (via the canvas blur filter) of the art canvas.
function blurredCopy(src, w, h) {
  const a = makeCanvas(w, h);
  const actx = a.getContext("2d");
  actx.filter = "blur(2px)";
  actx.drawImage(src, 0, 0);
  const b = makeCanvas(w, h);
  const bctx = b.getContext("2d");
  bctx.filter = "blur(2px)";
  bctx.drawImage(a, 0, 0);
  return b;
}

// Posterize into 5 luminance bands, keeping hue by scaling the channels,
// and lift the darkest band toward a mean luminance of 0.47 so shadow
// detail survives the flattening.
function posterizeInPlace(ctx, w, h) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    const l = (r * 299 + g * 587 + b * 114) >> 10;
    let q = Math.round((l / 255) * 4) / 4;
    let lq = q * 255;
    if (lq < 120) lq = lq + (120 - lq) * 0.45;
    const s = (lq + 1) / (l + 1);
    d[i] = Math.min(255, r * s);
    d[i + 1] = Math.min(255, g * s);
    d[i + 2] = Math.min(255, b * s);
  }
  ctx.putImageData(img, 0, 0);
  return img;
}

// Halftone dots where the (posterized) luminance is under 0.28.
function halftoneDots(ctx, w, h, img) {
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
function sobelInk(ctx, w, h, smooth) {
  const hw = Math.max(2, w >> 1);
  const hh = Math.max(2, h >> 1);
  const half = makeCanvas(hw, hh);
  const hctx = half.getContext("2d");
  hctx.drawImage(smooth, 0, 0, hw, hh);
  const img = hctx.getImageData(0, 0, hw, hh);
  const d = img.data;
  const lum = new Uint8Array(hw * hh);
  for (let i = 0; i < hw * hh; i++) {
    lum[i] = (d[i * 4] * 299 + d[i * 4 + 1] * 587 + d[i * 4 + 2] * 114) >> 10;
  }
  const edge = makeCanvas(hw, hh);
  const ectx = edge.getContext("2d");
  const out = ectx.createImageData(hw, hh);
  const od = out.data;
  for (let y = 1; y < hh - 1; y++) {
    for (let x = 1; x < hw - 1; x++) {
      const i = y * hw + x;
      const gx =
        -lum[i - hw - 1] - 2 * lum[i - 1] - lum[i + hw - 1] +
        lum[i - hw + 1] + 2 * lum[i + 1] + lum[i + hw + 1];
      const gy =
        -lum[i - hw - 1] - 2 * lum[i - hw] - lum[i - hw + 1] +
        lum[i + hw - 1] + 2 * lum[i + hw] + lum[i + hw + 1];
      const mag = Math.abs(gx) + Math.abs(gy);
      if (mag > 110) {
        const a = Math.min(255, (mag - 110) * 1.4);
        od[i * 4] = 24;
        od[i * 4 + 1] = 8;
        od[i * 4 + 2] = 10;
        od[i * 4 + 3] = a;
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
    noiseTile = makeCanvas(128, 128);
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

// Full pipeline: grade the art first (grades.js), then ink it. `strength`
// 0..1 blends the inked art back over the graded art.
export function applyPosterInk(ctx, w, h, strength) {
  if (strength <= 0.01) return;
  const smooth = blurredCopy(ctx.canvas, w, h);
  const inked = makeCanvas(w, h);
  const ictx = inked.getContext("2d");
  ictx.drawImage(ctx.canvas, 0, 0);
  const img = posterizeInPlace(ictx, w, h);
  halftoneDots(ictx, w, h, img);
  sobelInk(ictx, w, h, smooth);
  grain(ictx, w, h);
  vignette(ictx, w, h);
  ctx.save();
  ctx.globalAlpha = Math.min(1, strength);
  ctx.drawImage(inked, 0, 0);
  ctx.restore();
}
