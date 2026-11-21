// The six title styles.
//
// A title style is a chrome gradient: three stops from top to bottom,
// an outline colour, and a glow. The title is drawn with the gradient
// as its fill, a thick outline in the outline colour, and a soft glow
// behind it. "Auto" picks the style that belongs to the cover's grade.
const STYLE_DEFS = [
  { id: 'ember', label: 'Ember', top: '#ffd97a', mid: '#ff8a2a', bottom: '#e8531f', outline: '#7a1e00', glow: 'rgba(232, 83, 31, 0.55)' },
  { id: 'ice', label: 'Ice', top: '#ffffff', mid: '#bfe6ff', bottom: '#5aa8e8', outline: '#123a5c', glow: 'rgba(90, 168, 232, 0.5)' },
  { id: 'magma', label: 'Magma', top: '#ffe9a8', mid: '#ff5a3c', bottom: '#8a1030', outline: '#3d0512', glow: 'rgba(255, 90, 60, 0.5)' },
  { id: 'gold', label: 'Gold', top: '#fff3b0', mid: '#f5c542', bottom: '#b97e10', outline: '#4a3200', glow: 'rgba(245, 197, 66, 0.5)' },
  { id: 'neon', label: 'Neon', top: '#d8fff4', mid: '#3ef2c0', bottom: '#0f7a6e', outline: '#04332c', glow: 'rgba(62, 242, 192, 0.5)' },
  { id: 'rose', label: 'Rose', top: '#ffe3f0', mid: '#ff7ab8', bottom: '#c22a72', outline: '#4d0a2c', glow: 'rgba(255, 122, 184, 0.5)' },
];

export const TITLE_STYLE_ORDER = STYLE_DEFS.map((style) => style.id);

export const TITLE_STYLES = STYLE_DEFS.map((style) => ({
  id: style.id,
  label: style.label,
  top: style.top,
  mid: style.mid,
  bottom: style.bottom,
  outline: style.outline,
  glow: style.glow,
}));

// Which style "auto" means for each grade.
export const AUTO_STYLE_BY_GRADE = {
  sunset: 'ember',
  'neon-night': 'ice',
  'golden-hour': 'gold',
  'tropic-teal': 'neon',
  'ember-blaze': 'magma',
  'rose-dusk': 'rose',
};

export function styleById(id) {
  return TITLE_STYLES.find((style) => style.id === id) || TITLE_STYLES[0];
}

export function resolveTitleStyle(titleStyle, grade) {
  if (!titleStyle || titleStyle === 'auto') {
    return styleById(AUTO_STYLE_BY_GRADE[grade] || 'ember');
  }
  return styleById(titleStyle);
}

// A vertical gradient for a title, running the style's three stops
// down the rectangle the title sits in.
export function gradientFor(ctx, style, rect) {
  const gradient = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  gradient.addColorStop(0, style.top);
  gradient.addColorStop(0.55, style.mid);
  gradient.addColorStop(1, style.bottom);
  return gradient;
}

// The CSS gradient for a title style's chip in the editor.
export function titleStyleCss(id) {
  const style = styleById(id);
  return `linear-gradient(180deg, ${style.top}, ${style.mid} 55%, ${style.bottom})`;
}
