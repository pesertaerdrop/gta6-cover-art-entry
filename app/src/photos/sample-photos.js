// sample-photos.js — the 14 image-model sample photos and the invented cast
// who recurs across every cover. Vera, Marcus, June and Otis are invented
// people; their names feed the callout tags so the covers tell one story.
// Every file is a photograph with no text and no logos in it.
export const CAST = [
  { name: 'Vera', note: 'late 20s, copper hair, gold hoops' },
  { name: 'Marcus', note: '30s, short beard, floral shirt, gold chain' },
  { name: 'June', note: 'early 20s, dark bob' },
  { name: 'Otis', note: '50s, bucket hat, white tank top' },
];

export const SAMPLE_PHOTOS = [
  { file: 'samples/vera-convertible.jpg', cast: 'Vera', scene: 'convertible on the boulevard' },
  { file: 'samples/marcus-rooftop.jpg', cast: 'Marcus', scene: 'hotel rooftop at dusk' },
  { file: 'samples/june-otis-diner.jpg', cast: 'June and Otis', scene: 'laughing outside the diner' },
  { file: 'samples/otis-pier.jpg', cast: 'Otis', scene: 'fishing on the pier' },
  { file: 'samples/vera-boardwalk.jpg', cast: 'Vera', scene: 'bicycle on the boardwalk' },
  { file: 'samples/marcus-powerboat.jpg', cast: 'Marcus', scene: 'powerboat at full throttle' },
  { file: 'samples/june-market.jpg', cast: 'June', scene: 'night-market food stall' },
  { file: 'samples/vera-harbor.jpg', cast: 'Vera', scene: 'yacht deck at dusk' },
  { file: 'samples/marcus-motel.jpg', cast: 'Marcus', scene: 'motel court in the rain' },
  { file: 'samples/june-pool.jpg', cast: 'June', scene: 'art-deco pool, flamingo float' },
  { file: 'samples/vera-neon.jpg', cast: 'Vera', scene: 'under the neon signs' },
  { file: 'samples/marcus-rider.jpg', cast: 'Marcus', scene: 'motorcycle at sunset' },
  { file: 'samples/crew-bonfire.jpg', cast: 'Vera, Marcus, June and Otis', scene: 'beach bonfire at dusk' },
  { file: 'samples/otis-garage.jpg', cast: 'Otis', scene: 'polishing the classic car' },
];

export const DEFAULT_TAGS = [
  'THE ACE',
  'THE SCOUT',
  'THE PILOT',
  'THE HOST',
  'THE RUNNER',
  'THE ARTIST',
  'THE DANCER',
  'THE CHEF',
  'THE GUARD',
  'THE SINGER',
  'THE CAPTAIN',
  'THE STRANGER',
];

export function samplePhotoByFile(file) {
  return SAMPLE_PHOTOS.find((photo) => photo.file === file) ?? null;
}

export function samplePhotoIndex(file) {
  return SAMPLE_PHOTOS.findIndex((photo) => photo.file === file);
}

export function nextSamplePhoto(file, step) {
  const index = samplePhotoIndex(file);
  const base = index < 0 ? 0 : index;
  const next = (base + step + SAMPLE_PHOTOS.length) % SAMPLE_PHOTOS.length;
  return SAMPLE_PHOTOS[next];
}
