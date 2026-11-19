# Neon Coast Cover Studio

[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/pesertaerdrop/gta6-cover-art-entry/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/pesertaerdrop/gta6-cover-art-entry/reward.svg)](https://make.fun/c/gta6-cover-art-01)

An offline web app that turns any photo and a caption into GTA 6-style cover art — the multi-panel Vice City poster look with bold sunset lettering — and exports it as a PNG to share. Built for the [Make GTA 6 Cover Art](https://make.fun/c/gta6-cover-art-01) competition on make.fun.

## What it does

- **7 layouts**: nine-panel grid, hero-and-three, full bleed, tilted snapshot, split duo, comic strip, portrait trio.
- **6 colour grades**: gradient-map washes (Vice Sunset, Neon Nights, Golden Hour, Aqua Pop, Noir Vice, Palm Dusk) plus grain and vignette.
- **Lettering**: Anton display type with a sunset-gradient title block, Pacifico script subtitle, and a gold badge ribbon — all fonts vendored under the SIL Open Font License.
- **Any photo**: upload your own photos or use the 9 bundled samples (7 made with an image model for this entry, 2 from the competition kit). Crop and position each panel by dragging, zoom and pan with sliders or the scroll wheel, fill several panels with one photo or several — auto-fill never repeats a photo inside one cover.
- **Fast and easy**: pick a preset, tweak the words, and export all three post sizes (1080×1080, 1080×1350, 1920×1080) in one tap. Undo and redo cover every change.
- **Offline**: static files under `app/`, no network request, photos never leave the machine.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
node <kit>/cli/makefun.mjs check --kit <kit> --repo .
```

## Credits

- Display type: [Anton](https://github.com/google/fonts/tree/main/ofl/anton) (SIL OFL 1.1).
- Script type: [Pacifico](https://github.com/google/fonts/tree/main/ofl/pacifico) (SIL OFL 1.1).
- Sample photos: 7 made with an image model for this entry; 2 (`boulevard`, `pier`) from the competition kit, made for make.fun and free to use. No real person, no Rockstar artwork, no Rockstar fonts.

Licensed under the MIT License — see [LICENSE](LICENSE).
