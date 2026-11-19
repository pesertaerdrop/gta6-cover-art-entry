// main.js — the Afterglow editor: state, history, preview, panels,
// uploads, presets and export. The cover renders natively at every
// size from one relative state; the preview is the same render at a
// smaller backing store.

import { loadSampleLibrary, dealPhotos, smartFrame, readUserFiles } from "./photos.js";
import { GRADES, gradeById } from "./grades.js";
import { LAYOUTS, layoutById, layoutTileSVG, framesForLayout } from "./layouts.js";
import { renderCover, exportCoverBlob, SIZES } from "./render.js";
import { freshCover, dealCover, changeLayout, makeHistory } from "./state.js";
import { PRESETS, presetById } from "./presets.js";
import { readShotScene, applySceneToCover, markShotReady } from "./shots.js";

const $ = (id) => document.getElementById(id);
const canvas = $("previewCanvas");
const ctx = canvas.getContext("2d");

let library = [];
let cover = freshCover();
let history = makeHistory(cover);
let selectedPanel = 0;
let dragging = null;
const framingByPhoto = new Map(); // photoId -> last hand-set frame

const scene = readShotScene();

// ---------- render ----------

function photoById() {
  const map = {};
  for (const p of library) map[p.id] = p;
  return map;
}

function renderOpts() {
  return { fast: !!dragging };
}

function renderPreview() {
  const size = SIZES[cover.size];
  const scale = Math.min(1, 860 / Math.max(size.w, size.h));
  const bw = Math.round(size.w * scale);
  const bh = Math.round(size.h * scale);
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }
  const view = { ...cover, photoById: photoById() };
  renderCover(canvas, bw, bh, view, renderOpts());
  syncControls();
}

function syncControls() {
  $("btnUndo").disabled = !history.canUndo;
  $("btnRedo").disabled = !history.canRedo;
  const frame = cover.frames[selectedPanel];
  const layout = layoutById(cover.layout);
  const count = layout.panels(1000, 1000).length;
  $("selectedPanelLabel").textContent = `Panel ${selectedPanel + 1} of ${count}`;
  if (frame) {
    $("zoomSlider").value = frame.zoom;
    $("panXSlider").value = frame.panX;
    $("panYSlider").value = frame.panY;
  }
  $("hintLine").textContent =
    `${library.length} photos ready. Drag a panel to reframe it, then Export.`;
  document.querySelectorAll("#layoutTiles button").forEach((b) => {
    b.classList.toggle("active", b.dataset.layout === cover.layout);
    b.setAttribute("aria-pressed", b.dataset.layout === cover.layout ? "true" : "false");
  });
  document.querySelectorAll("#gradeChips button").forEach((b) => {
    b.classList.toggle("active", b.dataset.grade === cover.grade);
    b.setAttribute("aria-pressed", b.dataset.grade === cover.grade ? "true" : "false");
  });
  document.querySelectorAll("#sizeChips button").forEach((b) => {
    b.classList.toggle("active", b.dataset.size === cover.size);
    b.setAttribute("aria-pressed", b.dataset.size === cover.size ? "true" : "false");
  });
  $("inkToggle").checked = cover.inkOn;
  $("inkSlider").value = cover.inkStrength;
  $("inkSlider").disabled = !cover.inkOn;
}

function commit(next) {
  cover = next;
  history.push(cover);
  renderPreview();
}

function applyCover(next) {
  cover = next;
  renderPreview();
}

// ---------- photo tray ----------

function buildTray() {
  const tray = $("photoTray");
  tray.innerHTML = "";
  for (const photo of library) {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.photo = photo.id;
    b.setAttribute("aria-pressed", "false");
    const img = document.createElement("img");
    img.src = photo.src;
    img.alt = photo.label;
    img.draggable = false;
    const label = document.createElement("span");
    label.textContent = photo.label;
    b.append(img, label);
    b.addEventListener("click", () => assignPhotoToSelected(photo.id));
    tray.appendChild(b);
  }
}

function assignPhotoToSelected(photoId) {
  const photo = library.find((p) => p.id === photoId);
  if (!photo || !cover.frames[selectedPanel]) return;
  const layout = layoutById(cover.layout);
  const panels = layout.panels(1000, 1000);
  const aspect = panels[selectedPanel].w / panels[selectedPanel].h;
  const frame = framingByPhoto.has(photoId)
    ? { ...framingByPhoto.get(photoId), photoId }
    : { ...smartFrame(photo, aspect), photoId };
  const frames = cover.frames.slice();
  frames[selectedPanel] = frame;
  commit({ ...cover, frames });
}

// ---------- layout / grade / size / presets ----------

function buildTiles() {
  const wrap = $("layoutTiles");
  for (const layout of LAYOUTS) {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.layout = layout.id;
    b.innerHTML = layoutTileSVG(layout.id) + `<span>${layout.name}</span>`;
    b.title = layout.blurb;
    b.addEventListener("click", () => {
      const next = changeLayout(library, cover, layout.id);
      selectedPanel = 0;
      commit(next);
    });
    wrap.appendChild(b);
  }
}

