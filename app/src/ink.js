// ink.js — Poster Ink, the print effect that makes the photos read as
// a poster instead of a collage.
//
// The pipeline, in order:
//   1. soften — a half-size downscale and back, which takes the digital
//      edge off before the posterise step
//   2. posterise luminance into five bands, keeping the hue — the flat
//      colour fields of a screen print
//   3. lift the darks toward mid grey, so shadows keep detail instead
//      of crushing to black, plus a whisper of seeded grain in the same
//      pass
//   4. halftone dots where the picture is dark, the print texture
//   5. Sobel ink lines along strong edges, the comic-book outline
//   6. a vignette, the paper's dark corners
// The grain seed is fixed (1337) so the same cover renders byte-identical
// pixels every run — determinism is a gate, not a nice-to-have.
// `strength` blends the inked result back over the graded photo; 0
// leaves the photo alone (Raw Stock).

export function seededRandom(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function blankCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

// Two-pass cheap blur: draw the canvas down to half size and back up.
function soften(source) {
  const half = blankCanvas(source.width / 2, source.height / 2);
  const hctx = half.getContext('2d');
  hctx.imageSmoothingEnabled = true;
  hctx.imageSmoothingQuality = 'high';
  hctx.drawImage(source, 0, 0, half.width, half.height);
  const out = blankCanvas(source.width, source.height);
  const octx = out.getContext('2d');
  octx.imageSmoothingEnabled = true;
  octx.imageSmoothingQuality = 'high';
  octx.drawImage(half, 0, 0, out.width, out.height);
  return out;
}

// The five luminance bands. A pixel's luminance snaps to the largest
// band edge at or below it, and its colour is scaled to match — hue
// kept, tonal steps flattened.
const BANDS = [0.09, 0.26, 0.45, 0.66, 0.88];

function posterizePixel(r, g, b) {
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  let band = BANDS[0];
  for (const edge of BANDS) if (lum >= edge) band = edge;
  const target = band * 255;
  const cur = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  if (cur < 4) return [target * 0.4, target * 0.4, target * 0.4];
  const k = target / cur;
  return [Math.min(255, r * k), Math.min(255, g * k), Math.min(255, b * k)];
}

// Sobel edge strength on a half-size greyscale copy, 0..1 per pixel.
function sobelEdges(source) {
  const w = Math.max(2, Math.floor(source.width / 2));
  const h = Math.max(2, Math.floor(source.height / 2));
  const small = blankCanvas(w, h);
  const sctx = small.getContext('2d');
  sctx.drawImage(source, 0, 0, w, h);
  const data = sctx.getImageData(0, 0, w, h).data;
  const grey = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    grey[i] = 0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2];
  }
  const edge = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const gx =
        -grey[i - w - 1] - 2 * grey[i - 1] - grey[i + w - 1] +
        grey[i - w + 1] + 2 * grey[i + 1] + grey[i + w + 1];
      const gy =
        -grey[i - w - 1] - 2 * grey[i - w] - grey[i - w + 1] +
        grey[i + w - 1] + 2 * grey[i + w] + grey[i + w + 1];
      edge[i] = Math.sqrt(gx * gx + gy * gy) / 1020;
    }
  }
  return { edge, w, h };
}

// Run Poster Ink over a canvas and return a new canvas. `strength` 0..1
// blends the inked result over the input; 1 is full ink.
export function applyInk(source, strength = 1) {
  if (strength <= 0) return source;
  const w = source.width;
  const h = source.height;
  const soft = soften(source);
  const ctx = soft.getContext('2d');
  const img = ctx.getImageData(0, 0, w, h);
  const px = img.data;
  const rnd = seededRandom(1337);

  // Posterize + lift the darks toward mid grey, then grain.
  for (let i = 0; i < px.length; i += 4) {
    const [r, g, b] = posterizePixel(px[i], px[i + 1], px[i + 2]);
    const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    const lift = lum < 0.47 ? (0.47 - lum) * 0.45 : 0;
    const grain = (rnd() - 0.5) * 8;
    px[i] = Math.min(255, Math.max(0, r + lift * 255 + grain));
    px[i + 1] = Math.min(255, Math.max(0, g + lift * 255 + grain));
    px[i + 2] = Math.min(255, Math.max(0, b + lift * 255 + grain));
  }
  ctx.putImageData(img, 0, 0);

  // Halftone dots where the picture is dark. One full read, indexed per
  // dot, instead of a getImageData call per dot.
  const dot = blankCanvas(w, h);
  const dctx = dot.getContext('2d');
  const step = Math.max(5, Math.round(w / 220));
  const full = ctx.getImageData(0, 0, w, h).data;
  for (let y = step / 2; y < h; y += step) {
    for (let x = step / 2; x < w; x += step) {
      const p = (Math.floor(y) * w + Math.floor(x)) * 4;
      const lum = (0.2126 * full[p] + 0.7152 * full[p + 1] + 0.0722 * full[p + 2]) / 255;
      if (lum < 0.28) {
        const rad = step * 0.42 * (1 - lum / 0.28);
        dctx.fillStyle = 'rgba(20, 8, 16, 0.55)';
        dctx.beginPath();
        dctx.arc(x, y, Math.max(0.6, rad), 0, Math.PI * 2);
        dctx.fill();
      }
    }
  }
  ctx.drawImage(dot, 0, 0);

  // Sobel ink lines, drawn from the half-size edge map.
  const { edge, w: ew, h: eh } = sobelEdges(soft);
  const line = blankCanvas(w, h);
  const lctx = line.getContext('2d');
  lctx.fillStyle = 'rgba(24, 10, 18, 0.85)';
  const sx = w / ew;
  const sy = h / eh;
  for (let y = 0; y < eh; y++) {
    for (let x = 0; x < ew; x++) {
      if (edge[y * ew + x] > 0.32) {
        lctx.fillRect(x * sx, y * sy, Math.max(1, sx * 0.5), Math.max(1, sy * 0.5));
      }
    }
  }
  ctx.drawImage(line, 0, 0);

  // Vignette: darken the corners.
  const vg = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(10,4,10,0.22)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);

  if (strength >= 1) return soft;
  const out = blankCanvas(w, h);
  const octx = out.getContext('2d');
  octx.drawImage(source, 0, 0);
  octx.globalAlpha = strength;
  octx.drawImage(soft, 0, 0);
  octx.globalAlpha = 1;
  return out;
}
