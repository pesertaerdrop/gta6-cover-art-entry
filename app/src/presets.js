// House looks and the distinct-photo fill. Every preset names its layout,
// grade, words and photos in one place, so one tap rebuilds a whole cover.
// The fill rule is the point: no photo ever repeats inside one cover —
// each panel gets a different photo from the pool.

import { blankPanel } from './state.js';
import { smartFrame } from './cover.js';

export const SAMPLE_POOL = [
  { id: 'woman-convertible', label: 'Convertible', src: 'samples/woman-convertible.jpg' },
  { id: 'man-rooftop', label: 'Rooftop', src: 'samples/man-rooftop.jpg' },
  { id: 'friends-neon', label: 'Neon Night', src: 'samples/friends-neon.jpg' },
  { id: 'man-pier', label: 'Pier', src: 'samples/man-pier.jpg' },
  { id: 'woman-boardwalk', label: 'Boardwalk', src: 'samples/woman-boardwalk.jpg' },
  { id: 'man-motorcycle', label: 'Motorcycle', src: 'samples/man-motorcycle.jpg' },
  { id: 'speedboat', label: 'Speedboat', src: 'samples/speedboat.jpg' },
  { id: 'boulevard', label: 'Boulevard', src: 'samples/boulevard.jpg' },
  { id: 'pier', label: 'Pier Dusk', src: 'samples/pier.jpg' },
];

export const PRESETS = [
  {
    name: 'Sunset Heist',
    layoutId: 'hero-three',
    gradeId: 'vice-sunset',
    title: 'SUNSET HEIST',
    subtitle: 'one last job',
    badge: 'VICE CITY',
    photos: ['woman-convertible', 'man-rooftop', 'friends-neon', 'man-pier'],
  },
  {
    name: 'Neon Coast',
    layoutId: 'grid9',
    gradeId: 'neon-nights',
    title: 'NEON COAST',
    subtitle: 'Vice City nights',
    badge: 'EST. 2026',
    photos: ['woman-convertible', 'man-rooftop', 'friends-neon', 'man-pier', 'woman-boardwalk', 'man-motorcycle', 'speedboat', 'boulevard', 'pier'],
  },
  {
    name: 'Pier Pressure',
    layoutId: 'grid9',
    gradeId: 'golden-hour',
    title: 'PIER PRESSURE',
    subtitle: 'gone fishing',
    badge: 'EST. 2026',
    photos: ['man-pier', 'woman-convertible', 'man-rooftop', 'friends-neon', 'woman-boardwalk', 'man-motorcycle', 'speedboat', 'boulevard', 'pier'],
  },
  {
    name: 'Boulevard Queen',
    layoutId: 'full-bleed',
    gradeId: 'palm-dusk',
    title: 'BOULEVARD QUEEN',
    subtitle: 'queen of the strip',
    badge: 'VICE CITY',
    photos: ['woman-boardwalk'],
  },
  {
    name: 'Night Shift',
    layoutId: 'comic-strip',
    gradeId: 'noir-vice',
    title: 'NIGHT SHIFT',
    subtitle: 'the city never sleeps',
    badge: 'EST. 2026',
    photos: ['friends-neon', 'man-motorcycle', 'man-rooftop'],
  },
  {
    name: 'Aqua Run',
    layoutId: 'split-duo',
    gradeId: 'aqua-pop',
    title: 'AQUA RUN',
    subtitle: 'full throttle',
    badge: 'EST. 2026',
    photos: ['speedboat', 'man-pier'],
  },
];

export function presetByName(name) {
  return PRESETS.find((p) => p.name === name);
}

// Build a panel list for a layout from a photo list, topping up from the
// full pool so a 9-panel grid never repeats a photo: the pool holds 9
// distinct photos, exactly the grid's size.
export function panelsForPhotos(photoIds, panelCount, images, rects) {
  const pool = [...photoIds];
  for (const sample of SAMPLE_POOL) {
    if (pool.length >= panelCount) break;
    if (!pool.includes(sample.id)) pool.push(sample.id);
  }
  const panels = [];
  for (let i = 0; i < panelCount; i++) {
    const photoId = pool[i % pool.length];
    const panel = blankPanel(photoId);
    const img = images.get(photoId);
    const rect = rects?.[i];
    if (img && rect) {
      const frame = smartFrame(img, rect.w, rect.h);
      panel.panX = frame.panX;
      panel.panY = frame.panY;
      panel.zoom = frame.zoom;
    }
    panels.push(panel);
  }
  return panels;
}

// Fill every panel with a different photo, in pool order. When the pool is
// at least as large as the panel count, no photo repeats.
export function autoFillDistinct(state, panelCount, images, rects) {
  const ids = state.photos.map((p) => p.id);
  state.panels = panelsForPhotos(ids, panelCount, images, rects);
  state.selected = 0;
}

// Same as auto-fill, but the pool order is shuffled first, so the cover
// comes out different while still never repeating a photo.
export function shuffleDistinct(state, panelCount, images, rects) {
  const ids = state.photos.map((p) => p.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  state.panels = panelsForPhotos(ids, panelCount, images, rects);
  state.selected = 0;
}
