// photos.js — the photo library for Afterglow Cover Studio.
//
// The 14 sample photos are image-model originals made for this entry:
// an invented duo (a woman with long braids in a teal jacket, a bearded
// man in a grey beanie and grey tee) and the city around them. No photo
// shows a real person, and no photo carries a logo, wordmark or console
// mark. Uploads come from the user's own machine and stay there — they
// are object URLs, never uploaded anywhere.
//
// Every sample carries `faces`: the horizontal span of each prominent
// face, ear to ear, in photo fractions, measured by eye from the photo
// itself at full size, with zoomed crops for the small ones. A face box
// holds the whole head at face height — eyes, nose, mouth, chin, ears,
// hairline — not just the skin. Strip Five reads these boxes (see
// faces.js) and places its dividers so no divider ever crosses a face
// and, where the photo allows it, each face-bearing strip is wide
// enough to show its face whole. Photos whose people are tiny or
// distant list no faces: at that size a divider crossing a figure is
// invisible, and a box there would be guessing.

export const SAMPLE_PHOTOS = [
  { id: 'police-chase', file: 'samples/police-chase.jpg', label: 'Police chase', faces: [] },
  { id: 'airboat-gator', file: 'samples/airboat-gator.jpg', label: 'Airboat + gator', faces: [] },
  {
    id: 'boat-party',
    file: 'samples/boat-party.jpg',
    label: 'Boat party',
    // Four friends laughing on the deck, left to right: the woman in
    // black, the man in the tan cap, the woman with the cocktail, the
    // curly-haired man with the raised fist.
    faces: [
      [0.15, 0.23],
      [0.37, 0.44],
      [0.54, 0.62],
      [0.74, 0.82],
    ],
  },
  {
    id: 'hero-duo',
    file: 'samples/hero-duo.jpg',
    label: 'Hero duo',
    // The cover's lead pair, facing the camera against the sunset
    // skyline. Her left ear (hoop earring) starts at 0.288 and her jaw
    // ends at 0.489; his beard starts at 0.503 and the right edge of his
    // head ends at 0.71. The two faces nearly touch, so their blocked
    // zones merge into one — the whole-face search gives one wide
    // middle strip holding both faces, plus thin sky slivers at the
    // edges. The guarantee still holds; it is checked numerically in
    // the build verification.
    faces: [
      [0.288, 0.489],
      [0.503, 0.71],
    ],
  },
  {
    id: 'convertible-duo',
    file: 'samples/convertible-duo.jpg',
    label: 'Convertible duo',
    // The same pair in profile in the purple convertible, facing right.
    // Hers is narrow — a profile face: her ear sits at 0.355, her nose
    // tip at 0.415. His beard runs 0.53 to 0.64, ear under the beanie to
    // nose tip. Measured from zoomed crops, twice, after the first
    // full-photo read put both faces too far right.
    faces: [
      [0.355, 0.415],
      [0.53, 0.64],
    ],
  },
  { id: 'yacht-blimp', file: 'samples/yacht-blimp.jpg', label: 'Yacht + blimp', faces: [] },
  { id: 'dirtbike-jump', file: 'samples/dirtbike-jump.jpg', label: 'Dirt-bike jump', faces: [] },
  { id: 'drawbridge-boat', file: 'samples/drawbridge-boat.jpg', label: 'Drawbridge', faces: [] },
  {
    id: 'dj-neon',
    file: 'samples/dj-neon.jpg',
    label: 'Neon DJ',
    // One face, purple hair included at face height: the hair mass
    // starts at 0.24 and the last wisp ends at 0.43.
    faces: [[0.24, 0.43]],
  },
  {
    id: 'skater-boy',
    file: 'samples/skater-boy.jpg',
    label: 'Skate park',
    // Small face under the cap, braids flying; the box covers the face
    // itself, ear to nose tip.
    faces: [[0.5, 0.55]],
  },
  {
    id: 'chef-grill',
    file: 'samples/chef-grill.jpg',
    label: 'Street grill',
    // Five faces: the chef in profile at the grill, then the four
    // friends laughing behind him, left to right.
    faces: [
      [0.3, 0.45],
      [0.48, 0.55],
      [0.6, 0.67],
      [0.75, 0.82],
      [0.9, 0.96],
    ],
  },
  {
    id: 'cowboy-gas',
    file: 'samples/cowboy-gas.jpg',
    label: 'Desert gas stop',
    // Profile face under the hat brim: ear at 0.32, nose tip at 0.39.
    faces: [[0.32, 0.39]],
  },
  {
    id: 'sax-corner',
    file: 'samples/sax-corner.jpg',
    label: 'Sax at midnight',
    // Profile face, eyes closed at the mouthpiece: nose tip at 0.59,
    // earring at 0.74.
    faces: [[0.59, 0.74]],
  },
  { id: 'surfer-dawn', file: 'samples/surfer-dawn.jpg', label: 'Surfer at dawn', faces: [] },
];

// Load one image; resolves with the HTMLImageElement.
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`cannot load ${src}`));
    img.src = src;
  });
}

// Load every sample photo, in SAMPLE_PHOTOS order. Each record is
// { id, label, src, img, uploaded: false, faces }. A sample that fails
// to load is skipped — the tray just shows fewer photos, the editor
// never blocks on one bad file.
export async function loadSamples() {
  const out = [];
  for (const s of SAMPLE_PHOTOS) {
    try {
      const img = await loadImage(s.file);
      out.push({ id: s.id, label: s.label, src: s.file, img, uploaded: false, faces: s.faces });
    } catch {
      // Skip, never fatal.
    }
  }
  return out;
}

// Turn user-chosen files into photo records with the same shape as the
// samples, backed by object URLs. Uploads carry no face data, so Strip
// Five falls back to equal dividers for them.
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

// Finish loading an uploaded photo's image, in place.
export async function hydrateUpload(photo) {
  if (photo.img) return photo;
  photo.img = await loadImage(photo.src);
  return photo;
}
