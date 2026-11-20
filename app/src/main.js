// main.js — the editor. It loads the samples, owns the undo history,
// draws the live preview, and wires every control. The editor is three
// numbered steps — 1 add photos, 2 pick a layout, 3 export — and one
// big pink EXPORT PNG button that writes the cover at its exact size.
//
// Whole faces: Strip Five keeps its faces whole by construction. The
// dividers in state.stripDividers come from faces.js (the whole-face
// search first, face-aware dividers as the fallback), and the renderer
// clamps each strip's window onto its face span, so a dragged focus
// point cannot push a cheek or an ear out of its strip. A chip in the
// layout row reports which rule is in force for the current photo —
// "Faces whole in every strip" when the guarantee holds, "Faces kept,
// window narrow" when it falls back — so the editor never claims a
// guarantee it did not keep.

import { loadSamples, filesToPhotos, hydrateUpload } from './photos.js';
import { createState, assignPhotos, setLayout, swapPanelPhoto, createHistory } from './state.js';
import { renderToCanvas, EXPORT_SIZES, panelWindow } from './render.js';
import { layoutById, panelsFor, LAYOUTS } from './layouts.js';
import { GRADES } from './grades.js';
import { PRESETS, presetById, applyPreset } from './presets.js';

const $ = (id) => document.getElementById(id);
const PREVIEW_W = 480;

let library = [];
let state = createState();
let history = createHistory(state);
let selectedSize = 'wide';
let autoFillOn = true;
let lastSnapshot = JSON.stringify(state);

// Record the state in the undo history, once per change.
function noteChange() {
  const s = JSON.stringify(state);
  if (s === lastSnapshot) return;
  history.commit(state);
  lastSnapshot = s;
}

function restoreSnapshot(snap) {
  state = snap;
  lastSnapshot = JSON.stringify(state);
  renderAll();
  refreshUndoRedo();
}

function photoById(id) {
  return library.find((p) => p.id === id);
}

function sizeFor() {
  return EXPORT_SIZES.find((s) => s.id === selectedSize) || EXPORT_SIZES[2];
}

// Paint the preview canvas at the chosen export size, scaled to the
// preview width. The preview shows the same pixels an export writes.
function drawPreview() {
  const canvas = $('preview');
  const size = sizeFor();
  const h = Math.round((PREVIEW_W * size.h) / size.w);
  canvas.width = PREVIEW_W;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const rendered = renderToCanvas(size.w, size.h, state, library);
  ctx.drawImage(rendered, 0, 0, PREVIEW_W, h);
  canvas.dataset.w = size.w;
  canvas.dataset.h = size.h;
}

// The chip that reports Strip Five's face rule for the current photo.
function renderStripChip() {
  const chip = $('stripChip');
  if (state.layout !== 'strip') {
    chip.hidden = true;
    return;
  }
  chip.hidden = false;
  if (state.stripWholeFace) {
    chip.textContent = 'Faces whole in every strip';
    chip.className = 'strip-chip ok';
  } else {
    chip.textContent = 'Faces kept, window narrow';
    chip.className = 'strip-chip warn';
  }
}

function currentPresetId() {
  const p = PRESETS.find(
    (x) =>
      x.layout === state.layout &&
      x.grade === state.grade &&
      x.title === state.title &&
      x.subtitle === state.subtitle &&
      x.tagline === state.tagline &&
      x.ink.on === state.ink.on &&
      x.ink.strength === state.ink.strength,
  );
  return p ? p.id : null;
}

function renderTray() {
  const tray = $('tray');
  tray.innerHTML = '';
  library.forEach((photo) => {
    const item = document.createElement('button');
    item.className = 'tray-item';
    item.type = 'button';
    item.title = photo.label;
    const img = document.createElement('img');
    img.src = photo.src;
    img.alt = photo.label;
    img.draggable = false;
    item.appendChild(img);
    const label = document.createElement('span');
    label.textContent = photo.label;
    item.appendChild(label);
    item.addEventListener('click', () => {
      swapPanelPhoto(state, state.selected, photo.id);
      if (state.layout === 'strip') state.leadPhotoId = photo.id;
      assignPhotos(state, library);
      noteChange();
      renderAll();
    });
    tray.appendChild(item);
  });
}

function renderPanelChips() {
  const row = $('panelRow');
  row.innerHTML = '';
  state.panels.forEach((panel, i) => {
    const photo = photoById(panel.photoId);
    const chip = document.createElement('button');
    chip.className = `panel-chip${i === state.selected ? ' active' : ''}`;
    chip.type = 'button';
    chip.textContent = photo ? photo.label : `Panel ${i + 1}`;
    chip.addEventListener('click', () => {
      state.selected = i;
      renderAll();
    });
    row.appendChild(chip);
  });
  const hint = $('panelHint');
  const panel = state.panels[state.selected];
  if (state.layout === 'strip' && panel && panel.slice) {
    hint.textContent = 'Drag on the preview to pan this slice. Faces stay whole — the strip never cuts a face.';
  } else if (panel) {
    hint.textContent = 'Drag on the preview to reframe this panel. Scroll or pinch to zoom.';
  } else {
    hint.textContent = '';
  }
}

