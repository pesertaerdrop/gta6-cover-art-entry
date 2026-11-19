// main.js — the Afterglow editor.
//
// One relative cover state drives everything: the live preview, the
// panel reframe controls and the PNG export all render from it, so
// what you see is what the export writes. History is a 50-deep stack
// of cover snapshots; a hand-set crop is remembered per photo, so it
// survives a layout change.

import { loadSampleLibrary, smartFrame, readUserFiles } from "./photos.js";
import { GRADES } from "./grades.js";
import { LAYOUTS, layoutById, layoutTileSVG, TITLE_BAND } from "./layouts.js";
import { renderCover, exportCoverBlob, SIZES } from "./render.js";
import { freshCover, dealCover, changeLayout, makeHistory } from "./state.js";
import { PRESETS } from "./presets.js";
import { readShotScene, applySceneToCover, markShotReady } from "./shots.js";

// ---------- tiny DOM helpers ----------

const $ = (id) => document.getElementById(id);
const listen = (id, event, fn, opts) => $(id).addEventListener(event, fn, opts);
const previewCanvas = $("previewCanvas");

// ---------- editor state ----------

let library = [];
let cover = freshCover();
let history = makeHistory(cover);
let selected = 0;
let pointerDrag = null;
const savedCrops = new Map(); // photoId -> last hand-set frame

const shotScene = readShotScene();
const ART_FRACTION = 1 - TITLE_BAND; // share of the cover that is art

// ---------- startup ----------

async function boot() {
  buildLayoutTiles();
  buildChoiceChips();
  wireAllControls();
  try {
    await Promise.all([
      document.fonts.load('40px Anton'),
      document.fonts.load('40px "Kaushan Script"'),
      document.fonts.load('40px "Bebas Neue"'),
      document.fonts.ready,
    ]);
  } catch (_) { /* fonts fall back; the render still draws */ }
  library = await loadSampleLibrary();
  buildPhotoTray();
  cover = applySceneToCover(cover, shotScene);
  if (shotScene.size && SIZES[shotScene.size]) cover.size = shotScene.size;
  cover = dealCover(library, cover);
  history = makeHistory(cover);
  $("inputTitle").value = cover.title;
  $("inputSubtitle").value = cover.subtitle;
  $("inputTagline").value = cover.tagline;

  if (shotScene.mode === "cover") {
    document.body.classList.add("shot-cover");
    const shot = $("shotCanvas");
    shot.width = window.innerWidth;
    shot.height = window.innerHeight;
    renderCover(shot, shot.width, shot.height, { ...cover, photoById: photoIndex() });
    markShotReady();
    return;
  }
  drawPreview();
  markShotReady();
}

// ---------- preview + control sync ----------

function photoIndex() {
  const index = {};
  for (const p of library) index[p.id] = p;
  return index;
}

function drawPreview() {
  const dims = SIZES[cover.size];
  const fit = Math.min(1, 860 / Math.max(dims.w, dims.h));
  const w = Math.round(dims.w * fit);
  const h = Math.round(dims.h * fit);
  if (previewCanvas.width !== w || previewCanvas.height !== h) {
    previewCanvas.width = w;
    previewCanvas.height = h;
  }
  renderCover(previewCanvas, w, h, { ...cover, photoById: photoIndex() }, { fast: !!pointerDrag });
  syncControls();
}

function syncToggleGroup(selector, attr, value) {
  document.querySelectorAll(selector).forEach((btn) => {
    const on = btn.dataset[attr] === value;
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  });
}

function syncControls() {
  $("btnUndo").disabled = !history.canUndo;
  $("btnRedo").disabled = !history.canRedo;
  const panelFrame = cover.frames[selected];
  const count = layoutById(cover.layout).panels(1000, 1000).length;
  $("selectedPanelLabel").textContent = `Panel ${selected + 1} of ${count}`;
  if (panelFrame) {
    $("zoomSlider").value = panelFrame.zoom;
    $("panXSlider").value = panelFrame.panX;
    $("panYSlider").value = panelFrame.panY;
  }
  $("hintLine").textContent =
    `${library.length} photos ready. Drag a panel to reframe it, then Export.`;
  syncToggleGroup("#layoutTiles button", "layout", cover.layout);
  syncToggleGroup("#gradeChips button", "grade", cover.grade);
  syncToggleGroup("#sizeChips button", "size", cover.size);
  $("inkToggle").checked = cover.inkOn;
  $("inkSlider").value = cover.inkStrength;
  $("inkSlider").disabled = !cover.inkOn;
}

// Save a new cover state to history and redraw; preview a change
// without touching history.
function saveChange(updated) {
  cover = updated;
  history.push(cover);
  drawPreview();
}

function previewChange(updated) {
  cover = updated;
  drawPreview();
}

// ---------- photo tray ----------

