// Neon Coast Cover Studio — layouts, colour grades, export sizes and presets.
//
// A layout is a function of the cover size: it returns its panels as
// rectangles in pixels, each with an optional rotation in degrees (the
// tilted snapshot cards). A grade is the canvas filter plus the colour wash
// drawn over every photo, so one grade changes the whole poster's mood.

export const SIZES = [
  { id: '1080x1080', w: 1080, h: 1080, label: 'Square · 1080 × 1080' },
  { id: '1080x1350', w: 1080, h: 1350, label: 'Portrait · 1080 × 1350' },
  { id: '1920x1080', w: 1920, h: 1080, label: 'Wide · 1920 × 1080' },
];

export function sizeById(id) {
  return SIZES.find((s) => s.id === id) ?? SIZES[0];
}

// Split a span into n cells with a gutter between them.
function splitSpan(start, length, n, gutter) {
  const cell = (length - gutter * (n - 1)) / n;
  const cells = [];
  for (let i = 0; i < n; i += 1) cells.push(start + i * (cell + gutter));
  return cells.map((at) => ({ at, size: cell }));
}

// Most layouts sit above the title block, which takes the bottom fifth of
// the cover; full-bleed and tilted use the whole cover as a backdrop.
function contentHeight(h) {
  return h * 0.8;
}

export const LAYOUTS = {
  'grid9': {
    name: 'Nine-Panel Grid',
    blurb: 'The classic poster wall',
    slots(w, h) {
      const g = Math.round(Math.min(w, h) * 0.012);
      const ch = contentHeight(h);
      const xs = splitSpan(0, w, 3, g);
      const ys = splitSpan(0, ch, 3, g);
      const out = [];
      for (const y of ys) for (const x of xs) out.push({ x: x.at, y: y.at, w: x.size, h: y.size, rot: 0 });
      return out;
    },
  },
  'hero-three': {
    name: 'Hero and Three',
    blurb: 'One big moment, three more',
    slots(w, h) {
      const g = Math.round(Math.min(w, h) * 0.012);
      const ch = contentHeight(h);
      const heroW = Math.round(w * 0.64);
      const sideX = heroW + g;
      const ys = splitSpan(0, ch, 3, g);
      const out = [{ x: 0, y: 0, w: heroW, h: ch, rot: 0 }];
      for (const y of ys) out.push({ x: sideX, y: y.at, w: w - sideX, h: y.size, rot: 0 });
      return out;
    },
  },
  'fullbleed': {
    name: 'Full Bleed',
    blurb: 'One photo, edge to edge',
    slots(w, h) {
      return [{ x: 0, y: 0, w, h, rot: 0 }];
    },
  },
  'tilted': {
    name: 'Tilted Snapshots',
    blurb: 'Polaroids over a backdrop',
    slots(w, h) {
      const cardW = Math.round(w * 0.44);
      const cardH = Math.round(h * 0.52);
      return [
        { x: 0, y: 0, w, h, rot: 0 },
        { x: Math.round(w * 0.04), y: Math.round(h * 0.07), w: cardW, h: cardH, rot: -6 },
        { x: Math.round(w * 0.52), y: Math.round(h * 0.05), w: cardW, h: cardH, rot: 5 },
        { x: Math.round(w * 0.28), y: Math.round(h * 0.40), w: cardW, h: cardH, rot: -2 },
      ];
    },
  },
  'split-duo': {
    name: 'Split Duo',
    blurb: 'Two halves, one story',
    slots(w, h) {
      const g = Math.round(Math.min(w, h) * 0.012);
      const ch = contentHeight(h);
      const half = (w - g) / 2;
      return [
        { x: 0, y: 0, w: half, h: ch, rot: 0 },
        { x: half + g, y: 0, w: half, h: ch, rot: 0 },
      ];
    },
  },
  'comic-strip': {
    name: 'Comic Strip',
    blurb: 'Four beats across the top',
    slots(w, h) {
      const g = Math.round(Math.min(w, h) * 0.012);
      const stripH = Math.round(contentHeight(h) * 0.97);
      const xs = splitSpan(0, w, 4, g);
      return xs.map((x) => ({ x: x.at, y: 0, w: x.size, h: stripH, rot: 0 }));
    },
  },
  'portrait-trio': {
    name: 'Portrait Trio',
    blurb: 'Three tall frames',
    slots(w, h) {
      const g = Math.round(Math.min(w, h) * 0.012);
      const ch = contentHeight(h);
      const xs = splitSpan(0, w, 3, g);
      return xs.map((x) => ({ x: x.at, y: 0, w: x.size, h: ch, rot: 0 }));
    },
  },
};

