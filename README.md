# Afterglow Cover Studio

![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)
![rank](https://make.fun/badge/gta6-cover-art-01/pesertaerdrop/gta6-cover-art-entry/rank.svg)
![reward](https://make.fun/badge/gta6-cover-art-01/pesertaerdrop/gta6-cover-art-entry/reward.svg)

Turn any photo and caption into GTA 6-style cover art: multi-panel posters with bold lettering and a sunset or neon grade, exported as PNGs you can share. Built for the [make.fun GTA 6 cover art bounty](https://make.fun/bounty/gta6-cover-art-01) ([competition page](https://make.fun/c/gta6-cover-art-01)).

## How it works

Three steps, one PNG out:

1. **Add photos** — upload your own, or use the 14 image-model samples that ship with the app.
2. **Pick a layout** — seven layouts, six gradient-map grades, and Poster Ink on a strength dial.
3. **Export** — a single click writes all three post sizes: 1080×1080, 1080×1350 and 1920×1080.

Your photos never leave your machine. The app is plain static files, it runs offline, and it makes no network request at all.

## Inside the app

- **Poster Ink** — blur, posterize into bands that keep the hue, lift the darks, halftone dots in the shadows, Sobel ink lines, grain and vignette, all on a strength slider, beside a photoreal Raw Stock grade.
- **One-photo layouts** — Strip Five slices one photo into five independent crops; Tilted Snapshots tosses three polaroid prints across the cover.
- **Title block** — a skyline strip, a star pill, an EST. 2026 badge, a diagonal NOW SHOWING sash that sizes itself so its text always fits, and a starburst sticker. All of it is drawn in canvas code, under a gradient Anton title and a neon Kaushan Script subtitle with clear space above the tagline bar.
- **Editor** — drag a panel to reframe it, scroll to zoom, zoom and pan sliders, smart face framing, undo and redo across 50 steps, presets, auto-fill and shuffle. A crop you set by hand survives a layout change.

Anton, Kaushan Script and Bebas Neue are vendored under `app/fonts/` under the SIL Open Font License. The sample photos were made with an image model.

## Try it

```sh
node serve.ts   # http://localhost:8080
```

## Handing it in

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to `/output` and writes `/output/dossier.json` with `buildDossier` from `vendor/makefun-app.ts`.
