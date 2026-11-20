// grade-presets.js — the six grades. Each grade is a gradient-map lookup
// table: a shadow colour, a midtone colour and a highlight colour. A pixel's
// luminance picks its colour on the ramp, so the grade tints the whole photo
// while keeping faces bright. Swatch chips in the editor draw the same ramp.
export const GRADES = [
  {
    id: 'sunset',
    name: 'Sunset',
    blurb: 'Warm gold hour',
    shadow: [38, 16, 34],
    mid: [214, 96, 44],
    light: [255, 226, 160],
  },
  {
    id: 'neon-night',
    name: 'Neon Night',
    blurb: 'Pink and teal after dark',
    shadow: [12, 18, 44],
    mid: [214, 62, 128],
    light: [150, 240, 235],
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    blurb: 'Honey light, soft shadows',
    shadow: [52, 34, 18],
    mid: [226, 158, 62],
    light: [255, 244, 200],
  },
  {
    id: 'tropic-teal',
    name: 'Tropic Teal',
    blurb: 'Turquoise water, lime sun',
    shadow: [8, 44, 48],
    mid: [32, 164, 150],
    light: [220, 250, 180],
  },
  {
    id: 'heatwave',
    name: 'Heatwave',
    blurb: 'Scorched orange, deep red',
    shadow: [46, 10, 8],
    mid: [226, 74, 28],
    light: [255, 200, 120],
  },
  {
    id: 'rose-dusk',
    name: 'Rose Dusk',
    blurb: 'Dusty rose, amber lamps',
    shadow: [40, 20, 36],
    mid: [200, 92, 96],
    light: [255, 214, 170],
  },
];

export function gradeById(id) {
  return GRADES.find((grade) => grade.id === id) ?? GRADES[0];
}

export function gradeRampCss(grade) {
  const [sr, sg, sb] = grade.shadow;
  const [mr, mg, mb] = grade.mid;
  const [lr, lg, lb] = grade.light;
  return `linear-gradient(90deg, rgb(${sr},${sg},${sb}), rgb(${mr},${mg},${mb}), rgb(${lr},${lg},${lb}))`;
}

export function buildGradeLut(grade, strength) {
  const lut = new Uint8ClampedArray(256 * 3);
  const mix = strength / 100;
  for (let i = 0; i < 256; i += 1) {
    const t = i / 255;
    const ramp = t < 0.5
      ? mixColor(grade.shadow, grade.mid, t * 2)
      : mixColor(grade.mid, grade.light, (t - 0.5) * 2);
    lut[i * 3] = Math.round(i * (1 - mix) + ramp[0] * mix);
    lut[i * 3 + 1] = Math.round(i * (1 - mix) + ramp[1] * mix);
    lut[i * 3 + 2] = Math.round(i * (1 - mix) + ramp[2] * mix);
  }
  return lut;
}

export function mixColor(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

export function gradeCssStops(grade) {
  return gradeRampCss(grade);
}
