# Afterglow Cover Studio

![make.fun bounty](https://make.fun/badge/gta6-cover-art-01.svg)
![make.fun rank](https://make.fun/badge/gta6-cover-art-01/pesertaerdrop/gta6-cover-art-entry/rank.svg)
![make.fun reward](https://make.fun/badge/gta6-cover-art-01/pesertaerdrop/gta6-cover-art-entry/reward.svg)

[Enter the GTA 6 cover art bounty on make.fun](https://make.fun/bounty/gta6-cover-art-01)

An offline web app that turns a photo and a caption into a GTA 6-style cover: a multi-panel poster with bold lettering and a Vice City sunset grade, exported as a PNG in square, portrait and wide.

## How it works

1. **Add photos** — pick one of the 14 image-model samples, or add your own. Everything stays on your machine.
2. **Pick a layout** — eight layouts, from the Poster Grid (hero duo + seven action panels) to Strip Five (one photo, five crops).
3. **Export** — write your title, pick a grade, hit the big pink EXPORT PNG button. Three sizes, exact dimensions.

## What makes it a cover, not a collage

- **Poster Ink** — the signature print effect: posterised colour, halftone dots in the shadows, ink lines along the edges. It keeps the cover legible at 300 px.
- **Whole faces, always** — Strip Five measures each face ear to ear and places its dividers so no strip edge ever crosses a face, and each face-bearing strip is wide enough to show its face whole — eyes, nose, mouth, chin, ears, hairline — at every export size, portrait included. Dragging a strip's focus point can't push a face out either: the window is clamped onto the face span at render time.
- **Six grades** — Vice Sunset, Neon Nights, Golden Hour, Aqua Pop, Noir Vice, and Raw Stock (no grade at all), plus a Poster Ink strength slider.
- **Title band extras** — a skyline strip, a HEAT star pill, an EST. 2026 badge, a legible NOW SHOWING diagonal ribbon, and a FRESH INK starburst sticker.
- **Real editing** — drag to reframe any panel, scroll to zoom, per-photo crops that survive a layout change, undo/redo (50 steps), shuffle, auto-fill, and four one-click presets.

## Run it

Open `app/index.html` in desktop Chrome. No server, no network, no account.

## Build

```sh
node main.ts
```

`main.ts` copies `app/` and `screenshots/` into the output directory and writes `dossier.json` via the kit's `buildDossier`.

## Original work

Everything in this entry is original: the title is AFTERGLOW, the fonts are OFL files under `app/fonts`, and the 14 sample photos are image-model originals of an invented duo. No logo, wordmark, artwork or font of any existing game appears anywhere.
