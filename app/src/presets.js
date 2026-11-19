// presets.js — the four cover presets, one click each: a layout, a
// grade, an ink strength, and copy that fits the art.

export const PRESETS = [
  {
    id: 'afterglow',
    name: 'Afterglow',
    layout: 'poster',
    grade: 'sunset',
    ink: { on: true, strength: 0.8 },
    title: 'AFTERGLOW',
    subtitle: 'one last sunset',
    tagline: 'EIGHT SCENES, ONE CITY',
  },
  {
    id: 'nightmarket',
    name: 'Night Market',
    layout: 'strip',
    grade: 'neon',
    ink: { on: true, strength: 0.8 },
    title: 'NIGHT MARKET',
    subtitle: 'neon and noise',
    tagline: 'FIVE SLICES OF THE CITY',
  },
  {
    id: 'motormile',
    name: 'Motor Mile',
    layout: 'nine',
    grade: 'golden',
    ink: { on: true, strength: 0.8 },
    title: 'MOTOR MILE',
    subtitle: 'dust and chrome',
    tagline: 'NINE MOMENTS, ONE ROAD',
  },
  {
    id: 'paper',
    name: 'Paper Cut',
    layout: 'tilted',
    grade: 'raw',
    ink: { on: false, strength: 0 },
    title: 'PAPER CUT',
    subtitle: 'straight from the roll',
    tagline: 'NO FILTER, JUST FILM',
  },
];

export function presetById(id) {
  return PRESETS.find((p) => p.id === id) || PRESETS[0];
}

// Apply a preset to a state (the layout change re-assigns the photos).
export function applyPreset(state, presetId, photos) {
  const p = presetById(presetId);
  state.title = p.title;
  state.subtitle = p.subtitle;
  state.tagline = p.tagline;
  state.grade = p.grade;
  state.ink = { ...p.ink };
  state.layout = p.layout;
  return p;
}
