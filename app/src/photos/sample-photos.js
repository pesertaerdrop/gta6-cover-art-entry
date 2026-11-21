// The cast and the sample photos. Mira has long silver-lilac hair, Suki
// a short teal bob; every sample is a shot of one or both of them around
// Vice City at dusk: the pink convertible, the neon streets, the boardwalk,
// the harbour, the diner, the pool, the bonfire, the powerboat. The photos
// were made with an image model for this entry, so they are free to use.
// Each row is [file, tray label, default callout tag]; the tag is only a
// starting point — a panel's tag is edited in the inspector.
export const CAST = [
  { name: 'Mira', note: 'long silver-lilac hair' },
  { name: 'Suki', note: 'short teal bob' },
];

const PHOTO_ROWS = [
  ['mira-suki-convertible.jpg', 'Pink convertible, dusk', 'THE ACE'],
  ['mira-suki-neon.jpg', 'Pink car door, neon', 'THE SCOUT'],
  ['mira-suki-boardwalk.jpg', 'Boardwalk sunset', 'THE CREW'],
  ['mira-harbor.jpg', 'Yacht deck', 'THE LOOKOUT'],
  ['suki-diner.jpg', 'Diner night', 'THE RUNNER'],
  ['mira-suki-pool.jpg', 'Art-deco pool', 'THE GETAWAY'],
  ['mira-rooftop.jpg', 'Rooftop dusk', 'THE CAPTAIN'],
  ['mira-suki-club.jpg', 'Club door, neon', 'THE RUNNER'],
  ['mira-suki-motel.jpg', 'Motel court, rain', 'THE SCOUT'],
  ['mira-neon.jpg', 'Neon signs', 'THE ARTIST'],
  ['suki-rider.jpg', 'Motorcycle sunset', 'THE RIDER'],
  ['mira-suki-powerboat.jpg', 'Powerboat', 'THE CHASE'],
  ['suki-pier.jpg', 'Fishing pier', 'THE PIER'],
  ['mira-boardwalk.jpg', 'Bicycle boardwalk', 'THE WALK'],
  ['suki-garage.jpg', 'Polishing pink car', 'THE GARAGE'],
  ['mira-suki-bonfire.jpg', 'Beach bonfire', 'THE BONFIRE'],
  ['suki-market.jpg', 'Night market', 'THE DANCER'],
];

export const SAMPLE_PHOTOS = PHOTO_ROWS.map(([file, label, tag]) => ({
  src: `./samples/${file}`,
  file,
  label,
  tag,
}));

// The tags a fresh panel cycles through when a photo is placed.
export const DEFAULT_TAGS = [
  'THE ACE', 'THE SCOUT', 'THE CREW', 'THE LOOKOUT', 'THE RUNNER',
  'THE GETAWAY', 'THE CAPTAIN', 'THE ARTIST', 'THE RIDER', 'THE CHASE',
  'THE PIER', 'THE WALK', 'THE GARAGE', 'THE BONFIRE', 'THE DANCER',
];

export function isSamplePhoto(src) {
  return SAMPLE_PHOTOS.some((p) => p.src === src);
}

export function nextSamplePhoto(src, dir = 1) {
  const i = SAMPLE_PHOTOS.findIndex((p) => p.src === src);
  if (i === -1) return SAMPLE_PHOTOS[0].src;
  const n = SAMPLE_PHOTOS.length;
  return SAMPLE_PHOTOS[(i + dir + n) % n].src;
}

export function labelOf(src) {
  const found = SAMPLE_PHOTOS.find((p) => p.src === src);
  return found ? found.label : 'Your photo';
}
