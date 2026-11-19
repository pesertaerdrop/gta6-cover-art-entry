// photos.js — the photo library: the 14 image-model sample photos, plus
// uploads from the user's own machine. Every photo is an object with a
// stable id, a label for the tray, and a loaded Image. Nothing here is a
// photo of a real person: all 14 samples were made with an image model
// for this entry, and uploads stay on the machine (object URLs only).
//
// Each sample also carries `faces`: the horizontal span of each prominent
// face, in photo fractions, measured by eye from the photo itself — ear
// to ear, so the whole face (eyes, nose, mouth, chin, ears, hairline)
// is inside the box, not just the skin. Strip Five reads this data (see
// faces.js) and places its dividers so no divider ever crosses a face
// and each face-bearing strip is wide enough to show its face whole.
// Photos whose people are tiny or distant list no faces: at that size a
// divider crossing a figure is invisible, and claiming a box would be
// guessing.

export const SAMPLE_PHOTOS = [
  { id: 'police-chase', file: 'samples/police-chase.jpg', label: 'Police chase', faces: [] },
  { id: 'airboat-gator', file: 'samples/airboat-gator.jpg', label: 'Airboat + gator', faces: [] },
  {
    id: 'boat-party',
    file: 'samples/boat-party.jpg',
    label: 'Boat party',
    // Six faces across the deck, left to right: the dancer in pink, the
    // curly-haired man, the laughing woman behind, the blonde in
    // sunglasses, the man in the white cap, the woman at the stern.
    faces: [
      [0.29, 0.38],
      [0.47, 0.54],
      [0.55, 0.61],
      [0.6, 0.67],
      [0.7, 0.76],
      [0.79, 0.86],
    ],
  },
  {
    id: 'hero-duo',
    file: 'samples/hero-duo.jpg',
    label: 'Hero duo',
    // The cover's lead pair, re-measured twice from the photo at full
    // size, including a second pass after the first render: her left
    // ear (hoop earring) starts at 0.215 — the outer helix, not the
    // cheek — and her jawline ends at 0.46; his beard starts at 0.54
    // and the rightmost edge of his head (beard, with the small ear
    // tucked under the beanie at ~0.75) ends at 0.78. The v7 boxes
    // ([0.27, 0.46] and [0.55, 0.76]) missed both outer ears, which is
    // why the v7 strips cut them. These boxes hold the whole head at
    // face height, ear to ear, with a little air to spare.
    faces: [
      [0.215, 0.46],
      [0.54, 0.78],
    ],
  },
  {
    id: 'convertible-duo',
    file: 'samples/convertible-duo.jpg',
    label: 'Convertible duo',
    // Two faces nearly touching: hers 0.33–0.49, his 0.50–0.63. The
    // margin merges them into one blocked zone, so the dividers go
    // around the pair instead of between them.
    faces: [
      [0.33, 0.49],
      [0.5, 0.63],
    ],
  },
  { id: 'yacht-blimp', file: 'samples/yacht-blimp.jpg', label: 'Yacht + blimp', faces: [] },
  { id: 'dirtbike-jump', file: 'samples/dirtbike-jump.jpg', label: 'Dirt-bike jump', faces: [] },
  { id: 'drawbridge-boat', file: 'samples/drawbridge-boat.jpg', label: 'Drawbridge', faces: [] },
  {
    id: 'dj-neon',
    file: 'samples/dj-neon.jpg',
    label: 'Neon DJ',
    // One face, purple hair included at face height.
    faces: [[0.38, 0.6]],
  },
  {
    id: 'skater-boy',
    file: 'samples/skater-boy.jpg',
    label: 'Skate park',
    // Small face, cap and braids flying; the box covers the face itself.
    faces: [[0.42, 0.52]],
  },
  {
    id: 'chef-grill',
    file: 'samples/chef-grill.jpg',
    label: 'Street grill',
    faces: [[0.38, 0.52]],
  },
  {
    id: 'cowboy-gas',
    file: 'samples/cowboy-gas.jpg',
    label: 'Desert gas stop',
    // Profile face under the hat brim.
    faces: [[0.42, 0.53]],
  },
  {
    id: 'sax-corner',
    file: 'samples/sax-corner.jpg',
    label: 'Sax at midnight',
    faces: [[0.43, 0.57]],
  },
  {
    id: 'surfer-dawn',
    file: 'samples/surfer-dawn.jpg',
    label: 'Surfer at dawn',
    // Profile face, blond hair to the left of it.
    faces: [[0.45, 0.56]],
  },
];

// Load one image from a URL; resolves with the HTMLImageElement.
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`cannot load ${src}`));
    img.src = src;
  });
}

// Load every sample photo. Returns an array of photo records
// { id, label, src, img, uploaded: false, faces } in SAMPLE_PHOTOS
// order. A sample that fails to load is skipped, never fatal.
export async function loadSamples() {
  const out = [];
  for (const s of SAMPLE_PHOTOS) {
    try {
      const img = await loadImage(s.file);
      out.push({ id: s.id, label: s.label, src: s.file, img, uploaded: false, faces: s.faces });
    } catch {
      // A missing sample never blocks the editor; the tray just shows fewer.
    }
  }
  return out;
}

// Turn user-chosen File objects into photo records with the same shape
// as samples, backed by object URLs (the bytes never leave the machine).
// Uploads carry no face data, so Strip Five falls back to equal
// dividers for them.
export function filesToPhotos(files) {
  const out = [];
  for (const f of files) {
    if (!f.type.startsWith('image/')) continue;
    const url = URL.createObjectURL(f);
    const label = f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').slice(0, 24) || 'Your photo';
    out.push({ id: `up-${Date.now()}-${out.length}`, label, src: url, img: null, uploaded: true, faces: [], file: f });
  }
  return out;
}

// Finish loading the image of an uploaded photo record, in place.
export async function hydrateUpload(photo) {
  if (photo.img) return photo;
  photo.img = await loadImage(photo.src);
  return photo;
}
