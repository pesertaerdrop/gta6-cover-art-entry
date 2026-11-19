// shots.js — the ?shot= scene driver. The screenshots the dossier
// carries are taken by the app itself: a scene sets the layout, grade,
// ink and words, the app draws it, and the driver screenshots the
// page. shot=cover draws one exported cover full-frame; shot=editor
// shows the editor with a photo loaded. The page sets
// window.__afterglowReady when the scene has drawn.

export function readShotScene() {
  const q = new URLSearchParams(location.search);
  const shot = q.get("shot") || "editor";
  const scene = {
    mode: shot === "cover" ? "cover" : "editor",
    layout: q.get("layout") || null,
    grade: q.get("grade") || null,
    ink: q.get("ink") === null ? null : Number(q.get("ink")),
    title: q.get("title") || null,
    subtitle: q.get("subtitle") || null,
    tagline: q.get("tagline") || null,
    size: q.get("size") || null,
  };
  return scene;
}

// Apply a scene's words/layout/grade/ink onto a cover object.
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

export function markShotReady() {
  window.__afterglowReady = true;
  document.documentElement.setAttribute("data-shot-ready", "true");
}
