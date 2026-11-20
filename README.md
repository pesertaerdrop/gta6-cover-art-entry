# Sunset Strip Studio

[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/pesertaerdrop/gta6-cover-art-entry/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/pesertaerdrop/gta6-cover-art-entry/reward.svg)](https://make.fun/c/gta6-cover-art-01)

Turn a photo and a caption into a sunset-strip cover — a 1980s Florida
boulevard poster, made offline in your browser. Part of the
[make.fun GTA 6 cover art bounty](https://make.fun/bounty/gta6-cover-art-01).

## Three steps, one PNG

1. **Add photos** — pick one of the 14 samples, or add your own. Photos
   never leave your machine; nothing is uploaded.
2. **Pick a layout** — seven ways to hang the photos: Sun Disc, Boulevard,
   Filmstrip, Postcards, Marquee, Horizon Split, Boardwalk.
3. **Export** — one big pink button writes the PNG in 1080×1080,
   1080×1350 and 1920×1080, all three at once.

## What it does

- **Sunset Tape** — the signature look: a VHS golden-hour treatment
  (channel drift, scanlines, warm wash, seeded grain) with a strength
  slider. Six grades beside it: Golden Hour, Neon Nights, Palm Shade,
  Bubblegum, Silver Screen, Raw Stock.
- **Any photo** — click a panel to select it, drag to reframe, scroll to
  zoom. Faces are measured from the photos, so a crop centres on the
  people, never cuts them. One photo can fill a whole cover; several
  photos fill the panels.
- **Lettering** — a big gradient title, a neon script subtitle, a
  perforated ticket-stub tagline, a sunset clock badge set to 7:47 PM,
  palm silhouettes and a sun disc. Title, subtitle and tagline are all
  editable.
- **Undo / redo**, three one-tap presets, auto-fill, shuffle, and a
  readiness line that says what is set before you export.

## The cast

Fourteen photos, all made with an image model for this entry (no real
people): Maya and Rico on a Florida boardwalk at golden hour, a purple
lowrider, a roller rink, a beach bonfire, a speedboat, deco hotels, a
ferris wheel, a taco truck, a convertible under neon, a lifeguard tower,
a rooftop pool, a motorcycle at dusk, an ice-cream parlor, jet skis.

## Run it

```sh
node dev-server.ts
# open http://127.0.0.1:8472/app/index.html
```

Everything is static files under `app/`; the app makes no network
request. Fonts (Bungee, Lilita One, Sacramento) are SIL Open Font
License files under `app/fonts/`. Nothing here is a game studio's
artwork, logo or font — the whole cover is original.

## Build

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `app/` and
`screenshots/` to the output directory and writes `dossier.json` with
the kit's `vendor/makefun-app.ts`.
