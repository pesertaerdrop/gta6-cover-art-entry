# Afterglow Cover Studio

![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)
![rank](https://make.fun/badge/gta6-cover-art-01/pesertaerdrop/gta6-cover-art-entry/rank.svg)
![reward](https://make.fun/badge/gta6-cover-art-01/pesertaerdrop/gta6-cover-art-entry/reward.svg)

Turn any photo and caption into GTA 6-style cover art — multi-panel posters with bold lettering and a sunset or neon grade — exported as PNGs to share. Built for the [make.fun GTA 6 cover art bounty](https://make.fun/bounty/gta6-cover-art-01) ([competition page](https://make.fun/c/gta6-cover-art-01)).

## Three steps, one PNG

1. **Add photos** — upload your own or load the 14 image-model samples.
2. **Pick a layout** — seven layouts, six gradient-map grades, Poster Ink with a strength dial.
3. **Export** — one click writes all three post sizes: 1080×1080, 1080×1350 and 1920×1080.

Your photos never leave your machine: the app is static files, works offline, and makes no network request.

## What is inside

- **Poster Ink** — blur, posterize into bands keeping hue, lift darks, halftone dots in shadows, Sobel ink lines, grain and vignette, with a strength slider and a photoreal Raw Stock grade beside it.
- **One-photo layouts** — Strip Five slices one photo into five independent crops; Tilted Snapshots tosses three polaroid prints on the cover.
- **Title block** — canvas-drawn skyline strip, star pill, EST. 2026 badge, corner ribbon and starburst sticker, under a gradient Anton title and a neon Kaushan Script subtitle.
- **Editor** — per-panel drag reframe and wheel zoom, zoom/pan sliders, smart face framing, undo/redo (50 steps), presets, auto-fill and shuffle. Hand-set crops survive layout changes.

Fonts (Anton, Kaushan Script, Bebas Neue) are vendored under `app/fonts/` under the SIL Open Font License. Sample photos were made with an image model.

## Try it

```sh
node serve.ts   # http://localhost:8080
```

## Handing it in

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to `/output` and writes `/output/dossier.json` with `buildDossier` from `vendor/makefun-app.ts`.
