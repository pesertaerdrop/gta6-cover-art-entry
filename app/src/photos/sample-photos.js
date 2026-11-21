// The sample library: seventeen image-model photos of one invented cast —
// Mira, long silver-lilac hair, and Suki, a short teal bob — a Vice City
// duo around one pink classic convertible. Every photo carries its scene,
// its cast and its default callout tag; the helpers below serve the
// editor's sample strip and the cover renderer.
export const CAST = [
  { id: 'mira', name: 'Mira', role: 'long silver-lilac hair' },
  { id: 'suki', name: 'Suki', role: 'short teal bob' },
];

export const SAMPLE_PHOTOS = [
  { src: 'samples/mira-suki-convertible.jpg', scene: 'Pink convertible, dusk', cast: 'mira,suki', tag: 'THE ACE' },
  { src: 'samples/mira-suki-neon.jpg', scene: 'Pink car door, neon', cast: 'mira,suki', tag: 'THE SCOUT' },
  { src: 'samples/mira-suki-boardwalk.jpg', scene: 'Boardwalk sunset', cast: 'mira,suki', tag: 'THE PILOT' },
  { src: 'samples/mira-rooftop.jpg', scene: 'Rooftop dusk', cast: 'mira', tag: 'THE HOST' },
  { src: 'samples/suki-diner.jpg', scene: 'Diner night', cast: 'suki', tag: 'THE RUNNER' },
  { src: 'samples/mira-suki-pool.jpg', scene: 'Art-deco pool', cast: 'mira,suki', tag: 'THE ARTIST' },
  { src: 'samples/mira-harbor.jpg', scene: 'Yacht deck', cast: 'mira', tag: 'THE DANCER' },
  { src: 'samples/suki-market.jpg', scene: 'Night market', cast: 'suki', tag: 'THE CHEF' },
  { src: 'samples/mira-suki-bonfire.jpg', scene: 'Beach bonfire', cast: 'mira,suki', tag: 'THE GUARD' },
  { src: 'samples/mira-neon.jpg', scene: 'Neon signs', cast: 'mira', tag: 'THE SINGER' },
  { src: 'samples/suki-rider.jpg', scene: 'Motorcycle sunset', cast: 'suki', tag: 'THE CAPTAIN' },
  { src: 'samples/mira-suki-powerboat.jpg', scene: 'Powerboat', cast: 'mira,suki', tag: 'THE STRANGER' },
  { src: 'samples/suki-pier.jpg', scene: 'Fishing pier', cast: 'suki', tag: 'THE ACE' },
  { src: 'samples/mira-suki-motel.jpg', scene: 'Motel court, rain', cast: 'mira,suki', tag: 'THE SCOUT' },
  { src: 'samples/mira-boardwalk.jpg', scene: 'Bicycle boardwalk', cast: 'mira', tag: 'THE PILOT' },
  { src: 'samples/suki-garage.jpg', scene: 'Polishing pink car', cast: 'suki', tag: 'THE HOST' },
  { src: 'samples/mira-suki-club.jpg', scene: 'Club door, neon', cast: 'mira,suki', tag: 'THE RUNNER' },
];

export const DEFAULT_TAGS = [
  'THE ACE', 'THE SCOUT', 'THE PILOT', 'THE HOST', 'THE RUNNER', 'THE ARTIST',
  'THE DANCER', 'THE CHEF', 'THE GUARD', 'THE SINGER', 'THE CAPTAIN', 'THE STRANGER',
];

export function isSamplePhoto(src) {
  return SAMPLE_PHOTOS.some((photo) => photo.src === src);
}

// The next (dir +1) or previous (dir -1) sample photo after src, wrapping
// around the library; an unknown source falls back to the first photo.
export function nextSamplePhoto(src, dir = 1) {
  const index = SAMPLE_PHOTOS.findIndex((photo) => photo.src === src);
  const next = (index < 0 ? 0 : index + dir + SAMPLE_PHOTOS.length) % SAMPLE_PHOTOS.length;
  return SAMPLE_PHOTOS[next];
}

export function labelOf(src) {
  const photo = SAMPLE_PHOTOS.find((p) => p.src === src);
  return photo ? `${photo.scene} — ${photo.cast}` : src;
}
