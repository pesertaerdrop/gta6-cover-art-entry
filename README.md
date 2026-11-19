# Afterglow Cover Studio

![GTA 6 cover art](https://make.fun/badge/gta6-cover-art-01.svg)
![Rank](https://make.fun/badge/gta6-cover-art-01/pesertaerdrop/gta6-cover-art-entry/rank.svg)
![Reward](https://make.fun/badge/gta6-cover-art-01/pesertaerdrop/gta6-cover-art-entry/reward.svg)

An entry for the [GTA 6 cover art bounty](https://make.fun/bounty/gta6-cover-art-01) on [make.fun](https://make.fun/c/gta6-cover-art-01): an offline web app that turns any photo into a bold multi-panel poster cover — sunset grade, Poster Ink, big gradient lettering — and exports it as a PNG in square 1080&times;1080, portrait 1080&times;1350 and wide 1920&times;1080.

## How it works

1. **Add photos** — use the 14 included samples or upload your own. Samples are image-model photos made for this studio; uploads never leave your machine.
2. **Pick a layout** — eight layouts, led by **Poster Grid**: one large central hero panel (an original duo portrait against a sunset skyline) ringed by seven action panels — police chase, airboat and alligator, boat party, convertible duo, yacht under a blimp, dirt-bike jump, drawbridge and speedboat. Also: nine-panel grid, hero and three, full bleed, tilted snapshots, Strip Five, split duo and comic strip.
3. **Export** — one big EXPORT PNG button downloads all three sizes at once.

## What is inside

- **Poster Ink** (written from scratch): posterized ink bands, halftone dots in the shadows, Sobel ink edges, seeded grain and a vignette — with a strength slider and an off switch for the Raw Stock photoreal grade.
- **Six grades**: Vice Sunset, Neon Nights, Golden Hour, Aqua Pop, Noir Vice, Raw Stock.
- **Face-aware Strip Five**: the five strips of one photo are cut where the faces aren't. Each sample photo carries the horizontal span of its faces, and the divider positions are computed from that data — every face falls wholly inside one strip, with a margin around it, and each strip focuses on its face. Pick any photo from the tray and the dividers move with it. Uploads have no face data and fall back to equal strips.
- **Title-block furniture**: skyline strip, gradient Anton title, Kaushan Script subtitle in its own clear zone, HEAT star pill, EST. 2026 badge, FRESH INK starburst and a legible NOW SHOWING diagonal ribbon.
- **Editor craft**: drag-to-reframe with per-photo crops that survive layout changes, smart face framing (upper third by default), 50-step undo/redo, editable title/subtitle/tagline, one-tap presets, shuffle.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Build the submission bundle:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Credits

- All 14 sample photos were made with an image model for this entry — no photo of a real person, no existing game's artwork, logo or wordmark anywhere.
- Fonts: Anton, Bebas Neue and Kaushan Script, all under the SIL Open Font License (see `app/fonts/OFL.txt`).
- License: MIT.
