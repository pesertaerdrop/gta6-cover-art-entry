// The six colour grades. A grade re-tints a photo through a three-stop
// ramp: shadows land near the first stop, midtones near the second and
// highlights near the third. The ramp is applied as a 256-entry lookup
// table blended back toward the pixel's own brightness, so a grade never
// flattens a photo completely. Colours are hex strings on purpose: the
// editor builds its swatch chips from the same values the canvas uses.
const HEX = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

const GRADE_DEFS = {
  sunset: { label: 'Sunset', stops: ['#1a0c2a', '#da5c28', '#ffd682'] },
  'neon-night': { label: 'Neon Night', stops: ['#080a22', '#7a36ce', '#8ceeff'] },
  'golden-hour': { label: 'Golden Hour', stops: ['#26140a', '#ec942a', '#ffe8aa'] },
  'tropic-teal': { label: 'Tropic Teal', stops: ['#082022', '#269e98', '#beffdc'] },
  'ember-blaze': { label: 'Ember Blaze', stops: ['#340c0a', '#e85420', '#ffcd82'] },
  'rose-dusk': { label: 'Rose Dusk', stops: ['#280c22', '#d6468a', '#ffc4de'] },
};

export const GRADE_ORDER = ['sunset', 'neon-night', 'golden-hour', 'tropic-teal', 'ember-blaze', 'rose-dusk'];

export const GRADE_LIST = GRADE_ORDER.map((id) => ({
  id,
  label: GRADE_DEFS[id].label,
  shadow: HEX(GRADE_DEFS[id].stops[0]),
  mid: HEX(GRADE_DEFS[id].stops[1]),
  light: HEX(GRADE_DEFS[id].stops[2]),
}));

export function gradeById(id) {
  return GRADE_LIST.find((g) => g.id === id) || GRADE_LIST[0];
}

export function gradeName(id) {
  return gradeById(id).label;
}

// Blend two RGB triples and round the result.
function mix(a, b, t) {
  return [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)];
}

// Build the 256-entry lookup table for a grade at a strength (0-100).
// Each brightness level maps onto the ramp, then is blended back toward
// its own brightness as the strength falls below 100.
export function buildLut(grade, strength) {
  const lut = new Uint8Array(256 * 3);
  const amount = Math.max(0, Math.min(100, strength)) / 100;
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    const ramp = t < 0.5 ? mix(grade.shadow, grade.mid, t * 2) : mix(grade.mid, grade.light, (t - 0.5) * 2);
    lut[i * 3] = Math.round(i + (ramp[0] - i) * amount);
    lut[i * 3 + 1] = Math.round(i + (ramp[1] - i) * amount);
    lut[i * 3 + 2] = Math.round(i + (ramp[2] - i) * amount);
  }
  return lut;
}

export function gradeSwatches(id) {
  const g = gradeById(id);
  const hex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
  return [hex(g.shadow), hex(g.mid), hex(g.light)];
}

// The grades as an array, under the name the pickers and cover actions use.
export const GRADES = GRADE_LIST;

// The CSS gradient for a grade's swatch chip in the editor.
export function gradeRampCss(id) {
  const [shadow, mid, light] = gradeSwatches(id);
  return `linear-gradient(90deg, ${shadow}, ${mid}, ${light})`;
}
