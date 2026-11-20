// presets.js — four one-click covers. A preset is a layout, a grade,
// an ink setting, and copy that fits the art. Applying one re-assigns
// the photos for its layout; the undo history still records it like
// any other change, so a preset is never a trap.

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

// Copy a preset's fields onto a state. The caller re-assigns the
// photos afterwards, because the layout change needs the library.
export function applyPreset(state, presetId) {
  const p = presetById(presetId);
  state.title = p.title;
  state.subtitle = p.subtitle;
  state.tagline = p.tagline;
  state.grade = p.grade;
  state.ink = { ...p.ink };
  state.layout = p.layout;
  return p;
}
