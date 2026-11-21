// The screenshot scenes: the four views the capture script photographs.
// Each scene is a full document preset — size, layout, grade, caption and
// the exact panels (photo, tag, zoom, pan) — so the screenshots are
// reproducible from the app alone. The editor scene shows the editor with
// a photo loaded and a panel selected; the three cover scenes draw one
// cover full-frame. A panel row is [photo file, tag, zoom, panX, panY].
// Pans are tuned by eye: the crew strip on cover 1 pans up so both faces
// sit inside the thin band, and the scout on cover 3 pans left so the
// VICE CITY sign reads whole.
const P = (file, tag, zoom = 1.15, panX = 0, panY = 0) => ({
  photo: `./samples/${file}`,
  tag,
  tagOn: true,
  zoom,
  panX,
  panY,
  flip: false,
  faceMarked: false,
});

export const SHOT_SCENES = {
  cover1: {
    id: 'cover1',
    mode: 'cover',
    size: '16:9',
    layout: 'hero-mosaic',
    grade: 'sunset',
    caption: 0,
    selected: 0,
    panels: [
      P('mira-suki-convertible.jpg', 'THE ACE'),
      P('mira-suki-neon.jpg', 'THE SCOUT'),
      P('mira-suki-boardwalk.jpg', 'THE CREW', 1.15, 0, 0.7),
      P('mira-harbor.jpg', 'THE LOOKOUT'),
      P('suki-diner.jpg', 'THE RUNNER'),
      P('mira-suki-pool.jpg', 'THE GETAWAY'),
    ],
  },
  editor: {
    id: 'editor',
    mode: 'editor',
    size: '16:9',
    layout: 'diagonal-trio',
    grade: 'neon-night',
    caption: 1,
    selected: 1,
    panels: [
      P('mira-neon.jpg', 'THE ARTIST'),
      P('mira-suki-convertible.jpg', 'THE ACE'),
      P('mira-rooftop.jpg', 'THE CAPTAIN'),
    ],
  },
  cover3: {
    id: 'cover3',
    mode: 'cover',
    size: '4:5',
    layout: 'hero-mosaic',
    grade: 'neon-night',
    caption: 2,
    selected: 0,
    panels: [
      P('mira-suki-neon.jpg', 'THE SCOUT', 1.15, 0.3, 0),
      P('suki-diner.jpg', 'THE RUNNER'),
      P('mira-suki-motel.jpg', 'THE SCOUT'),
      P('mira-suki-club.jpg', 'THE RUNNER'),
      P('mira-suki-bonfire.jpg', 'THE BONFIRE'),
      P('mira-suki-powerboat.jpg', 'THE CHASE'),
    ],
  },
  cover4: {
    id: 'cover4',
    mode: 'cover',
    size: '1:1',
    layout: 'seven-mosaic',
    grade: 'ember-blaze',
    caption: 3,
    selected: 0,
    panels: [
      P('mira-suki-boardwalk.jpg', 'THE CREW'),
      P('mira-suki-convertible.jpg', 'THE ACE'),
      P('mira-harbor.jpg', 'THE HARBOR'),
      P('suki-rider.jpg', 'THE RIDER'),
      P('suki-pier.jpg', 'THE PIER'),
      P('mira-boardwalk.jpg', 'THE WALK'),
      P('suki-garage.jpg', 'THE GARAGE'),
    ],
  },
};

export function shotScene(id) {
  return SHOT_SCENES[id] || null;
}

// Read ?shot=<id> from the page URL, for the capture script and for
// anyone opening a scene directly. Returns the scene or null for the
// plain editor.
export function sceneFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    return shotScene(params.get('shot'));
  } catch {
    return null;
  }
}

// 'cover' draws one cover full-frame; 'editor' shows the workbench.
export function sceneMode(scene) {
  return scene ? scene.mode || 'cover' : 'editor';
}