function buildPhotoTray() {
  const rail = $("photoTray");
  rail.innerHTML = "";
  for (const photo of library) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.photo = photo.id;
    btn.setAttribute("aria-pressed", "false");
    const thumb = document.createElement("img");
    thumb.src = photo.src;
    thumb.alt = photo.label;
    thumb.draggable = false;
    const caption = document.createElement("span");
    caption.textContent = photo.label;
    btn.append(thumb, caption);
    btn.addEventListener("click", () => putPhotoInSelected(photo.id));
    rail.appendChild(btn);
  }
}

function putPhotoInSelected(photoId) {
  const pick = library.find((p) => p.id === photoId);
  if (!pick || !cover.frames[selected]) return;
  const slots = layoutById(cover.layout).panels(1000, 1000);
  const ratio = slots[selected].w / slots[selected].h;
  const framing = savedCrops.has(photoId)
    ? { ...savedCrops.get(photoId), photoId }
    : { ...smartFrame(pick, ratio), photoId };
  const allFrames = cover.frames.slice();
  allFrames[selected] = framing;
  saveChange({ ...cover, frames: allFrames });
}

// ---------- layout tiles, grade/size chips, presets ----------

function buildLayoutTiles() {
  const rail = $("layoutTiles");
  for (const entry of LAYOUTS) {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.dataset.layout = entry.id;
    tile.innerHTML = layoutTileSVG(entry.id) + `<span>${entry.name}</span>`;
    tile.title = entry.blurb;
    tile.addEventListener("click", () => {
      selected = 0;
      saveChange(changeLayout(library, cover, entry.id));
    });
    rail.appendChild(tile);
  }
}

function buildChoiceChips() {
  const gradeRail = $("gradeChips");
  for (const grade of GRADES) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.dataset.grade = grade.id;
    chip.textContent = grade.name;
    chip.addEventListener("click", () => saveChange({ ...cover, grade: grade.id }));
    gradeRail.appendChild(chip);
  }
  const sizeRail = $("sizeChips");
  for (const [id, dims] of Object.entries(SIZES)) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.dataset.size = id;
    chip.textContent = `${dims.w} x ${dims.h}`;
    chip.addEventListener("click", () => saveChange({ ...cover, size: id }));
    sizeRail.appendChild(chip);
  }
  const presetRail = $("presetList");
  for (const preset of PRESETS) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.textContent = preset.name;
    chip.addEventListener("click", () => {
      let updated = { ...cover, ...preset.cover };
      if (preset.cover.layout !== cover.layout) {
        updated = changeLayout(library, updated, preset.cover.layout);
      }
      selected = 0;
      saveChange(updated);
    });
    presetRail.appendChild(chip);
  }
}

// ---------- panel picking + reframing ----------

function clampCrop(frame) {
  frame.zoom = Math.max(1, Math.min(3, frame.zoom));
  frame.panX = Math.max(-1, Math.min(1, frame.panX));
  frame.panY = Math.max(-1, Math.min(1, frame.panY));
  return frame;
}

function panelUnderPoint(clientX, clientY) {
  const box = previewCanvas.getBoundingClientRect();
  const px = ((clientX - box.left) / box.width) * previewCanvas.width;
  const py = ((clientY - box.top) / box.height) * previewCanvas.height;
  const artHeight = previewCanvas.height * ART_FRACTION;
  if (py > artHeight) return -1;
  const slots = layoutById(cover.layout).panels(previewCanvas.width, artHeight);
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const hitX = px >= slot.x * previewCanvas.width && px <= (slot.x + slot.w) * previewCanvas.width;
    const hitY = py >= slot.y * artHeight && py <= (slot.y + slot.h) * artHeight;
    if (hitX && hitY) return i;
  }
  return -1;
}

function setFrame(i, patch, save) {
  const allFrames = cover.frames.slice();
  const updated = clampCrop({ ...allFrames[i], ...patch });
  allFrames[i] = updated;
  savedCrops.set(updated.photoId, { ...updated });
  if (save) saveChange({ ...cover, frames: allFrames });
  else previewChange({ ...cover, frames: allFrames });
}

function resetCrop() {
  const panelFrame = cover.frames[selected];
  if (!panelFrame) return;
  const pick = library.find((p) => p.id === panelFrame.photoId);
  if (!pick) return;
  const slots = layoutById(cover.layout).panels(1000, 1000);
  const ratio = slots[selected].w / slots[selected].h;
  setFrame(selected, { ...smartFrame(pick, ratio), photoId: pick.id }, true);
}

// ---------- wiring ----------

