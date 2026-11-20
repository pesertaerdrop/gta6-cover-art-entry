// library.js — the sample library and presets of Sunset Strip Studio.
//
// Fourteen photos, all made with an image model for this entry (no real
// people), of a new cast on a Florida boulevard at golden hour: Maya
// (short black curls, yellow sundress) and Rico (fade haircut, open
// floral shirt), plus the street around them. Face boxes live in
// portraits.js, measured from the actual photos.

import { FACE_BOXES } from './portraits.js';

export const PHOTOS = [
  { id: 'hero-duo', src: 'samples/hero-duo.jpg', label: 'Boardwalk duo', faces: FACE_BOXES['hero-duo'] },
  { id: 'lowrider', src: 'samples/lowrider.jpg', label: 'Lowrider', faces: FACE_BOXES['lowrider'] },
  { id: 'roller-rink', src: 'samples/roller-rink.jpg', label: 'Roller rink', faces: FACE_BOXES['roller-rink'] },
  { id: 'bonfire', src: 'samples/bonfire.jpg', label: 'Bonfire', faces: FACE_BOXES['bonfire'] },
  { id: 'speedboat', src: 'samples/speedboat.jpg', label: 'Speedboat', faces: FACE_BOXES['speedboat'] },
  { id: 'deco-hotel', src: 'samples/deco-hotel.jpg', label: 'Deco hotels', faces: FACE_BOXES['deco-hotel'] },
  { id: 'ferris-wheel', src: 'samples/ferris-wheel.jpg', label: 'Ferris wheel', faces: FACE_BOXES['ferris-wheel'] },
  { id: 'taco-truck', src: 'samples/taco-truck.jpg', label: 'Taco truck', faces: FACE_BOXES['taco-truck'] },
  { id: 'convertible-night', src: 'samples/convertible-night.jpg', label: 'Convertible night', faces: FACE_BOXES['convertible-night'] },
  { id: 'lifeguard-tower', src: 'samples/lifeguard-tower.jpg', label: 'Lifeguard tower', faces: FACE_BOXES['lifeguard-tower'] },
  { id: 'rooftop-pool', src: 'samples/rooftop-pool.jpg', label: 'Rooftop pool', faces: FACE_BOXES['rooftop-pool'] },
  { id: 'motorcycle', src: 'samples/motorcycle.jpg', label: 'Motorcycle', faces: FACE_BOXES['motorcycle'] },
  { id: 'ice-cream', src: 'samples/ice-cream.jpg', label: 'Ice cream', faces: FACE_BOXES['ice-cream'] },
  { id: 'jet-ski', src: 'samples/jet-ski.jpg', label: 'Jet ski', faces: FACE_BOXES['jet-ski'] },
];

// Three one-tap starting points: layout + grade + tape + caption +
// a photo for every panel slot, in slot order.
export const PRESETS = [
  {
    id: 'boardwalk-dusk', label: 'Boardwalk Dusk',
    layout: 'sun-disc', grade: 'golden', tape: { on: true, strength: 0.7 },
    title: 'SUNSET STRIP', subtitle: 'one last summer',
    tagline: 'EIGHT SCENES, ONE BOULEVARD',
    photos: ['hero-duo', 'lowrider', 'ferris-wheel', 'bonfire', 'speedboat', 'deco-hotel'],
  },
  {
    id: 'neon-nights', label: 'Neon Nights',
    layout: 'marquee', grade: 'neon', tape: { on: true, strength: 0.85 },
    title: 'NEON MILE', subtitle: 'after dark',
    tagline: 'PINK LIGHT, WET STREETS',
    photos: ['taco-truck', 'convertible-night', 'deco-hotel', 'lowrider'],
  },
  {
    id: 'golden-hour', label: 'Golden Hour',
    layout: 'filmstrip', grade: 'golden', tape: { on: true, strength: 0.5 },
    title: 'GOLDEN HOUR', subtitle: 'seven forty-seven',
    tagline: 'FOUR FRAMES OF DUSK',
    photos: ['jet-ski', 'lifeguard-tower', 'speedboat', 'ferris-wheel'],
  },
];

export function presetById(id) {
  return PRESETS.find((p) => p.id === id) || PRESETS[0];
}
