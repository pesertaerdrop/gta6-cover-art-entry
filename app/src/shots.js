// shots.js — the ?shot= scene driver.
//
// The screenshots the dossier carries are taken by the app itself: a
// scene sets the layout, grade, ink and words, the app draws it, and
// the driver screenshots the page. shot=cover draws one exported
// cover full-frame; shot=editor shows the editor with a photo loaded.
// The page sets window.__afterglowReady once the scene has drawn, so
// the driver knows when to take the picture.

// Read the scene out of the page's query string. Anything the URL
// does not say stays null, and the cover keeps its own value.
export function readShotScene() {
  const q = new URLSearchParams(location.search);
  const scene = {
    mode: "editor",
    layout: null,
    grade: null,
    ink: null,
    title: null,
    subtitle: null,
    tagline: null,
    size: null,
  };
  if (q.get("shot") === "cover") {
    scene.mode = "cover";
  }
  if (q.get("layout")) {
    scene.layout = q.get("layout");
  }
  if (q.get("grade")) {
    scene.grade = q.get("grade");
  }
  if (q.get("ink") !== null) {
    scene.ink = Number(q.get("ink"));
  }
  if (q.get("title")) {
    scene.title = q.get("title");
  }
  if (q.get("subtitle")) {
    scene.subtitle = q.get("subtitle");
  }
  if (q.get("tagline")) {
    scene.tagline = q.get("tagline");
  }
  if (q.get("size")) {
    scene.size = q.get("size");
  }
  return scene;
}

// Apply a scene's words, layout, grade and ink onto a cover object.
// An ink value of 0 turns the ink off; anything else turns it on at
// that strength, clamped to 0..1.
export function applySceneToCover(cover, scene) {
  const next = { ...cover };
  if (scene.layout) next.layout = scene.layout;
  if (scene.grade) next.grade = scene.grade;
  if (scene.ink !== null && !Number.isNaN(scene.ink)) {
    next.inkOn = scene.ink > 0;
    next.inkStrength = Math.max(0, Math.min(1, scene.ink));
  }
  if (scene.title) next.title = scene.title;
  if (scene.subtitle) next.subtitle = scene.subtitle;
  if (scene.tagline) next.tagline = scene.tagline;
  if (scene.size) next.size = scene.size;
  return next;
}

// Tell the screenshot driver the scene has drawn.
export function markShotReady() {
  window.__afterglowReady = true;
  document.documentElement.setAttribute("data-shot-ready", "true");
}
