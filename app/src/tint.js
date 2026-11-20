// tint.js — the grades of Sunset Strip Studio.
//
// Each grade is a small set of per-channel numbers — a gamma curve, a
// saturation pull, a tint multiply and a lift — applied to the photo's
// pixels before the Sunset Tape pass. Six grades, each a different time
// of day on the same boulevard. Raw Stock leaves the photo alone.

// lift: added to every channel (0..1). gamma: per-channel curve.
// sat: 0 is grey, 1 is the photo as shot, above 1 is punchier.
// tint: per-channel multiply. warm: extra gold in the highlights.
export const GRADES = [
  {
    id: 'golden', label: 'Golden Hour',
    lift: [0.01, 0.0, -0.02], gamma: [1.0, 0.95, 1.15], sat: 1.12,
    tint: [1.06, 0.99, 0.88], warm: 0.10,
  },
  {
    id: 'neon', label: 'Neon Nights',
    lift: [0.02, -0.01, 0.03], gamma: [0.95, 1.05, 0.9], sat: 1.28,
    tint: [1.1, 0.9, 1.12], warm: 0.0,
  },
  {
    id: 'palm', label: 'Palm Shade',
    lift: [0.0, 0.02, 0.01], gamma: [1.05, 0.95, 1.0], sat: 1.05,
    tint: [0.9, 1.06, 1.0], warm: 0.0,
  },
  {
    id: 'bubble', label: 'Bubblegum',
    lift: [0.03, 0.0, 0.02], gamma: [0.95, 1.1, 0.95], sat: 1.22,
    tint: [1.12, 0.92, 1.05], warm: 0.04,
  },
  {
    id: 'silver', label: 'Silver Screen',
    lift: [0.02, 0.02, 0.02], gamma: [1.0, 1.0, 1.0], sat: 0.18,
    tint: [1.02, 1.0, 0.96], warm: 0.06,
  },
  {
    id: 'raw', label: 'Raw Stock',
    lift: [0, 0, 0], gamma: [1, 1, 1], sat: 1,
    tint: [1, 1, 1], warm: 0,
  },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

// Apply a grade in place to an ImageData's pixels.
export function applyGrade(img, grade) {
  if (grade.id === 'raw') return;
  const px = img.data;
  const [gr, gg, gb] = grade.gamma;
  const [tr, tg, tb] = grade.tint;
  const [lr, lg, lb] = grade.lift;
  const sat = grade.sat;
  const warm = grade.warm;
  for (let i = 0; i < px.length; i += 4) {
    let r = px[i] / 255;
    let g = px[i + 1] / 255;
    let b = px[i + 2] / 255;
    // Gamma curve per channel.
    r = Math.pow(Math.max(0, r), gr);
    g = Math.pow(Math.max(0, g), gg);
    b = Math.pow(Math.max(0, b), gb);
    // Saturation: mix each channel toward the luminance.
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    r = lum + (r - lum) * sat;
    g = lum + (g - lum) * sat;
    b = lum + (b - lum) * sat;
    // Warm gold in the highlights.
    const hi = Math.max(0, lum - 0.55) * warm * 2;
    r += hi * 0.5;
    g += hi * 0.18;
    // Tint multiply + lift, then back to bytes.
    px[i] = Math.min(255, Math.max(0, (r * tr + lr) * 255));
    px[i + 1] = Math.min(255, Math.max(0, (g * tg + lg) * 255));
    px[i + 2] = Math.min(255, Math.max(0, (b * tb + lb) * 255));
  }
}
