// The four screenshot scenes. The app reads ?shot= from the URL: cover
// scenes draw one cover full-frame (the app itself drawing it), and the
// editor scene shows the editor with a photo loaded and a panel selected.
// Photo indices point into SAMPLE_PHOTOS. The scout and runner panels
// keep faces whole and cut text out of frame: the scout panels pan left
// and zoom in (the neon sign sits at the photo's right edge), and the
// runner panels are face close-ups (zoom 1.5, panned right and down) so
// Suki's face stays whole and both cut signs stay out of frame.
export const SHOT_SCENES = {
  cover1: {
    id: 'cover1',
    size: '16:9',
    layout: 'hero-mosaic',
    grade: 'sunset',
    titleStyle: 'auto',
    caption: 0,
    photos: [0, 1, 2, 3, 4],
    // Scout panel pans left to keep the edge-cut neon sign out; the runner
    // panel (behind the title) pans down so the visible strip below the
    // title shows Suki's chin and jacket, not the cut sign.
    panelZooms: [1.15, 1.2, 1.15, 1.15, 1.0],
    panelPans: [[0, 0], [-1, -0.3], [0, 0], [0, 0], [0, 0.85]],
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
    layout: 'six-grid',
    grade: 'golden-hour',
    titleStyle: 'auto',
    caption: 2,
    photos: [1, 4, 8, 5, 6, 3],
    // Scout panel pans left to keep the edge-cut neon sign out; the runner
    // panel is a face close-up (zoom 1.5, panned right and down) so Suki's
    // face stays whole and both cut signs stay out of frame.
    panelZooms: [1.2, 1.5, 1.15, 1.15, 1.15, 1.15],
    panelPans: [[-1, 0], [1, 0.3], [0, 0], [0, 0], [0, 0], [0, 0]],
    faceMarked: [0],
  },
  cover4: {
    id: 'cover4',
    size: '1:1',
    layout: 'seven-mosaic',
    grade: 'tropic-teal',
    titleStyle: 'auto',
    caption: 3,
    photos: [2, 6, 11, 9, 15, 0, 4],
    // Runner panel is a face close-up (zoom 1.5, panned right and down):
    // a landscape panel on a portrait photo would otherwise show only
    // the neon signs above Suki's face.
    panelZooms: [1.15, 1.15, 1.15, 1.15, 1.15, 1.15, 1.5],
    panelPans: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [1, 0.7]],
    faceMarked: [6],
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