function refreshUndoRedo() {
  $('undoBtn').disabled = !history.canUndo();
  $('redoBtn').disabled = !history.canRedo();
}

function renderAll() {
  drawPreview();
  renderTray();
  renderPanelChips();
  renderStripChip();
  $('titleInput').value = state.title;
  $('subtitleInput').value = state.subtitle;
  $('taglineInput').value = state.tagline;
  $('gradeRow').querySelectorAll('.chip').forEach((c) => {
    c.classList.toggle('active', c.dataset.grade === state.grade);
  });
  $('inkToggle').checked = state.ink.on;
  $('inkSlider').value = Math.round(state.ink.strength * 100);
  $('inkValue').textContent = `${Math.round(state.ink.strength * 100)}%`;
  $('layoutRow').querySelectorAll('.tile').forEach((t) => {
    t.classList.toggle('active', t.dataset.layout === state.layout);
  });
  $('presetRow').querySelectorAll('.chip').forEach((c) => {
    c.classList.toggle('active', c.dataset.preset === currentPresetId());
  });
  document.querySelectorAll('.size-chip').forEach((c) => {
    c.classList.toggle('active', c.dataset.size === selectedSize);
  });
  refreshUndoRedo();
  $('autoFill').checked = autoFillOn;
}

// Download one rendered cover as a PNG at its exact export size.
function exportOne(size) {
  const canvas = renderToCanvas(size.w, size.h, state, library);
  const a = document.createElement('a');
  const slug = state.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cover';
  a.download = `${slug}-${size.id}-${size.w}x${size.h}.png`;
  a.href = canvas.toDataURL('image/png');
  a.click();
}

// Re-deal the library into the panels, keeping each photo's own crop.
function shufflePhotos() {
  const photos = [...library];
  for (let i = photos.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [photos[i], photos[j]] = [photos[j], photos[i]];
  }
  assignPhotos(state, photos);
  noteChange();
  renderAll();
}

function autoFill() {
  if (!autoFillOn) return;
  assignPhotos(state, library);
  noteChange();
  renderAll();
}

// Drag-to-reframe on the preview: a pointer move turns into a
// photo-space pan through the panel's window scale. For a strip panel
// the focus moves inside its slice; for a normal panel the crop pans.
function wirePreviewDrag() {
  const canvas = $('preview');
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const panel = state.panels[state.selected];
    if (!panel) return;
    const photo = photoById(panel.photoId);
    if (!photo || !photo.img) return;
    // A pointer move in CSS pixels becomes cover pixels through the
    // canvas scale; the panel's window scale (cover pixels per photo
    // pixel) turns that into photo pixels. Dragging left shows more of
    // the photo's right side, so the focus moves the other way.
    const size = sizeFor();
    const rect = canvas.getBoundingClientRect();
    const dxCover = (e.clientX - lastX) * (size.w / rect.width);
    const dyCover = (e.clientY - lastY) * (size.h / rect.height);
    lastX = e.clientX;
    lastY = e.clientY;
    const rects = panelsFor(state.layout, size.w, Math.round(size.h * 0.74), state.stripDividers);
    const r = rects[state.selected];
    if (!r) return;
    const win = panelWindow(photo, r.w * size.w, r.h * size.h * 0.74, panel);
    const dPx = dxCover / win.scale;
    const dPy = dyCover / win.scale;
    if (panel.slice) {
      panel.slice.fx = Math.min(
        Math.max(panel.slice.fx - dPx / photo.img.naturalWidth, panel.slice.x0 + 0.02),
        panel.slice.x1 - 0.02,
      );
    } else {
      panel.x = Math.min(Math.max((panel.x ?? 0.5) - dPx / photo.img.naturalWidth, 0), 1);
      panel.y = Math.min(Math.max((panel.y ?? 0.32) - dPy / photo.img.naturalHeight, 0), 1);
    }
    drawPreview();
  });
  canvas.addEventListener('pointerup', () => {
    if (!dragging) return;
    dragging = false;
    noteChange();
    renderAll();
  });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const panel = state.panels[state.selected];
    if (!panel) return;
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    panel.zoom = Math.min(Math.max((panel.zoom || 1) * factor, 1), 4);
    noteChange();
    renderAll();
  }, { passive: false });
}

