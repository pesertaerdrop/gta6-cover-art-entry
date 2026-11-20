# Afterglow Cover Studio

![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)
![rank](https://make.fun/badge/gta6-cover-art-01/pesertaerdrop/gta6-cover-art-entry/rank.svg)
![reward](https://make.fun/badge/gta6-cover-art-01/pesertaerdrop/gta6-cover-art-entry/reward.svg)

An offline web app that turns a photo and a caption into a sunset cover — a multi-panel poster with bold lettering and a warm sunset grade, exported as a PNG in square, portrait and wide.

Built for the [gta6-cover-art-01 bounty on make.fun](https://make.fun/bounty/gta6-cover-art-01).

## How to use

1. Open `app/index.html` in desktop Chrome. Nothing leaves your machine — no network, no upload, no account.
2. **Add photos** — pick one of the 14 samples, or add your own. Drag a sample onto a panel to swap it in.
3. **Pick a layout** — eight layouts, from the Poster Grid (hero duo + seven action panels) to Strip Five, which slices one photo into five crops.
4. **Export** — write your title, pick a grade, hit EXPORT PNG. One button writes all three sizes at their exact dimensions: 1080×1080, 1080×1350, 1920×1080.

## What makes it different

- **Poster Ink** — posterised colour, halftone dots in the shadows, ink lines along the edges. The photos print like a poster, and the cover stays legible at 300 px. Toggle it, or dial its strength.
- **Faces stay whole in Strip Five** — the dividers never cross a face, and each face-bearing strip is wide enough that its narrowest window still shows the whole face with air around it. Drag a slice's focus and the window still clamps onto the face span. When a photo's faces cannot all fit that way, the editor says so instead of claiming a guarantee it did not keep.
- **Six grades** — Vice Sunset, Neon Nights, Golden Hour, Aqua Pop, Noir Vice, and Raw Stock, which leaves the photos as shot.
- **Title band extras** — a skyline strip, a HEAT star pill, an EST. 2026 badge, a legible NOW SHOWING ribbon, and a FRESH INK starburst.
- **A real editor** — per-panel drag reframe and zoom, crops kept per photo when the layout changes, 50-step undo/redo, shuffle, auto-fill, and four one-click presets.

## The photos

All 14 samples are image-model originals made for this entry: an invented duo (a woman with long braids in a teal jacket, a bearded man in a grey beanie and grey tee) and the city around them. No photo shows a real person, and no logo, wordmark or console mark appears anywhere in the app. The fonts (Anton, Bebas Neue, Kaushan Script) are OFL files under `app/fonts`.

## Build

```sh
node main.ts   # copies app/ + screenshots/ to out/ and writes out/dossier.json
```
