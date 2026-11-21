// The six colour grades.
//
// A grade is a gradient map: a shadow colour, a midtone colour and a
// highlight colour. A pixel's brightness picks where it falls between
// them, so one grade re-tints a whole photo while keeping its light
// and shadow. Each grade also carries its three swatch colours for the
// chips in the editor.
const GRADE_DEFS = [
  { id: 'sunset', label: 'Sunset', shadow: [26, 12, 42], mid: [218, 92, 40], light: [255, 214, 130] },
  { id: 'neon-night', label: 'Neon Night', shadow: [8, 10, 34], mid: [122, 54, 206], light: [140, 238, 255] },
  { id: 'golden-hour', label: 'Golden Hour', shadow: [38, 20, 10], mid: [236, 148, 42], light: [255, 232, 170] },
  { id: 'tropic-teal', label: 'Tropic Teal', shadow: [8, 32, 34], mid: [38, 158, 152], light: [190, 255, 220] },
  { id: 'ember-blaze', label: 'Ember Blaze', shadow: [52, 12, 10], mid: [232, 84, 32], light: [255, 205, 130] },
  { id: 'rose-dusk', label: 'Rose Dusk', shadow: [40, 12, 34], mid: [214, 70, 138], light: [255, 196, 222] },
];

export const GRADE_ORDER = GRADE_DEFS.map((grade) => grade.id);

export const GRADE_LIST = GRADE_DEFS.map((grade) => ({
  id: grade.id,
  label: grade.label,
  shadow: grade.shadow,
  mid: grade.mid,
  light: grade.light,
}));

export function gradeById(id) {
  return GRADE_LIST.find((grade) => grade.id === id) || GRADE_LIST[0];
}

export function gradeName(id) {
  return gradeById(id).label;
}

// Blend two colours by t.
function mix(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

// Build the 256-entry lookup table for a grade at a strength (0–100):
// each entry is the colour a pixel of that brightness maps to, blended
// back toward the pixel's own brightness as the strength falls.
export function buildLut(grade, strength) {
  const lut = new Uint8Array(256 * 3);
  const amount = Math.max(0, Math.min(100, strength)) / 100;
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    const target = t < 0.5 ? mix(grade.shadow, grade.mid, t * 2) : mix(grade.mid, grade.light, (t - 0.5) * 2);
    lut[i * 3] = Math.round(i + (target[0] - i) * amount);
    lut[i * 3 + 1] = Math.round(i + (target[1] - i) * amount);
    lut[i * 3 + 2] = Math.round(i + (target[2] - i) * amount);
  }
  return lut;
}

export function gradeSwatches(id) {
  const grade = gradeById(id);
  const hex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  return [hex(grade.shadow), hex(grade.mid), hex(grade.light)];
}

// The grades as an array, under the name the pickers and cover actions use.
export const GRADES = GRADE_LIST;

// The CSS gradient for a grade's swatch chip in the editor.
export function gradeRampCss(id) {
  const [shadow, mid, light] = gradeSwatches(id);
  return `linear-gradient(90deg, ${shadow}, ${mid}, ${light})`;
}