function wireControls() {
  document.querySelectorAll('.size-chip').forEach((c) => {
    c.addEventListener('click', () => {
      selectedSize = c.dataset.size;
      renderAll();
    });
  });
  $('layoutRow').querySelectorAll('.tile').forEach((t) => {
    t.addEventListener('click', () => {
      setLayout(state, t.dataset.layout, library);
      noteChange();
      renderAll();
    });
  });
  $('gradeRow').querySelectorAll('.chip').forEach((c) => {
    c.addEventListener('click', () => {
      state.grade = c.dataset.grade;
      noteChange();
      renderAll();
    });
  });
  $('presetRow').querySelectorAll('.chip').forEach((c) => {
    c.addEventListener('click', () => {
      applyPreset(state, c.dataset.preset);
      assignPhotos(state, library);
      noteChange();
      renderAll();
    });
  });
  $('titleInput').addEventListener('input', (e) => {
    state.title = e.target.value.toUpperCase().slice(0, 18);
    drawPreview();
  });
  $('titleInput').addEventListener('change', () => {
    noteChange();
    renderAll();
  });
  $('subtitleInput').addEventListener('input', (e) => {
    state.subtitle = e.target.value.slice(0, 40);
    drawPreview();
  });
  $('subtitleInput').addEventListener('change', () => {
    noteChange();
    renderAll();
  });
  $('taglineInput').addEventListener('input', (e) => {
    state.tagline = e.target.value.toUpperCase().slice(0, 40);
    drawPreview();
  });
  $('taglineInput').addEventListener('change', () => {
    noteChange();
    renderAll();
  });
  $('inkToggle').addEventListener('change', (e) => {
    state.ink.on = e.target.checked;
    noteChange();
    renderAll();
  });
  $('inkSlider').addEventListener('input', (e) => {
    state.ink.strength = Number(e.target.value) / 100;
    $('inkValue').textContent = `${e.target.value}%`;
    drawPreview();
  });
  $('inkSlider').addEventListener('change', () => {
    noteChange();
    renderAll();
  });
  $('undoBtn').addEventListener('click', () => {
    const snap = history.undo();
    if (snap) restoreSnapshot(snap);
  });
  $('redoBtn').addEventListener('click', () => {
    const snap = history.redo();
    if (snap) restoreSnapshot(snap);
  });
  $('shuffleBtn').addEventListener('click', shufflePhotos);
  $('autoFill').addEventListener('change', (e) => {
    autoFillOn = e.target.checked;
    if (autoFillOn) autoFill();
    else renderAll();
  });
  $('exportBtn').addEventListener('click', () => {
    exportOne(sizeFor());
  });
  $('exportAllBtn').addEventListener('click', () => {
    EXPORT_SIZES.forEach((size, i) => {
      setTimeout(() => exportOne(size), i * 250);
    });
  });
  $('uploadBtn').addEventListener('click', () => $('fileInput').click());
  $('fileInput').addEventListener('change', async (e) => {
    const added = filesToPhotos([...e.target.files]);
    for (const p of added) {
      try {
        await hydrateUpload(p);
        library.push(p);
      } catch {
        // A file that is not a readable image is skipped, not fatal.
      }
    }
    e.target.value = '';
    autoFill();
    renderAll();
  });
  $('leadPhoto').addEventListener('change', (e) => {
    state.leadPhotoId = e.target.value || null;
    assignPhotos(state, library);
    noteChange();
    renderAll();
  });
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      e.preventDefault();
      const snap = history.undo();
      if (snap) restoreSnapshot(snap);
    } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
      e.preventDefault();
      const snap = history.redo();
      if (snap) restoreSnapshot(snap);
    }
  });
}

function buildLayoutTiles() {
  const row = $('layoutRow');
  row.innerHTML = '';
  LAYOUTS.forEach((layout) => {
    const tile = document.createElement('button');
    tile.className = 'tile';
    tile.type = 'button';
    tile.dataset.layout = layout.id;
    tile.innerHTML = `<svg viewBox="0 0 38 38" aria-hidden="true">${layout.tile}</svg><span class="tile-name">${layout.name}</span><span class="tile-blurb">${layout.blurb}</span>`;
    row.appendChild(tile);
  });
}

function buildGradeChips() {
  const row = $('gradeRow');
  row.innerHTML = '';
  GRADES.forEach((grade) => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.type = 'button';
    chip.dataset.grade = grade.id;
    chip.textContent = grade.name;
    row.appendChild(chip);
  });
}

function buildPresetChips() {
  const row = $('presetRow');
  row.innerHTML = '';
  PRESETS.forEach((preset) => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.type = 'button';
    chip.dataset.preset = preset.id;
    chip.textContent = preset.name;
    row.appendChild(chip);
  });
}

function buildLeadSelect() {
  const sel = $('leadPhoto');
  sel.innerHTML = '';
  const auto = document.createElement('option');
  auto.value = '';
  auto.textContent = 'First photo';
  sel.appendChild(auto);
  library.forEach((p) => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.label;
    sel.appendChild(opt);
  });
  sel.value = state.leadPhotoId || '';
}

async function init() {
  buildLayoutTiles();
  buildGradeChips();
  buildPresetChips();
  library = await loadSamples();
  if (library.length === 0) {
    $('status').textContent = 'No sample photos loaded — add your own photos to begin.';
  }
  assignPhotos(state, library);
  buildLeadSelect();
  wireControls();
  wirePreviewDrag();
  renderAll();
  document.fonts.ready.then(() => drawPreview());
}

init();
