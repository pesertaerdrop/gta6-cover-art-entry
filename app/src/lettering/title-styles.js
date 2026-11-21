// The six title styles plus Auto. A style is a chrome gradient ramp (a
// list of [offset, colour] stops), a stroke colour and a glow colour.
// Auto picks the style that matches the cover's grade, so a sunset cover
// gets dusk chrome and a neon cover gets glacier neon without the user
// having to choose.
export const TITLE_STYLES = [
  {
    id: 'dusk-chrome', label: 'Dusk Chrome',
    stops: [[0, '#1a0b2e'], [0.3, '#ff6b35'], [0.5, '#ffd166'], [0.7, '#fff8e7'], [1, '#ff9e5e']],
    stroke: '#1a0b2e', shadow: 'rgba(255,107,53,0.55)',
  },
  {
    id: 'glacier-neon', label: 'Glacier Neon',
    stops: [[0, '#04122e'], [0.3, '#2f7fe0'], [0.5, '#7fe7ff'], [0.7, '#e8fbff'], [1, '#4fc3f7']],
    stroke: '#04122e', shadow: 'rgba(127,231,255,0.6)',
  },
  {
    id: 'brass-gold', label: 'Brass Gold',
    stops: [[0, '#3d2408'], [0.3, '#b8860b'], [0.5, '#ffd700'], [0.7, '#fff8dc'], [1, '#daa520']],
    stroke: '#3d2408', shadow: 'rgba(255,215,0,0.5)',
  },
  {
    id: 'magma-edge', label: 'Magma Edge',
    stops: [[0, '#2b0505'], [0.3, '#e5381a'], [0.5, '#ff7a3d'], [0.7, '#ffe08a'], [1, '#ff3d00']],
    stroke: '#2b0505', shadow: 'rgba(255,61,0,0.55)',
  },
  {
    id: 'steel-chrome', label: 'Steel Chrome',
    stops: [[0, '#0f1c22'], [0.3, '#5a7d8a'], [0.5, '#bfe3ec'], [0.7, '#ffffff'], [1, '#7fb3c8']],
    stroke: '#0f1c22', shadow: 'rgba(191,227,236,0.55)',
  },
  {
    id: 'pink-neon', label: 'Pink Neon',
    stops: [[0, '#2e0a2e'], [0.3, '#e040fb'], [0.5, '#ff7ae0'], [0.7, '#ffd6f5'], [1, '#ff4fd8']],
    stroke: '#2e0a2e', shadow: 'rgba(255,79,216,0.6)',
  },
];

// The style each grade maps to when the title style is Auto.
const AUTO_STYLE_BY_GRADE = {
  sunset: 'dusk-chrome',
  'neon-night': 'glacier-neon',
  'golden-hour': 'brass-gold',
  'tropic-teal': 'steel-chrome',
  'ember-blaze': 'magma-edge',
  'rose-dusk': 'pink-neon',
};

export { AUTO_STYLE_BY_GRADE };

export function styleById(id) {
  return TITLE_STYLES.find((s) => s.id === id) || TITLE_STYLES[0];
}

export function resolveTitleStyle(titleStyle, grade) {
  if (titleStyle && titleStyle !== 'auto') return styleById(titleStyle);
  return styleById(AUTO_STYLE_BY_GRADE[grade] || 'dusk-chrome');
}

// Build the vertical chrome gradient for a style over a rectangle.
export function gradientFor(ctx, style, rect) {
  const gradient = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  for (const [offset, color] of style.stops) gradient.addColorStop(offset, color);
  return gradient;
}

// The CSS gradient for a style's "Aa" chip in the title picker.
export function titleStyleCss(id) {
  const style = styleById(id);
  const stops = style.stops.map(([offset, color]) => `${color} ${Math.round(offset * 100)}%`).join(', ');
  return `linear-gradient(180deg, ${stops})`;
}
