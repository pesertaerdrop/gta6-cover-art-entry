// tape.js — Sunset Tape, the signature look of Sunset Strip Studio.
//
// A VHS-era golden-hour treatment: the photo stays a photo, it just looks
// like it was shot on tape at sunset. The pipeline, in order:
//   1. chromatic aberration — the red channel drifts a few pixels left,
//      the blue a few right, the way cheap tape optics split the light
//   2. a warm sunset wash — magenta at the top melting into gold at the
//      bottom, laid over the picture at low strength
//   3. scanlines — faint dark lines every third row, the CRT texture
//   4. seeded grain — the same speckles every render, so the build stays
//      byte-identical run to run (determinism is a gate, not a nicety)
//   5. a vignette — the corners fall off into dusk
// No posterize bands, no halftone dots, no edge detection: this is a
// different effect from first principles, built for this app alone.

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

// Run Sunset Tape over a canvas and return a new canvas. `strength` 0..1
// blends the taped result over the input; 0 leaves the photo alone.
// `seed` fixes the grain, so the same panel renders the same pixels
// every time it is drawn.
export function applyTape(source, strength = 0.7, seed = 1337) {
  if (strength <= 0) return source;
  const w = source.width;
  const h = source.height;
  const sctx = source.getContext('2d');
  const img = sctx.getImageData(0, 0, w, h);
  const px = img.data;
  const out = new Uint8ClampedArray(px.length);

  // 1. Chromatic aberration: red from a few pixels left, blue from a few
  // right, green straight. The shift grows with strength, 1..3 px.
  const k = 1 + Math.round(strength * 2);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const xl = Math.max(0, x - k);
      const xr = Math.min(w - 1, x + k);
      const il = (y * w + xl) * 4;
      const ir = (y * w + xr) * 4;
      out[i] = px[il]; // red, shifted left
      out[i + 1] = px[i + 1]; // green, straight
      out[i + 2] = px[ir + 2]; // blue, shifted right
      out[i + 3] = px[i + 3];
    }
  }

  // 4 (order swapped for the pixel pass). Seeded grain, ±6/255, and a
  // whisper of lift in the shadows so the tape never crushes to black.
  const rnd = seededRandom(seed);
  for (let i = 0; i < out.length; i += 4) {
    const grain = (rnd() - 0.5) * 12 * strength;
    const lum = (0.2126 * out[i] + 0.7152 * out[i + 1] + 0.0722 * out[i + 2]) / 255;
    const lift = lum < 0.35 ? (0.35 - lum) * 18 * strength : 0;
    out[i] = Math.min(255, Math.max(0, out[i] + grain + lift));
    out[i + 1] = Math.min(255, Math.max(0, out[i + 1] + grain + lift));
    out[i + 2] = Math.min(255, Math.max(0, out[i + 2] + grain + lift));
  }

  const taped = blankCanvas(w, h);
  const tctx = taped.getContext('2d');
  tctx.putImageData(new ImageData(out, w, h), 0, 0);

  // 2. Warm sunset wash: magenta up top, gold down low, laid over the
  // picture so the whole panel leans into dusk.
  const wash = tctx.createLinearGradient(0, 0, 0, h);
  wash.addColorStop(0, `rgba(255, 64, 140, ${0.10 * strength})`);
  wash.addColorStop(0.55, `rgba(255, 120, 60, ${0.06 * strength})`);
  wash.addColorStop(1, `rgba(255, 190, 60, ${0.12 * strength})`);
  tctx.fillStyle = wash;
  tctx.fillRect(0, 0, w, h);

  // 3. Scanlines: a dark hairline every third row.
  tctx.fillStyle = `rgba(10, 4, 12, ${0.07 * strength})`;
  for (let y = 2; y < h; y += 3) tctx.fillRect(0, y, w, 1);

  // 5. Vignette: the corners fall off into dusk.
  const vg = tctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.45,
    w / 2, h / 2, Math.max(w, h) * 0.78,
  );
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, `rgba(12, 4, 14, ${0.24 * strength})`);
  tctx.fillStyle = vg;
  tctx.fillRect(0, 0, w, h);

  if (strength >= 1) return taped;
  const done = blankCanvas(w, h);
  const dctx = done.getContext('2d');
  dctx.drawImage(source, 0, 0);
  dctx.globalAlpha = strength;
  dctx.drawImage(taped, 0, 0);
  dctx.globalAlpha = 1;
  return done;
}
