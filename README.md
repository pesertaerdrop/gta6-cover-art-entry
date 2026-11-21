# Saltline Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/pesertaerdrop/gta6-cover-art-entry/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/pesertaerdrop/gta6-cover-art-entry/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Turn any photo and a caption into GTA-style cover art: a multi-panel poster
with bold chrome lettering, a Vice City sunset or neon grade, and a full
poster finish — callout tags, a seal, a volume tag, a five-star review bar,
a billing block, a generated barcode, and a coming-soon line. Part of the
[make.fun GTA 6 cover art bounty](https://make.fun/bounty/gta6-cover-art-01). The giant
chrome title sits in its own title field along the foot of the cover — a
designed gradient with a palm, grid or skyline motif — so it reads at any
size, no panel ever runs under a letter, and no face is ever covered.
Exports PNGs in 1080×1080, 1080×1350, and 1920×1080, all offline in the
browser. Your photos never leave the machine.

## How it works

1. **Add photos** — tap one of the 17 sample photos, drop your own in, or
   paste from the clipboard. One invented cast — Mira and Suki, a Vice City
   duo — recurs across the covers, so the callout tags tell one story.
2. **Caption** — title, script line, tagline ribbon, review quote and
   outlet, billing block, volume tag. All editable.
3. **Export PNG** — tick the sizes, hit Export all three.

## The systems

- **7 layouts** (Hero Mosaic, Diagonal Trio, Hero Plus Three, Filmstrip,
  Six Grid, Postcards, Seven Mosaic), drawn as live mini-tiles; changing
  size re-matches photos so every panel stays filled.
- **6 grades** (Sunset, Neon Night, Golden Hour, Tropic Teal, Ember Blaze,
  Rose Dusk) as gradient-map LUTs with swatch chips.
- **6 title styles plus Auto** (match grade), giant chrome title in its own
  title field, neon script overlapping the caps, gold tagline ribbon.
- **7 look sliders** — Paint, Grade, Halftone, Grain, Glow, Title size,
  Title lift — with draft-mode regrading while dragging.
- **Panel inspector** — 88×88 thumbnail, zoom slider 100–400%, Photo
  prev/next, Reset / Flip / Swap / Face-mark, callout tag field; numbered
  badges on panels, selected panel outlined with crosshair and zoom badge.
- **Editor flow** — clickable 3-step header, Auto layout, Surprise me,
  help dialog with the full shortcut list, undo/redo, per-size export
  checkboxes, status line.
- **Keyboard** — Tab/1–7 select, arrows pan, +/− zoom, [ ] photo, F flip,
  R reset, M mark face, A auto layout, S surprise, E export.

## Run it

```sh
node dev-server.ts
# open http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Licenses

- Code: MIT (see LICENSE).
- Fonts (under `app/fonts/`): SIL Open Font License 1.1 — Anton,
  Archivo Black, Oswald, Mr Dafoe, Fascinate Inline. See `OFL.txt`.
- Sample photos: made with an image model for this entry; the cast is
  invented, no real people.

No game-studio logo, artwork, or font is used anywhere in this entry.
