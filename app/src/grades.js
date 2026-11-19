// grades.js — the colour grades: six 256-step gradient-map ramps over
// luminance, applied after an auto-levels stretch. Each grade is a list of
// stops [position 0..1, [r, g, b]]; the ramp is sampled into a lookup
// table once and reused for every panel. Raw Stock is photoreal: it
// leaves the pixels alone. No grade uses a purple-to-blue ramp.

export const GRADES = [
  {
    id: 'sunset',
    name: 'Vice Sunset',
    blend: 0.72,
    stops: [
      [0.0, [26, 8, 24]],
      [0.25, [94, 32, 48]],
      [0.5, [198, 92, 52]],
      [0.75, [244, 172, 84]],
      [1.0, [255, 232, 176]],
    ],
  },
  {
    id: 'neon',
    name: 'Neon Nights',
    blend: 0.72,
    stops: [
      [0.0, [16, 6, 38]],
      [0.25, [74, 22, 92]],
      [0.5, [178, 52, 118]],
      [0.75, [248, 116, 120]],
      [1.0, [255, 214, 170]],
    ],
  },
  {
    id: 'golden',
    name: 'Golden Hour',
    blend: 0.68,
    stops: [
      [0.0, [30, 18, 8]],
      [0.25, [104, 62, 26]],
      [0.5, [206, 134, 58]],
      [0.75, [246, 196, 110]],
      [1.0, [255, 240, 200]],
    ],
  },
  {
    id: 'aqua',
    name: 'Aqua Pop',
    blend: 0.66,
    stops: [
      [0.0, [8, 34, 44]],
      [0.25, [22, 96, 110]],
      [0.5, [64, 168, 158]],
      [0.75, [150, 214, 176]],
      [1.0, [232, 246, 214]],
    ],
  },
  {
    id: 'noir',
    name: 'Noir Vice',
    blend: 0.78,
    stops: [
      [0.0, [10, 10, 12]],
      [0.25, [52, 44, 52]],
      [0.5, [128, 104, 104]],
      [0.75, [196, 172, 162]],
      [1.0, [244, 232, 224]],
    ],
  },
  { id: 'raw', name: 'Raw Stock', blend: 0, stops: null },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

// Sample a grade's ramp into a 256-entry RGB lookup table.
export function buildRamp(grade) {
  if (!grade.stops) return null;
  const ramp = new Uint8Array(256 * 3);
  const stops = grade.stops;
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let a = stops[0];
    let b = stops[stops.length - 1];
    for (let s = 0; s < stops.length - 1; s++) {
      if (t >= stops[s][0] && t <= stops[s + 1][0]) {
        a = stops[s];
        b = stops[s + 1];
        break;
      }
    }
    const span = b[0] - a[0] || 1;
    const f = Math.min(1, Math.max(0, (t - a[0]) / span));
    for (let c = 0; c < 3; c++) {
      ramp[i * 3 + c] = Math.round(a[1][c] + (b[1][c] - a[1][c]) * f);
    }
  }
  return ramp;
}

// Auto-levels: the 1st and 99th percentile luminance of an ImageData,
// so night shots use the whole ramp instead of sitting in the dark.
export function levelRange(data) {
  const hist = new Uint32Array(256);
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    const lum = Math.round(0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]);
    hist[lum]++;
  }
  const total = px.length / 4;
  let lo = 0;
  let acc = 0;
  while (lo < 255 && acc < total * 0.01) acc += hist[lo++];
  let hi = 255;
  acc = 0;
  while (hi > 0 && acc < total * 0.01) acc += hist[hi--];
  if (hi - lo < 24) {
    lo = Math.max(0, lo - 12);
    hi = Math.min(255, hi + 12);
  }
  return { lo, hi: Math.max(hi, lo + 1) };
}

// Grade an ImageData in place: stretch its luminance through the level
// range, map it through the ramp, and blend the ramp colour back over
// the original pixel. Raw Stock returns the data untouched.
export function applyGrade(data, grade) {
  if (!grade.stops) return data;
  const ramp = buildRamp(grade);
  const { lo, hi } = levelRange(data);
  const span = hi - lo;
  const blend = grade.blend;
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i];
    const g = px[i + 1];
    const b = px[i + 2];
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    let t = (lum - lo) / span;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const idx = Math.min(255, Math.round(t * 255)) * 3;
    const mix = 1 - blend;
    px[i] = Math.round(r * mix + ramp[idx] * blend);
    px[i + 1] = Math.round(g * mix + ramp[idx + 1] * blend);
    px[i + 2] = Math.round(b * mix + ramp[idx + 2] * blend);
  }
  return data;
}
