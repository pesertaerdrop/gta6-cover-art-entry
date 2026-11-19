// presets.js — one-tap cover presets: a title, subtitle, tagline, layout
// and grade that belong together, so a new cover is one click away.
// Applying a preset never touches the photos or their crops.

export const PRESETS = [
  {
    id: 'afterglow',
    name: 'Afterglow',
    title: 'AFTERGLOW',
    subtitle: 'one last sunset',
    tagline: 'EIGHT SCENES, ONE CITY',
    layout: 'poster',
    grade: 'sunset',
    inkStrength: 0.8,
  },
  {
    id: 'nightmarket',
    name: 'Night Market',
    title: 'NIGHT MARKET',
    subtitle: 'neon and noise',
    tagline: 'FIVE CROPS, ONE SNAPSHOT',
    layout: 'strip',
    grade: 'neon',
    inkStrength: 0.85,
  },
  {
    id: 'motormile',
    name: 'Motor Mile',
    title: 'MOTOR MILE',
    subtitle: 'fast lane nights',
    tagline: 'NINE FRAMES, ONE RIDE',
    layout: 'nine',
    grade: 'neon',
    inkStrength: 0.8,
  },
  {
    id: 'goldenhour',
    name: 'Golden Hour',
    title: 'GOLDEN HOUR',
    subtitle: 'chasing the light',
    tagline: 'ONE PHOTO, FIVE SHOTS',
    layout: 'strip',
    grade: 'golden',
    inkStrength: 0.7,
  },
  {
    id: 'highway',
    name: 'Highway Riders',
    title: 'HIGHWAY',
    subtitle: 'riders at dusk',
    tagline: 'TWO BIKES, ONE ROAD',
    layout: 'duo',
    grade: 'golden',
    inkStrength: 0.75,
  },
  {
    id: 'snapshots',
    name: 'Snapshots',
    title: 'SUMMER 2026',
    subtitle: 'prints from the coast',
    tagline: 'THREE PRINTS, ONE DAY',
    layout: 'tilted',
    grade: 'sunset',
    inkStrength: 0.8,
  },
];

export function presetById(id) {
  return PRESETS.find((p) => p.id === id) || PRESETS[0];
}

// Apply a preset's words, layout and grade to a state (photos untouched).
export function applyPreset(state, preset) {
  state.title = preset.title;
  state.subtitle = preset.subtitle;
  state.tagline = preset.tagline;
  state.layout = preset.layout;
  state.grade = preset.grade;
  state.ink.strength = preset.inkStrength;
}
