// Colour grades. Each grade is a luminance ramp: a photo's brightness is
// remapped through the stops, so the same photo reads as a Vice City sunset,
// a neon night, or a faded noir print. Ramps stay inside one warm hue family
// per grade; no violet, no blue-purple wash.

export const GRADES = [
  {
    id: 'vice-sunset',
    name: 'Vice Sunset',
    blurb: 'Orange dusk, warm cream highlights',
    swatch: '#ff7a1a',
    stops: [[0, 26, 9, 16], [0.35, 122, 48, 22], [0.65, 232, 100, 31], [1, 255, 233, 176]],
  },
  {
    id: 'neon-nights',
    name: 'Neon Nights',
    blurb: 'Hot pink neon over near-black',
    swatch: '#ff2e88',
    stops: [[0, 16, 8, 18], [0.35, 96, 14, 58], [0.65, 255, 46, 136], [1, 255, 243, 214]],
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    blurb: 'Low amber sun, honeyed shadows',
    swatch: '#f5a623',
    stops: [[0, 36, 21, 5], [0.4, 122, 74, 18], [0.7, 245, 166, 35], [1, 255, 246, 216]],
  },
  {
    id: 'aqua-pop',
    name: 'Aqua Pop',
    blurb: 'Turquoise water, bright and clean',
    swatch: '#17b6a4',
    stops: [[0, 6, 42, 42], [0.4, 12, 122, 112], [0.7, 23, 182, 164], [1, 234, 255, 248]],
  },
  {
    id: 'noir-vice',
    name: 'Noir Vice',
    blurb: 'Faded warm grey, print-noir',
    swatch: '#8a8378',
    stops: [[0, 13, 13, 13], [0.4, 96, 90, 82], [0.7, 178, 170, 156], [1, 242, 237, 226]],
  },
  {
    id: 'palm-dusk',
    name: 'Palm Dusk',
    blurb: 'Rose dusk, soft amber light',
    swatch: '#c2457a',
    stops: [[0, 28, 10, 30], [0.4, 120, 42, 84], [0.7, 194, 69, 122], [1, 255, 217, 160]],
  },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) ?? GRADES[0];
}

// Build a 256-entry lookup table from a grade's stops. Each entry is the
// output colour for one input luminance, so grading a panel is one pass
// over its pixels with no per-pixel maths.
export function buildGradeLUT(grade) {
  const lut = new Uint8ClampedArray(256 * 3);
  const stops = grade.stops;
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let a = stops[0];
    let b = stops[stops.length - 1];
    for (let s = 0; s < stops.length - 1; s++) {
      if (t >= stops[s][0] && t <= stops[s + 1][0]) { a = stops[s]; b = stops[s + 1]; break; }
    }
    const span = b[0] - a[0] || 1;
    const f = Math.min(1, Math.max(0, (t - a[0]) / span));
    lut[i * 3] = Math.round(a[1] + (b[1] - a[1]) * f);
    lut[i * 3 + 1] = Math.round(a[2] + (b[2] - a[2]) * f);
    lut[i * 3 + 2] = Math.round(a[3] + (b[3] - a[3]) * f);
  }
  return lut;
}

// Grade an offscreen canvas in place: read its pixels, remap luminance
// through the table, write them back. Luminance uses the standard
// rec.601 weights, so skin tones keep their shape under the ramp.
export function gradeCanvasInPlace(canvas, lut) {
  const ctx = canvas.getContext('2d');
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    data[i] = lut[lum * 3];
    data[i + 1] = lut[lum * 3 + 1];
    data[i + 2] = lut[lum * 3 + 2];
  }
  ctx.putImageData(image, 0, 0);
}
