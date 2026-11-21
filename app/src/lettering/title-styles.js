// The six title styles. A style is a vertical chrome ramp (three stops),
// a dark edge drawn around the letters, a glow colour for the halo behind
// the title, and the face colour used for the title chips in the editor.
// The title is drawn with the Anton face at a size the look sliders scale.
const STYLE_DEFS = {
  ember: { label: 'Ember Chrome', stops: ['#fff3d6', '#ff9a2e', '#ff5c1a'], edge: '#3a0d02', glow: 'rgba(255, 110, 20, 0.55)' },
  ice: { label: 'Ice Chrome', stops: ['#eaf9ff', '#6ec6ff', '#2f7fe0'], edge: '#06182e', glow: 'rgba(80, 180, 255, 0.55)' },
  magma: { label: 'Magma Chrome', stops: ['#ffe9c4', '#ff8a3c', '#d62f16'], edge: '#330a04', glow: 'rgba(255, 80, 30, 0.5)' },
  gold: { label: 'Solid Gold', stops: ['#ffe9a8', '#f7c948', '#c98f12'], edge: '#2e1c02', glow: 'rgba(247, 201, 72, 0.45)' },
  neon: { label: 'Neon Outline', stops: ['#d8fff4', '#4ef0c0', '#0f8f6e'], edge: '#04241c', glow: 'rgba(78, 240, 192, 0.6)' },
  rose: { label: 'Rose Chrome', stops: ['#fff0f6', '#ff8fc0', '#e0408a'], edge: '#33061e', glow: 'rgba(255, 90, 160, 0.5)' },
};

export const TITLE_STYLE_ORDER = ['ember', 'ice', 'magma', 'gold', 'neon', 'rose'];

export const TITLE_STYLES = TITLE_STYLE_ORDER.map((id) => ({
  id,
  label: STYLE_DEFS[id].label,
  top: STYLE_DEFS[id].stops[0],
  mid: STYLE_DEFS[id].stops[1],
  bottom: STYLE_DEFS[id].stops[2],
  edge: STYLE_DEFS[id].edge,
  glow: STYLE_DEFS[id].glow,
}));

// Which style 'auto' picks for each grade, so the title always matches
// the photo grade without the user thinking about it.
export const AUTO_STYLE_BY_GRADE = {
  sunset: 'ember',
  'neon-night': 'ice',
  'golden-hour': 'gold',
  'tropic-teal': 'neon',
  'ember-blaze': 'magma',
  'rose-dusk': 'rose',
};

export function styleById(id) {
  return TITLE_STYLES.find((s) => s.id === id) || TITLE_STYLES[0];
}

export function resolveTitleStyle(titleStyle, grade) {
  if (titleStyle && titleStyle !== 'auto') return styleById(titleStyle);
  return styleById(AUTO_STYLE_BY_GRADE[grade] || 'ember');
}

// A vertical gradient across a title rect, light at the top, saturated in
// the middle, deep at the bottom: the chrome look.
export function gradientFor(ctx, style, rect) {
  const g = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  g.addColorStop(0, style.top);
  g.addColorStop(0.45, style.mid);
  g.addColorStop(1, style.bottom);
  return g;
}

// The CSS gradient for a title style's chip in the editor picker.
export function titleStyleCss(id) {
  const s = styleById(id);
  return `linear-gradient(180deg, ${s.top}, ${s.mid} 45%, ${s.bottom})`;
}