export const GRADES = {
  'vice-sunset': {
    name: 'Vice Sunset',
    swatch: 'linear-gradient(135deg,#ffd319,#ff2975)',
    filter: 'saturate(1.35) contrast(1.08)',
    washTop: 'rgba(255, 120, 60, 0.16)',
    washBottom: 'rgba(190, 0, 120, 0.30)',
    titleFrom: '#ffd319',
    titleTo: '#ff2975',
  },
  'neon-nights': {
    name: 'Neon Nights',
    swatch: 'linear-gradient(135deg,#ff2e88,#00e5ff)',
    filter: 'saturate(1.5) contrast(1.15) brightness(0.95)',
    washTop: 'rgba(255, 46, 136, 0.20)',
    washBottom: 'rgba(0, 229, 255, 0.26)',
    titleFrom: '#00e5ff',
    titleTo: '#ff2e88',
  },
  'golden-hour': {
    name: 'Golden Hour',
    swatch: 'linear-gradient(135deg,#ffb347,#ff7b00)',
    filter: 'saturate(1.4) sepia(0.25) contrast(1.05)',
    washTop: 'rgba(255, 190, 80, 0.18)',
    washBottom: 'rgba(255, 110, 0, 0.28)',
    titleFrom: '#ffe259',
    titleTo: '#ff7b00',
  },
  'aqua-pop': {
    name: 'Aqua Pop',
    swatch: 'linear-gradient(135deg,#7ef9ff,#0066ff)',
    filter: 'saturate(1.6) contrast(1.1)',
    washTop: 'rgba(126, 249, 255, 0.16)',
    washBottom: 'rgba(0, 80, 255, 0.30)',
    titleFrom: '#7ef9ff',
    titleTo: '#0066ff',
  },
  'noir-vice': {
    name: 'Noir Vice',
    swatch: 'linear-gradient(135deg,#e8e8e8,#ff2e88)',
    filter: 'grayscale(0.85) contrast(1.25) brightness(1.03)',
    washTop: 'rgba(255, 255, 255, 0.06)',
    washBottom: 'rgba(255, 46, 136, 0.22)',
    titleFrom: '#ffffff',
    titleTo: '#ff2e88',
  },
  'palm-dusk': {
    name: 'Palm Dusk',
    swatch: 'linear-gradient(135deg,#b388ff,#4a00e0)',
    filter: 'saturate(1.25) contrast(1.08) brightness(0.97)',
    washTop: 'rgba(179, 136, 255, 0.18)',
    washBottom: 'rgba(74, 0, 224, 0.30)',
    titleFrom: '#d0a6ff',
    titleTo: '#7b2ff7',
  },
};

// The photos bundled with the app. All four new ones were made with an
// image model for this entry; boulevard and pier are the kit starter's own
// sample photos, free to use.
export const SAMPLES = [
  { id: 'woman-convertible', label: 'Convertible', src: 'samples/woman-convertible.jpg' },
  { id: 'man-rooftop', label: 'Rooftop', src: 'samples/man-rooftop.jpg' },
  { id: 'friends-neon', label: 'Neon Night', src: 'samples/friends-neon.jpg' },
  { id: 'man-pier', label: 'Pier', src: 'samples/man-pier.jpg' },
  { id: 'boulevard', label: 'Boulevard', src: 'samples/boulevard.jpg' },
  { id: 'pier', label: 'Pier Dusk', src: 'samples/pier.jpg' },
];

export const PRESETS = [
  {
    id: 'neon-coast',
    name: 'Neon Coast',
    layout: 'grid9',
    grade: 'neon-nights',
    title: 'NEON COAST',
    subtitle: 'Vice City nights',
    badge: 'EST. 2026',
  },
  {
    id: 'sunset-heist',
    name: 'Sunset Heist',
    layout: 'hero-three',
    grade: 'vice-sunset',
    title: 'SUNSET HEIST',
    subtitle: 'one last job',
    badge: 'VICE CITY',
  },
  {
    id: 'pier-pressure',
    name: 'Pier Pressure',
    layout: 'fullbleed',
    grade: 'golden-hour',
    title: 'PIER PRESSURE',
    subtitle: 'gone fishing',
    badge: 'EST. 2026',
  },
  {
    id: 'night-shift',
    name: 'Night Shift',
    layout: 'tilted',
    grade: 'neon-nights',
    title: 'NIGHT SHIFT',
    subtitle: 'neon never sleeps',
    badge: '24 / 7',
  },
];
