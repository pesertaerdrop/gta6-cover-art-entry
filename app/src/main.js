// main.js — the Afterglow editor.
//
// State, history, preview, panels, uploads, presets and export. The
// cover renders natively at every size from one relative state; the
// preview is the same render at a smaller backing store.

import { loadSampleLibrary, smartFrame, readUserFiles } from "./photos.js";
import { GRADES } from "./grades.js";
import { LAYOUTS, layoutById, layoutTileSVG, TITLE_BAND } from "./layouts.js";
import { renderCover, exportCoverBlob, SIZES } from "./render.js";
import { freshCover, dealCover, changeLayout, makeHistory } from "./state.js";
import { PRESETS } from "./presets.js";
import { readShotScene, applySceneToCover, markShotReady } from "./shots.js";

// Small DOM helpers.
const $ = (id) => document.getElementById(id);
function on(id, event, fn, opts) {
  $(id).addEventListener(event, fn, opts);
}
const canvas = $("previewCanvas");

let library = [];
let cover = freshCover();
let history = makeHistory(cover);
let selected = 0;
let drag = null;
const keptFrames = new Map(); // photoId -> last hand-set frame

const scene = readShotScene();
const ART_SHARE = 1 - TITLE_BAND; // fraction of the cover that is art

// ---------- boot ----------

async function boot() {
  buildTiles();
  buildChips();
  wireControls();
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
    renderCover(shot, shot.width, shot.height, { ...cover, photoById: photoById() });
    markShotReady();
    return;
  }
  renderPreview();
  markShotReady();
}

// ---------- render ----------

function photoById() {
  const map = {};
  for (const p of library) map[p.id] = p;
  return map;
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
  renderCover(canvas, bw, bh, { ...cover, photoById: photoById() }, { fast: !!drag });
  syncControls();
}

function markActive(selector, attr, value) {
  document.querySelectorAll(selector).forEach((b) => {
    const active = b.dataset[attr] === value;
    b.classList.toggle("active", active);
    b.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function syncControls() {
  $("btnUndo").disabled = !history.canUndo;
  $("btnRedo").disabled = !history.canRedo;
  const frame = cover.frames[selected];
  const panelCount = layoutById(cover.layout).panels(1000, 1000).length;
  $("selectedPanelLabel").textContent = `Panel ${selected + 1} of ${panelCount}`;
  if (frame) {
    $("zoomSlider").value = frame.zoom;
    $("panXSlider").value = frame.panX;
    $("panYSlider").value = frame.panY;
  }
  $("hintLine").textContent =
    `${library.length} photos ready. Drag a panel to reframe it, then Export.`;
  markActive("#layoutTiles button", "layout", cover.layout);
  markActive("#gradeChips button", "grade", cover.grade);
  markActive("#sizeChips button", "size", cover.size);
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
  if (!photo || !cover.frames[selected]) return;
  const panels = layoutById(cover.layout).panels(1000, 1000);
  const aspect = panels[selected].w / panels[selected].h;
  const frame = keptFrames.has(photoId)
    ? { ...keptFrames.get(photoId), photoId }
    : { ...smartFrame(photo, aspect), photoId };
  const frames = cover.frames.slice();
  frames[selected] = frame;
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
      selected = 0;
      commit(changeLayout(library, cover, layout.id));
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
      selected = 0;
      commit(next);
    });
    presets.appendChild(b);
  }
}

// ---------- panel selection & reframe ----------

function clampFrame(f) {
  f.zoom = Math.max(1, Math.min(3, f.zoom));
  f.panX = Math.max(-1, Math.min(1, f.panX));
  f.panY = Math.max(-1, Math.min(1, f.panY));
  return f;
}

function panelAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const bx = ((clientX - rect.left) / rect.width) * canvas.width;
  const by = ((clientY - rect.top) / rect.height) * canvas.height;
  const artH = canvas.height * ART_SHARE;
  if (by > artH) return -1;
  const panels = layoutById(cover.layout).panels(canvas.width, artH);
  for (let i = 0; i < panels.length; i++) {
    const p = panels[i];
    const inX = bx >= p.x * canvas.width && bx <= (p.x + p.w) * canvas.width;
    const inY = by >= p.y * artH && by <= (p.y + p.h) * artH;
    if (inX && inY) return i;
  }
  return -1;
}

function updateFrame(i, patch, pushHistory) {
  const frames = cover.frames.slice();
  const next = clampFrame({ ...frames[i], ...patch });
  frames[i] = next;
  keptFrames.set(next.photoId, { ...next });
  if (pushHistory) commit({ ...cover, frames });
  else applyCover({ ...cover, frames });
}

function resetSelectedCrop() {
  const frame = cover.frames[selected];
  if (!frame) return;
  const photo = library.find((p) => p.id === frame.photoId);
  if (!photo) return;
  const panels = layoutById(cover.layout).panels(1000, 1000);
  const aspect = panels[selected].w / panels[selected].h;
  updateFrame(selected, { ...smartFrame(photo, aspect), photoId: photo.id }, true);
}

