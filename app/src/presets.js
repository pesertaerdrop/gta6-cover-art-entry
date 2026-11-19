// presets.js — four one-tap cover scenes.
//
// A preset sets layout, grade, ink and words in one tap. The photos
// stay whatever the cover already has, so a preset never throws away
// a hand-set crop.

export const PRESETS = [
  {
    id: "sunset-heist",
    name: "Sunset Heist",
    cover: {
      layout: "heroThree", grade: "vice",
      inkOn: true, inkStrength: 0.7,
      title: "AFTERGLOW", subtitle: "one last sunset",
      tagline: "ONE NIGHT ON THE COAST",
    },
  },
  {
    id: "motor-mile",
    name: "Motor Mile",
    cover: {
      layout: "nine", grade: "vice",
      inkOn: true, inkStrength: 0.7,
      title: "MOTOR MILE", subtitle: "fast lane nights",
      tagline: "NINE FRAMES, ONE RIDE",
    },
  },
  {
    id: "night-market",
    name: "Night Market",
    cover: {
      layout: "stripFive", grade: "golden",
      inkOn: true, inkStrength: 0.6,
      title: "NIGHT MARKET", subtitle: "neon and noise",
      tagline: "FIVE CROPS, ONE SNAPSHOT",
    },
  },
  {
    id: "marina-lights",
    name: "Marina Lights",
    cover: {
      layout: "snapshots", grade: "neon",
      inkOn: true, inkStrength: 0.8,
      title: "MARINA LIGHTS", subtitle: "where the boats sleep",
      tagline: "THREE PRINTS, ONE HARBOUR",
    },
  },
];

export function presetById(id) {
  return PRESETS.find((p) => p.id === id) || PRESETS[0];
}
