// title-styles.js — the six title styles plus Auto. A style is a chrome
// gradient ramp, a stroke, and a shadow colour. Auto picks the style that
// matches the current grade. The title is drawn huge (about two thirds of
// the cover width) in Anton or Archivo Black, with the neon script overlapping
// its lower edge and a tagline ribbon underneath.
export const TITLE_STYLES = [
  {
    id: 'sunset-chrome',
    name: 'Sunset Chrome',
    blurb: 'Gold to ember, warm edge',
    font: 'Anton',
    stops: [[0, '#ffe9a8'], [0.45, '#f7b733'], [0.7, '#e8531f'], [1, '#7a1e05']],
    stroke: '#3d0f02',
    shadow: '#ff7a3d',
  },
  {
    id: 'ice-neon',
    name: 'Ice Neon',
    blurb: 'Pale cyan to white',
    font: 'Archivo Black',
    stops: [[0, '#eafcff'], [0.5, '#7fe3f0'], [1, '#1d7fa8']],
    stroke: '#062a38',
    shadow: '#54d8e8',
  },
  {
    id: 'gold-rush',
    name: 'Gold Rush',
    blurb: 'Brass, honey, cream',
    font: 'Anton',
    stops: [[0, '#fff3c4'], [0.4, '#e8a317'], [0.75, '#a86e00'], [1, '#5c3a00']],
    stroke: '#2e1d00',
    shadow: '#ffd34d',
  },
  {
    id: 'heat-blade',
    name: 'Heat Blade',
    blurb: 'White-hot core, red edge',
    font: 'Archivo Black',
    stops: [[0, '#ffffff'], [0.35, '#ffd0a8'], [0.7, '#f05a28'], [1, '#8f0f0f']],
    stroke: '#3d0505',
    shadow: '#ff5a2a',
  },
  {
    id: 'ultra-chrome',
    name: 'Ultra Chrome',
    blurb: 'Silver bands, dark cuts',
    font: 'Anton',
    stops: [[0, '#ffffff'], [0.3, '#c9d2d8'], [0.55, '#5f6d75'], [0.8, '#e8eef1'], [1, '#3a454c']],
    stroke: '#14181b',
    shadow: '#9fb3bd',
  },
  {
    id: 'neon-sign',
    name: 'Neon Sign',
    blurb: 'Hot pink to warm coral',
    font: 'Fascinate Inline',
    stops: [[0, '#ffe3f0'], [0.5, '#e84a7a'], [1, '#8f1d4a']],
    stroke: '#2e0518',
    shadow: '#ff5fa2',
  },
];

export const AUTO_STYLE_BY_GRADE = {
  sunset: 'sunset-chrome',
  'neon-night': 'ice-neon',
  'golden-hour': 'gold-rush',
  'tropic-teal': 'ultra-chrome',
  heatwave: 'heat-blade',
  'rose-dusk': 'neon-sign',
};

export function titleStyleById(id) {
  return TITLE_STYLES.find((style) => style.id === id) ?? TITLE_STYLES[0];
}

export function resolveTitleStyle(doc) {
  if (doc.titleStyle && doc.titleStyle !== 'auto') return titleStyleById(doc.titleStyle);
  return titleStyleById(AUTO_STYLE_BY_GRADE[doc.grade] ?? 'sunset-chrome');
}

export function titleStyleCss(style) {
  const stops = style.stops.map(([at, color]) => `${color} ${Math.round(at * 100)}%`).join(', ');
  return `linear-gradient(180deg, ${stops})`;
}

export function wrapTitleLines(title, maxChars) {
  const words = title.trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 2);
}
