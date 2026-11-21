// The cast and the sample photos.
//
// Mira has long silver-lilac hair, Suki a short teal bob. The two of
// them, a pink classic car, and the Vice City neon are the whole cast
// of the sample set: seventeen photos, each with a caption for the
// tray and a callout tag for its panel. The photos are files under
// samples/ and load from there, never from the network.
export const CAST = [
  { name: 'Mira', note: 'long silver-lilac hair' },
  { name: 'Suki', note: 'short teal bob' },
];

// Each row: the file under samples/, the caption the tray shows, and
// the callout tag the panel wears. The order is the order the default
// document fills its panels in.
const PHOTO_ROWS = [
  { file: 'mira-suki-convertible.jpg', label: 'Pink convertible, dusk', tag: 'THE ACE' },
  { file: 'mira-suki-neon.jpg', label: 'Pink car door, neon', tag: 'THE SCOUT' },
  { file: 'mira-suki-boardwalk.jpg', label: 'Boardwalk sunset', tag: 'THE CREW' },
  { file: 'mira-harbor.jpg', label: 'Yacht deck', tag: 'THE LOOKOUT' },
  { file: 'suki-diner.jpg', label: 'Diner night', tag: 'THE RUNNER' },
  { file: 'mira-suki-pool.jpg', label: 'Art-deco pool', tag: 'THE GETAWAY' },
  { file: 'mira-rooftop.jpg', label: 'Rooftop dusk', tag: 'THE CAPTAIN' },
  { file: 'mira-suki-club.jpg', label: 'Club door, neon', tag: 'THE RUNNER' },
  { file: 'mira-suki-motel.jpg', label: 'Motel court, rain', tag: 'THE SCOUT' },
  { file: 'mira-neon.jpg', label: 'Neon signs', tag: 'THE ARTIST' },
  { file: 'suki-rider.jpg', label: 'Motorcycle sunset', tag: 'THE RIDER' },
  { file: 'mira-suki-powerboat.jpg', label: 'Powerboat', tag: 'THE CHASE' },
  { file: 'suki-pier.jpg', label: 'Fishing pier', tag: 'THE PIER' },
  { file: 'mira-boardwalk.jpg', label: 'Bicycle boardwalk', tag: 'THE WALK' },
  { file: 'suki-garage.jpg', label: 'Polishing pink car', tag: 'THE GARAGE' },
  { file: 'mira-suki-bonfire.jpg', label: 'Beach bonfire', tag: 'THE BONFIRE' },
  { file: 'suki-market.jpg', label: 'Night market', tag: 'THE DANCER' },
];

export const SAMPLE_PHOTOS = PHOTO_ROWS.map((row) => ({
  src: 'samples/' + row.file,
  label: row.label,
  tag: row.tag,
}));

// Every callout tag the sample set uses, in first-use order.
export const DEFAULT_TAGS = [
  'THE ACE', 'THE SCOUT', 'THE CREW', 'THE LOOKOUT', 'THE RUNNER',
  'THE GETAWAY', 'THE CAPTAIN', 'THE ARTIST', 'THE RIDER', 'THE CHASE',
  'THE PIER', 'THE WALK', 'THE GARAGE', 'THE BONFIRE', 'THE DANCER',
];

export function isSamplePhoto(src) {
  return SAMPLE_PHOTOS.some((photo) => photo.src === src);
}

// Step to the next (or previous, dir = -1) sample photo from src,
// wrapping around the set.
export function nextSamplePhoto(src, dir = 1) {
  const at = SAMPLE_PHOTOS.findIndex((photo) => photo.src === src);
  const from = at < 0 ? 0 : at;
  const to = (from + dir + SAMPLE_PHOTOS.length) % SAMPLE_PHOTOS.length;
  return SAMPLE_PHOTOS[to];
}

export function labelOf(src) {
  const found = SAMPLE_PHOTOS.find((photo) => photo.src === src);
  return found ? found.label : '';
}