function wireAllControls() {
  previewCanvas.addEventListener("pointerdown", (e) => {
    const idx = panelUnderPoint(e.clientX, e.clientY);
    if (idx < 0) return;
    selected = idx;
    pointerDrag = { panel: idx, x: e.clientX, y: e.clientY };
    previewCanvas.setPointerCapture(e.pointerId);
    drawPreview();
  });

  previewCanvas.addEventListener("pointermove", (e) => {
    if (!pointerDrag) return;
    const box = previewCanvas.getBoundingClientRect();
    const idx = pointerDrag.panel;
    const artHeight = previewCanvas.height * ART_FRACTION;
    const slots = layoutById(cover.layout).panels(previewCanvas.width, artHeight);
    const slot = slots[idx];
    const moveX = ((e.clientX - pointerDrag.x) / box.width) * previewCanvas.width;
    const moveY = ((e.clientY - pointerDrag.y) / box.height) * previewCanvas.height;
    pointerDrag.x = e.clientX;
    pointerDrag.y = e.clientY;
    const panelFrame = cover.frames[idx];
    if (!panelFrame) return;
    setFrame(idx, {
      panX: panelFrame.panX + (moveX / (slot.w * previewCanvas.width)) * 2.2,
      panY: panelFrame.panY + (moveY / (slot.h * artHeight)) * 2.2,
    }, false);
  });

  previewCanvas.addEventListener("pointerup", () => {
    if (!pointerDrag) return;
    pointerDrag = null;
    history.push(cover);
    drawPreview();
  });

  previewCanvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const panelFrame = cover.frames[selected];
    if (!panelFrame) return;
    setFrame(selected, { zoom: panelFrame.zoom * Math.exp(-e.deltaY * 0.0012) }, true);
  }, { passive: false });

  // Sliders: live update while dragging, one history entry on release.
  for (const [id, key] of [["zoomSlider", "zoom"], ["panXSlider", "panX"], ["panYSlider", "panY"]]) {
    listen(id, "input", (e) => {
      const panelFrame = cover.frames[selected];
      if (panelFrame) setFrame(selected, { [key]: Number(e.target.value) }, false);
    });
    listen(id, "change", () => history.push(cover));
  }
  listen("btnResetCrop", "click", resetCrop);

  // Words: live preview while typing, one history entry on change.
  for (const [id, key] of [["inputTitle", "title"], ["inputSubtitle", "subtitle"], ["inputTagline", "tagline"]]) {
    listen(id, "input", (e) => {
      cover = { ...cover, [key]: e.target.value };
      drawPreview();
    });
    listen(id, "change", () => history.push(cover));
  }

  // Ink: toggle commits, slider previews live.
  listen("inkToggle", "change", (e) => saveChange({ ...cover, inkOn: e.target.checked }));
  listen("inkSlider", "input", (e) => previewChange({ ...cover, inkStrength: Number(e.target.value), inkOn: true }));
  listen("inkSlider", "change", () => history.push(cover));

  // Undo / redo, buttons and keys.
  listen("btnUndo", "click", () => {
    const prev = history.undo();
    if (prev) { cover = prev; selected = 0; drawPreview(); }
  });
  listen("btnRedo", "click", () => {
    const next = history.redo();
    if (next) { cover = next; selected = 0; drawPreview(); }
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

  listen("btnExportAll", "click", exportAllSizes);

  // Photos: samples, auto-fill, shuffle, upload.
  listen("btnSamples", "click", () => {
    selected = 0;
    saveChange(dealCover(library, { ...cover, dealStart: 0 }));
  });
  listen("btnAutofill", "click", () => {
    selected = 0;
    saveChange(dealCover(library, { ...cover, dealStart: (cover.dealStart || 0) + 1 }));
  });
  listen("btnShuffle", "click", () => {
    const shuffled = library.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    library = shuffled;
    buildPhotoTray();
    selected = 0;
    saveChange(dealCover(library, cover));
  });
  listen("btnUpload", "click", () => $("fileInput").click());
  listen("fileInput", "change", async (e) => {
    await addUserFiles(e.target.files);
    e.target.value = "";
  });
  $("stage").addEventListener("dragover", (e) => e.preventDefault());
  $("stage").addEventListener("drop", async (e) => {
    e.preventDefault();
    await addUserFiles(e.dataTransfer.files);
  });
  document.addEventListener("paste", async (e) => {
    if (shotScene.mode === "cover") return;
    const files = [...(e.clipboardData?.files || [])];
    if (files.length) await addUserFiles(files);
  });
}

async function addUserFiles(files) {
  const added = await readUserFiles(files);
  if (!added.length) return;
  library = [...library, ...added];
  buildPhotoTray();
  drawPreview();
}

function downloadBlob(blob, name) {
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(href), 5000);
}

async function exportAllSizes() {
  const button = $("btnExportAll");
  button.disabled = true;
  button.textContent = "Exporting…";
  try {
    const state = { ...cover, photoById: photoIndex() };
    for (const id of ["square", "portrait", "wide"]) {
      const png = await exportCoverBlob(state, id);
      const dims = SIZES[id];
      downloadBlob(png, `afterglow-cover-${dims.w}x${dims.h}.png`);
    }
    $("hintLine").textContent = "Exported 3 PNGs — Square 1080 x 1080, Portrait 1080 x 1350, Wide 1920 x 1080.";
  } finally {
    button.disabled = false;
    button.textContent = "Export all 3 sizes";
  }
}

boot();
