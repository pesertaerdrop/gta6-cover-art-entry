// The screenshot scenes.
//
// A scene is a whole document in miniature: the size, the layout, the
// grade, the caption, and the photo, tag and crop of every panel.
// The four scenes are the four screenshots the kit asks for — three
// exported covers and the editor with a photo loaded — so the shots
// are reproducible from the app alone, and the app's own drawing is
// what the screenshots show. Crops are face-safe: thin panels pan up
// so the faces stay whole, and the scout's neon sign is panned left
// so "VICE CITY" reads in full. `tagDy` drops a panel's tag below
// something in the photo it would otherwise cover.
const P = (file, tag, zoom = 1.15, panX = 0, panY = 0, tagDy = 0) => ({ file, tag, zoom, panX, panY, tagDy });

export const SHOT_SCENES = {
  cover1: {
    id: 'cover1',
    mode: 'cover',
    size: '16:9',
    layout: 'hero-mosaic',
    grade: 'sunset',
    titleStyle: 'auto',
    caption: 0,
    panels: [
      P('mira-suki-convertible.jpg', 'THE ACE'),
      P('mira-suki-neon.jpg', 'THE SCOUT'),
      P('mira-suki-boardwalk.jpg', 'THE CREW', 1.0, 0, -0.45),
      P('mira-harbor.jpg', 'THE LOOKOUT', 1.0, 0, -0.79),
      P('suki-diner.jpg', 'THE RUNNER'),
      P('mira-suki-pool.jpg', 'THE GETAWAY'),
    ],
  },
  editor: {
    id: 'editor',
    mode: 'editor',
    size: '16:9',
    layout: 'diagonal-trio',
    grade: 'sunset',
    titleStyle: 'auto',
    caption: 1,
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
    titleStyle: 'auto',
    caption: 2,
    panels: [
      P('mira-suki-neon.jpg', 'THE SCOUT', 1.0, -0.7, 0, 130),
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
    titleStyle: 'auto',
    caption: 3,
    panels: [
      P('mira-suki-boardwalk.jpg', 'THE CREW', 1.0, 0, -0.45),
      P('mira-suki-convertible.jpg', 'THE ACE'),
      P('mira-harbor.jpg', 'THE HARBOR', 1.0, 0, -0.79),
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

// The scene the page's ?shot= parameter names, or null for the plain editor.
export function sceneFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('shot');
  if (!id) return null;
  return shotScene(id);
}

export function sceneMode(scene) {
  return scene && scene.mode ? scene.mode : 'cover';
}
