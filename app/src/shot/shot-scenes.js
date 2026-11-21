// The four screenshot scenes. The app reads ?shot= from the URL: cover
// scenes draw one cover full-frame (the app itself drawing it), and the
// editor scene shows the editor with a photo loaded and a panel selected.
// Photo indices point into SAMPLE_PHOTOS. The scout and runner panels
// are tuned so faces stay whole: the scout panels centre both faces (the
// neon sign reads as a backdrop behind them), and the runner panels are
// face close-ups (zoom 1.5, panned to centre Suki's face) so her face
// stays whole and the cut signs stay out of frame.
//
// Cover 1 — TIDELINE, 16:9, hero mosaic. The duo on the pink convertible
// is the hero; the scout (neon door) and the runner (diner) are panels 2
// and 5.
// Cover 3 — EMBER COAST, 4:5, hero mosaic. The scout opens the cover and
// the runner follows; the motel scout and the club runner close it.
// Cover 4 — SALTWATER, 1:1, seven mosaic. The boardwalk duo opens it and
// the convertible duo is the second panel; the rider, the pier and the
// garage fill the foot.
export const SHOT_SCENES = {
  cover1: {
    id: 'cover1',
    size: '16:9',
    layout: 'hero-mosaic',
    grade: 'sunset',
    titleStyle: 'auto',
    caption: 0,
    photos: [0, 1, 2, 6, 4, 5],
    tags: ['THE ACE', 'THE SCOUT', 'THE CREW', 'THE LOOKOUT', 'THE RUNNER', 'THE GETAWAY'],
    panelZooms: [1.15, 1.2, 1.15, 1.0, 1.5, 1.15],
    panelPans: [[0, 0], [-0.2, 0], [0, -0.45], [0, -0.79], [0.3, 0.1], [0, 0]],
    faceMarked: [1, 4],
  },
  editor: {
    id: 'editor',
    size: '16:9',
    layout: 'diagonal-trio',
    grade: 'neon-night',
    titleStyle: 'auto',
    caption: 1,
    photos: [5, 0, 10],
    selected: 1,
  },
  cover3: {
    id: 'cover3',
    size: '4:5',
    layout: 'hero-mosaic',
    grade: 'neon-night',
    titleStyle: 'auto',
    caption: 2,
    photos: [1, 4, 13, 16, 8, 11],
    tags: ['THE SCOUT', 'THE RUNNER', 'THE SCOUT', 'THE RUNNER', 'THE BONFIRE', 'THE CHASE'],
    panelZooms: [1.2, 1.5, 1.15, 1.5, 1.15, 1.15],
    panelPans: [[-0.2, 0], [0.3, 0.1], [0, 0], [0.3, 0.1], [0, 0], [0, 0]],
    faceMarked: [0, 1, 2, 3],
  },
  cover4: {
    id: 'cover4',
    size: '1:1',
    layout: 'seven-mosaic',
    grade: 'ember-blaze',
    titleStyle: 'auto',
    caption: 3,
    photos: [2, 0, 6, 10, 12, 14, 15],
    tags: ['THE CREW', 'THE ACE', 'THE HARBOR', 'THE RIDER', 'THE PIER', 'THE WALK', 'THE GARAGE'],
    panelZooms: [1.15, 1.15, 1.15, 1.15, 1.15, 1.15, 1.15],
    panelPans: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
    faceMarked: [1],
  },
};

export function shotScene(id) {
  return SHOT_SCENES[id] || null;
}

// The scene named by ?shot= in the URL, or null when the app opens as the
// plain editor.
export function sceneFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('shot');
  return id ? shotScene(id) : null;
}

// 'cover' scenes draw one cover full-frame for a screenshot; 'editor'
// shows the editor itself with a scene applied.
export function sceneMode(scene) {
  return scene && scene.id === 'editor' ? 'editor' : 'cover';
}