function buildChips() {
  const grades = $("gradeChips");
  for (const g of GRADES) {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.grade = g.id;
    b.textContent = g.name;
    b.addEventListener("click", () => commit({ ...cover, grade: g.id }));
    grades.appendChild(b);
  }
  const sizes = $("sizeChips");
  for (const [id, s] of Object.entries(SIZES)) {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.size = id;
    b.textContent = `${s.w} x ${s.h}`;
    b.addEventListener("click", () => commit({ ...cover, size: id }));
    sizes.appendChild(b);
  }
  const presets = $("presetList");
  for (const p of PRESETS) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = p.name;
    b.addEventListener("click", () => {
      let next = { ...cover, ...p.cover };
      if (p.cover.layout !== cover.layout) {
        next = changeLayout(library, next, p.cover.layout);
      }
      selectedPanel = 0;
      commit(next);
    });
    presets.appendChild(b);
  }
}

// ---------- panel selection & reframe ----------

function panelAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const bx = ((clientX - rect.left) / rect.width) * canvas.width;
  const by = ((clientY - rect.top) / rect.height) * canvas.height;
  const artH = canvas.height * 0.79;
  if (by > artH) return -1;
  const layout = layoutById(cover.layout);
  const panels = layout.panels(canvas.width, artH);
  for (let i = 0; i < panels.length; i++) {
    const p = panels[i];
    if (bx >= p.x * canvas.width && bx <= (p.x + p.w) * canvas.width &&
        by >= p.y * artH && by <= (p.y + p.h) * artH) {
      return i;
    }
  }
  return -1;
}

function updateFrame(i, patch, pushHistory) {
  const frames = cover.frames.slice();
  const next = { ...frames[i], ...patch };
  next.zoom = Math.max(1, Math.min(3, next.zoom));
  next.panX = Math.max(-1, Math.min(1, next.panX));
  next.panY = Math.max(-1, Math.min(1, next.panY));
  frames[i] = next;
  framingByPhoto.set(next.photoId, { ...next });
  if (pushHistory) commit({ ...cover, frames });
  else applyCover({ ...cover, frames });
}

canvas.addEventListener("pointerdown", (e) => {
  const i = panelAt(e.clientX, e.clientY);
  if (i < 0) return;
  selectedPanel = i;
  dragging = { panel: i, x: e.clientX, y: e.clientY };
  canvas.setPointerCapture(e.pointerId);
  renderPreview();
});

canvas.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  const rect = canvas.getBoundingClientRect();
  const i = dragging.panel;
  const layout = layoutById(cover.layout);
  const artH = canvas.height * 0.79;
  const panels = layout.panels(canvas.width, artH);
  const p = panels[i];
  const dx = (e.clientX - dragging.x) / rect.width * canvas.width;
  const dy = (e.clientY - dragging.y) / rect.height * canvas.height;
  dragging.x = e.clientX;
  dragging.y = e.clientY;
  const frame = cover.frames[i];
  if (!frame) return;
  updateFrame(i, {
    panX: frame.panX + (dx / (p.w * canvas.width)) * 2.2,
    panY: frame.panY + (dy / (p.h * artH)) * 2.2,
  }, false);
});

canvas.addEventListener("pointerup", () => {
  if (!dragging) return;
  dragging = null;
  history.push(cover);
  renderPreview();
});

canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  const frame = cover.frames[selectedPanel];
  if (!frame) return;
  updateFrame(selectedPanel, { zoom: frame.zoom * Math.exp(-e.deltaY * 0.0012) }, true);
}, { passive: false });

$("zoomSlider").addEventListener("input", (e) => {
  const frame = cover.frames[selectedPanel];
  if (frame) updateFrame(selectedPanel, { zoom: Number(e.target.value) }, false);
});
$("zoomSlider").addEventListener("change", () => history.push(cover));
$("panXSlider").addEventListener("input", (e) => {
  const frame = cover.frames[selectedPanel];
  if (frame) updateFrame(selectedPanel, { panX: Number(e.target.value) }, false);
});
$("panXSlider").addEventListener("change", () => history.push(cover));
$("panYSlider").addEventListener("input", (e) => {
  const frame = cover.frames[selectedPanel];
  if (frame) updateFrame(selectedPanel, { panY: Number(e.target.value) }, false);
});
$("panYSlider").addEventListener("change", () => history.push(cover));
$("btnResetCrop").addEventListener("click", () => {
  const frame = cover.frames[selectedPanel];
  if (!frame) return;
  const photo = library.find((p) => p.id === frame.photoId);
  if (!photo) return;
  const layout = layoutById(cover.layout);
  const panels = layout.panels(1000, 1000);
  const aspect = panels[selectedPanel].w / panels[selectedPanel].h;
  const fresh = { ...smartFrame(photo, aspect), photoId: photo.id };
  updateFrame(selectedPanel, fresh, true);
});

