// grades.js — six gradient-map grades for Afterglow Cover Studio.
//
// A grade is a 256-step lookup table built from colour stops over
// luminance. It is applied after an auto-levels stretch (1st–99th
// percentile), so even a dark night photo uses the whole ramp. Raw
// Stock is the photoreal grade: no colour map, just the levels
// stretch and a whisper of warmth.

export const GRADES = [
  { id: "vice", name: "Vice Sunset", mix: 0.85 },
  { id: "neon", name: "Neon Nights", mix: 0.85 },
  { id: "golden", name: "Golden Hour", mix: 0.8 },
  { id: "aqua", name: "Aqua Pop", mix: 0.8 },
  { id: "noir", name: "Noir Vice", mix: 0.9 },
  { id: "raw", name: "Raw Stock", mix: 0 },
];

// gold -> orange -> hot pink, deep warm black at the foot
// magenta -> violet-pink -> pale pink, kept off the UI chrome
// honey -> amber -> cream
// deep teal -> aqua -> foam white
// warm black-and-white
// identity ramp (Raw Stock maps luminance to itself)
const STOPS = {
  vice: [[16, 6, 10], [92, 32, 22], [196, 96, 30], [255, 176, 64], [255, 224, 148]],
  neon: [[12, 6, 18], [88, 18, 66], [178, 44, 110], [238, 96, 150], [255, 190, 220]],
  golden: [[18, 10, 6], [96, 52, 14], [198, 128, 34], [252, 196, 88], [255, 238, 180]],
  aqua: [[8, 18, 22], [24, 78, 88], [44, 150, 150], [120, 210, 196], [220, 250, 240]],
  noir: [[10, 8, 8], [70, 64, 60], [140, 134, 128], [205, 200, 194], [250, 246, 240]],
  raw: [[0, 0, 0], [64, 64, 64], [128, 128, 128], [192, 192, 192], [255, 255, 255]],
};

export function gradeById(gradeId) {
  return GRADES.find((g) => g.id === gradeId) || GRADES[0];
}

// Interpolate one stop list at t in 0..1.
function rampAt(stops, t) {
  const pos = t * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(pos));
  const f = pos - i;
  const [r0, g0, b0] = stops[i];
  const [r1, g1, b1] = stops[i + 1];
  return [
    Math.round(r0 + (r1 - r0) * f),
    Math.round(g0 + (g1 - g0) * f),
    Math.round(b0 + (b1 - b0) * f),
  ];
}

// Build the 256-entry ramp for one grade id.
export function buildGradeLUT(gradeId) {
  const stops = STOPS[gradeId] || STOPS.vice;
  const lut = new Uint8Array(256 * 3);
  for (let i = 0; i < 256; i++) {
    const [r, g, b] = rampAt(stops, i / 255);
    lut[i * 3] = r;
    lut[i * 3 + 1] = g;
    lut[i * 3 + 2] = b;
  }
  return lut;
}

const lutCache = {};
export function gradeLUT(gradeId) {
  if (!lutCache[gradeId]) lutCache[gradeId] = buildGradeLUT(gradeId);
  return lutCache[gradeId];
}

function luminance(r, g, b) {
  return (r * 299 + g * 587 + b * 114) >> 10;
}

// Auto-levels: the 1st and 99th percentile of luminance, so the ramp
// is used end to end even on dark night photos.
export function luminanceRange(data) {
  const hist = new Uint32Array(256);
  for (let i = 0; i < data.length; i += 4) {
    hist[luminance(data[i], data[i + 1], data[i + 2])]++;
  }
  const total = data.length / 4;
  const cut = total * 0.01;
  let lo = 0;
  let acc = 0;
  while (lo < 255 && acc < cut) acc += hist[lo++];
  let hi = 255;
  acc = 0;
  while (hi > 0 && acc < cut) acc += hist[hi--];
  if (hi - lo < 24) {
    lo = Math.max(0, lo - 12);
    hi = Math.min(255, hi + 12);
  }
  return { lo, hi };
}

function stretch(l, lo, span) {
  const v = ((l - lo) * 255) / span;
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

// Map the art canvas through a grade in place. `mix` blends the ramp
// colour back toward the photo's own hue so faces keep their skin.
export function gradeCanvas(ctx, w, h, gradeId) {
  const grade = gradeById(gradeId);
  if (grade.mix === 0) return; // Raw Stock: levels only, handled below
  const img = ctx.getImageData(0, 0, w, h);
  const data = img.data;
  const { lo, hi } = luminanceRange(data);
  const span = Math.max(1, hi - lo);
  const lut = gradeLUT(gradeId);
  const mix = grade.mix;
  const inv = 1 - mix;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const li = (stretch(luminance(r, g, b), lo, span) | 0) * 3;
    data[i] = lut[li] * mix + r * inv;
    data[i + 1] = lut[li + 1] * mix + g * inv;
    data[i + 2] = lut[li + 2] * mix + b * inv;
  }
  ctx.putImageData(img, 0, 0);
}

// Raw Stock: levels stretch plus a whisper of warmth, no colour map.
export function levelsCanvas(ctx, w, h) {
  const img = ctx.getImageData(0, 0, w, h);
  const data = img.data;
  const { lo, hi } = luminanceRange(data);
  const span = Math.max(1, hi - lo);
  for (let i = 0; i < data.length; i += 4) {
    const l = stretch(luminance(data[i], data[i + 1], data[i + 2]), lo, span);
    const f = l / 255;
    const warm = 1 + (f - 0.5) * 0.06;
    data[i] = Math.min(255, data[i] * warm);
    data[i + 2] = Math.min(255, data[i + 2] * (2 - warm));
  }
  ctx.putImageData(img, 0, 0);
}