// ---------- all the wiring ----------

function wireControls() {
  canvas.addEventListener("pointerdown", (e) => {
    const i = panelAt(e.clientX, e.clientY);
    if (i < 0) return;
    selected = i;
    drag = { panel: i, x: e.clientX, y: e.clientY };
    canvas.setPointerCapture(e.pointerId);
    renderPreview();
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const rect = canvas.getBoundingClientRect();
    const i = drag.panel;
    const artH = canvas.height * ART_SHARE;
    const panels = layoutById(cover.layout).panels(canvas.width, artH);
    const p = panels[i];
    const dx = ((e.clientX - drag.x) / rect.width) * canvas.width;
    const dy = ((e.clientY - drag.y) / rect.height) * canvas.height;
    drag.x = e.clientX;
    drag.y = e.clientY;
    const frame = cover.frames[i];
    if (!frame) return;
    updateFrame(i, {
      panX: frame.panX + (dx / (p.w * canvas.width)) * 2.2,
      panY: frame.panY + (dy / (p.h * artH)) * 2.2,
    }, false);
  });

  canvas.addEventListener("pointerup", () => {
    if (!drag) return;
    drag = null;
    history.push(cover);
    renderPreview();
  });

  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const frame = cover.frames[selected];
    if (!frame) return;
    updateFrame(selected, { zoom: frame.zoom * Math.exp(-e.deltaY * 0.0012) }, true);
  }, { passive: false });

  // Sliders: live update while dragging, one history entry on release.
  for (const [id, key] of [["zoomSlider", "zoom"], ["panXSlider", "panX"], ["panYSlider", "panY"]]) {
    on(id, "input", (e) => {
      const frame = cover.frames[selected];
      if (frame) updateFrame(selected, { [key]: Number(e.target.value) }, false);
    });
    on(id, "change", () => history.push(cover));
  }
  on("btnResetCrop", "click", resetSelectedCrop);

  // Words: live preview while typing, one history entry on change.
  for (const [id, key] of [["inputTitle", "title"], ["inputSubtitle", "subtitle"], ["inputTagline", "tagline"]]) {
    on(id, "input", (e) => {
      cover = { ...cover, [key]: e.target.value };
      renderPreview();
    });
    on(id, "change", () => history.push(cover));
  }

  // Ink: toggle commits, slider previews live.
  on("inkToggle", "change", (e) => commit({ ...cover, inkOn: e.target.checked }));
  on("inkSlider", "input", (e) => applyCover({ ...cover, inkStrength: Number(e.target.value), inkOn: true }));
  on("inkSlider", "change", () => history.push(cover));

  // Undo / redo, buttons and keys.
  on("btnUndo", "click", () => {
    const prev = history.undo();
    if (prev) { cover = prev; selected = 0; renderPreview(); }
  });
  on("btnRedo", "click", () => {
    const next = history.redo();
    if (next) { cover = next; selected = 0; renderPreview(); }
  });
  document.addEventListener("keydown", (e) => {
    const mod = e.ctrlKey || e.metaKey;
    const key = e.key.toLowerCase();
    if (mod && key === "z" && !e.shiftKey) {
      e.preventDefault();
      $("btnUndo").click();
    } else if (mod && (key === "y" || (key === "z" && e.shiftKey))) {
      e.preventDefault();
      $("btnRedo").click();
    }
  });

  on("btnExportAll", "click", exportAllSizes);

  // Photos: samples, auto-fill, shuffle, upload.
  on("btnSamples", "click", () => {
    selected = 0;
    commit(dealCover(library, { ...cover, dealStart: 0 }));
  });
  on("btnAutofill", "click", () => {
    selected = 0;
    commit(dealCover(library, { ...cover, dealStart: (cover.dealStart || 0) + 1 }));
  });
  on("btnShuffle", "click", () => {
    const shuffled = library.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    library = shuffled;
    buildTray();
    selected = 0;
    commit(dealCover(library, cover));
  });
  on("btnUpload", "click", () => $("fileInput").click());
  on("fileInput", "change", async (e) => {
    await addUserFiles(e.target.files);
    e.target.value = "";
  });
  $("stage").addEventListener("dragover", (e) => e.preventDefault());
  $("stage").addEventListener("drop", async (e) => {
    e.preventDefault();
    await addUserFiles(e.dataTransfer.files);
  });
  document.addEventListener("paste", async (e) => {
    if (scene.mode === "cover") return;
    const files = [...(e.clipboardData?.files || [])];
    if (files.length) await addUserFiles(files);
  });
}

async function addUserFiles(files) {
  const recs = await readUserFiles(files);
  if (!recs.length) return;
  library = [...library, ...recs];
  buildTray();
  renderPreview();
}

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

async function exportAllSizes() {
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
}

boot();
