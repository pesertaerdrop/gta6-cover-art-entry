// photos.js — the photo library: the 14 image-model sample photos, plus
// uploads from the user's own machine. Every photo is an object with a
// stable id, a label for the tray, and a loaded Image. Nothing here is a
// photo of a real person: all 14 samples were made with an image model
// for this entry, and uploads stay on the machine (object URLs only).

export const SAMPLE_PHOTOS = [
  { id: 'police-chase', file: 'samples/police-chase.jpg', label: 'Police chase' },
  { id: 'airboat-gator', file: 'samples/airboat-gator.jpg', label: 'Airboat + gator' },
  { id: 'boat-party', file: 'samples/boat-party.jpg', label: 'Boat party' },
  { id: 'hero-duo', file: 'samples/hero-duo.jpg', label: 'Hero duo' },
  { id: 'convertible-duo', file: 'samples/convertible-duo.jpg', label: 'Convertible duo' },
  { id: 'yacht-blimp', file: 'samples/yacht-blimp.jpg', label: 'Yacht + blimp' },
  { id: 'dirtbike-jump', file: 'samples/dirtbike-jump.jpg', label: 'Dirt-bike jump' },
  { id: 'drawbridge-boat', file: 'samples/drawbridge-boat.jpg', label: 'Drawbridge' },
  { id: 'dj-neon', file: 'samples/dj-neon.jpg', label: 'Neon DJ' },
  { id: 'skater-boy', file: 'samples/skater-boy.jpg', label: 'Skate park' },
  { id: 'chef-grill', file: 'samples/chef-grill.jpg', label: 'Street grill' },
  { id: 'cowboy-gas', file: 'samples/cowboy-gas.jpg', label: 'Desert gas stop' },
  { id: 'sax-corner', file: 'samples/sax-corner.jpg', label: 'Sax at midnight' },
  { id: 'surfer-dawn', file: 'samples/surfer-dawn.jpg', label: 'Surfer at dawn' },
];

/** Load one image from a URL; resolves with the HTMLImageElement. */
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`cannot load ${src}`));
    img.src = src;
  });
}

/**
 * Load every sample photo. Returns an array of photo records
 * { id, label, src, img, uploaded: false } in SAMPLE_PHOTOS order.
 * A sample that fails to load is skipped, never fatal.
 */
export async function loadSamples() {
  const out = [];
  for (const s of SAMPLE_PHOTOS) {
    try {
      const img = await loadImage(s.file);
      out.push({ id: s.id, label: s.label, src: s.file, img, uploaded: false });
    } catch {
      // A missing sample never blocks the editor; the tray just shows fewer.
    }
  }
  return out;
}

/**
 * Turn user-chosen File objects into photo records with the same shape
 * as samples, backed by object URLs (the bytes never leave the machine).
 */
export function filesToPhotos(files) {
  const out = [];
  for (const f of files) {
    if (!f.type.startsWith('image/')) continue;
    const url = URL.createObjectURL(f);
    const label = f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').slice(0, 24) || 'Your photo';
    out.push({ id: `up-${Date.now()}-${out.length}`, label, src: url, img: null, uploaded: true, file: f });
  }
  return out;
}

/** Finish loading the image of an uploaded photo record, in place. */
export async function hydrateUpload(photo) {
  if (photo.img) return photo;
  photo.img = await loadImage(photo.src);
  return photo;
}
