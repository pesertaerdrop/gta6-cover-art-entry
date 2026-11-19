# Neon Coast Cover Studio

[![Make GTA 6 Cover Art](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/pesertaerdrop/gta6-cover-art-entry/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/pesertaerdrop/gta6-cover-art-entry/reward.svg)](https://make.fun/c/gta6-cover-art-01)

An offline web app that turns any photo and a caption into GTA-style cover
art — the multi-panel poster look with bold lettering and a Vice City sunset
or neon grade — and exports it as a PNG to share. Made for the
[Make GTA 6 Cover Art](https://make.fun/c/gta6-cover-art-01) competition on
[make.fun](https://make.fun).

## What it does

- **7 layouts** — Nine-Panel Grid, Hero and Three, Full Bleed, Tilted
  Snapshots, Split Duo, Comic Strip, and Portrait Trio.
- **6 colour grades** — Vice Sunset, Neon Nights, Golden Hour, Aqua Pop,
  Noir Vice, and Palm Dusk, each a gradient-map wash over your photos.
- **Any photo** — upload your own, or use the bundled samples. Click a
  panel to select it, drag on the preview to reframe the photo, and tune
  zoom and position per panel. Several panels can hold several photos.
- **Lettering** — a halftone title block with a gradient Anton title, a
  Pacifico script subtitle, and a gold badge ribbon. Title, subtitle and
  badge text are all editable.
- **Fast and easy** — presets, auto-fill and shuffle get you from a photo
  to a PNG in a few clicks, with undo and redo throughout.
- **Export** — PNG in all three post sizes: 1080 × 1080, 1080 × 1350 and
  1920 × 1080, one at a time or all three at once.

Everything runs offline in the browser from static files. Photos are read
on your own machine and never uploaded anywhere.

## Run it

```sh
node serve.ts
```

Then open <http://localhost:8080> in desktop Chrome. No build step, no
network requests: every script, font and sample photo is a file under
`app/`.

## Fonts and photos

- Display type is **Anton** and script type is **Pacifico**, both under the
  SIL Open Font License (see `app/fonts/OFL.txt`).
- The four new sample photos were made with an image model for this entry;
  `boulevard.jpg` and `pier.jpg` are the kit starter's samples, free to use.
  No Rockstar Games logo, artwork, wordmark or font is used anywhere.

## Entry program

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/`
to `/output` and writes `dossier.json` with the kit's vendored
`vendor/makefun-app.ts`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```