// ---------- words ----------

function bindWord(id, key) {
  const el = $(id);
  el.addEventListener("input", () => {
    cover = { ...cover, [key]: el.value };
    renderPreview();
  });
  el.addEventListener("change", () => history.push(cover));
}
bindWord("inputTitle", "title");
bindWord("inputSubtitle", "subtitle");
bindWord("inputTagline", "tagline");

// ---------- ink ----------

$("inkToggle").addEventListener("change", (e) => {
  commit({ ...cover, inkOn: e.target.checked });
});
$("inkSlider").addEventListener("input", (e) => {
  applyCover({ ...cover, inkStrength: Number(e.target.value), inkOn: true });
});
$("inkSlider").addEventListener("change", () => history.push(cover));

// ---------- undo / redo / export ----------

$("btnUndo").addEventListener("click", () => {
  const prev = history.undo();
  if (prev) { cover = prev; selectedPanel = 0; renderPreview(); }
});
$("btnRedo").addEventListener("click", () => {
  const next = history.redo();
  if (next) { cover = next; selectedPanel = 0; renderPreview(); }
});
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
    e.preventDefault();
    $("btnUndo").click();
  } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) {
    e.preventDefault();
    $("btnRedo").click();
  }
});

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

$("btnExportAll").addEventListener("click", async () => {
  const btn = $("btnExportAll");
  btn.disabled = true;
  btn.textContent = "Exporting…";
  try {
    const view = { ...cover, photoById: photoById() };
    for (const sizeId of ["square", "portrait", "wide"]) {
      const blob = await exportCoverBlob(view, sizeId);
      const s = SIZES[sizeId];
      downloadBlob(blob, `afterglow-cover-${s.w}x${s.h}.png`);
    }
    $("hintLine").textContent = "Exported 3 PNGs — Square 1080 x 1080, Portrait 1080 x 1350, Wide 1920 x 1080.";
  } finally {
    btn.disabled = false;
    btn.textContent = "Export all 3 sizes";
  }
});

// ---------- photos: samples, auto-fill, shuffle, upload ----------

$("btnSamples").addEventListener("click", () => {
  const next = dealCover(library, { ...cover, dealStart: 0 });
  selectedPanel = 0;
  commit(next);
});
$("btnAutofill").addEventListener("click", () => {
  const next = dealCover(library, { ...cover, dealStart: (cover.dealStart || 0) + 1 });
  selectedPanel = 0;
  commit(next);
});
$("btnShuffle").addEventListener("click", () => {
  const shuffled = library.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  library = shuffled;
  buildTray();
  const next = dealCover(library, cover);
  selectedPanel = 0;
  commit(next);
});

$("btnUpload").addEventListener("click", () => $("fileInput").click());
$("fileInput").addEventListener("change", async (e) => {
  const recs = await readUserFiles(e.target.files);
  if (recs.length) {
    library = [...library, ...recs];
    buildTray();
    renderPreview();
  }
  e.target.value = "";
});

$("stage").addEventListener("dragover", (e) => e.preventDefault());
$("stage").addEventListener("drop", async (e) => {
  e.preventDefault();
  const recs = await readUserFiles(e.dataTransfer.files);
  if (recs.length) {
    library = [...library, ...recs];
    buildTray();
    renderPreview();
  }
});
document.addEventListener("paste", async (e) => {
  if (scene.mode === "cover") return;
  const files = [...(e.clipboardData?.files || [])];
  if (!files.length) return;
  const recs = await readUserFiles(files);
  if (recs.length) {
    library = [...library, ...recs];
    buildTray();
    renderPreview();
  }
});

// ---------- boot ----------

async function boot() {
  buildTiles();
  buildChips();
  try {
    await Promise.all([
      document.fonts.load('40px Anton'),
      document.fonts.load('40px "Kaushan Script"'),
      document.fonts.load('40px "Bebas Neue"'),
      document.fonts.ready,
    ]);
  } catch (_) { /* fonts fall back; the render still draws */ }
  library = await loadSampleLibrary();
  buildTray();
  cover = applySceneToCover(cover, scene);
  if (scene.size && SIZES[scene.size]) cover.size = scene.size;
  cover = dealCover(library, cover);
  history = makeHistory(cover);
  $("inputTitle").value = cover.title;
  $("inputSubtitle").value = cover.subtitle;
  $("inputTagline").value = cover.tagline;

  if (scene.mode === "cover") {
    document.body.classList.add("shot-cover");
    const shot = $("shotCanvas");
    shot.width = window.innerWidth;
    shot.height = window.innerHeight;
    const view = { ...cover, photoById: photoById() };
    renderCover(shot, shot.width, shot.height, view);
    markShotReady();
    return;
  }
  renderPreview();
  markShotReady();
}

boot();
