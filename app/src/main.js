// main.js — the editor wiring: state, preview, tray, layout rail,
// presets, grades, ink, undo/redo, and the PNG exports. Everything the
// user sees is drawn by render.js; this file only moves state around
// and asks for a re-render. In ?shot= mode the editor chrome is hidden
// and one cover is drawn full-bleed for the screenshot tooling.

import { createState, assignPhotos, setLayout, swapPanelPhoto, createHistory, snapshot, defaultCrop } from './state.js';
import { loadSamples, filesToPhotos, hydrateUpload } from './photos.js';
import { LAYOUTS, layoutById, panelsFor } from './layouts.js';
import { GRADES, gradeById } from './grades.js';
import { PRESETS, presetById, applyPreset } from './presets.js';
import { renderToCanvas, renderCover, EXPORT_SIZES } from './render.js';
import { shotFromUrl, applyShotScene } from './shots.js';
import { cropWindow } from './render.js';

const $ = (sel) => document.querySelector(sel);

let library = [];
let state = createState();
let history = createHistory(state);
let previewSize = EXPORT_SIZES[2]; // wide, by default
let dragging = null;

function photoById(id) {
  return library.find((p) => p.id === id);
}

/** Re-render the preview canvas from the current state. */
function renderPreview() {
  const canvas = $('#preview');
  if (!canvas) return;
  const w = previewSize.w;
  const h = previewSize.h;
  const scale = Math.min(920 / w, 560 / h);
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d');
  renderCover(ctx, canvas.width, canvas.height, state, library);
  drawSelection(ctx, canvas.width, canvas.height);
}

/** Outline the selected panel so the user sees what they are editing. */
function drawSelection(ctx, W, H) {
  const bandH = Math.round(H * 0.26);
  const artH = H - bandH;
  const rects = panelsFor(state.layout, W, artH);
  const r = rects[state.selected];
  if (!r) return;
  ctx.save();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = Math.max(2, W * 0.004);
  ctx.setLineDash([Math.max(6, W * 0.008), Math.max(4, W * 0.005)]);
  ctx.strokeRect(r.x * W + 2, r.y * artH + 2, r.w * W - 4, r.h * artH - 4);
  ctx.restore();
}

/** Commit a new state snapshot to the history and re-render. */
function commit(next) {
  history.commit(next);
  state = history.current;
  renderPreview();
  syncControls();
}

/** Refresh every control to match the current state. */
function syncControls() {
  const titleEl = $('#title-input');
  if (titleEl && titleEl.value !== state.title) titleEl.value = state.title;
  const subEl = $('#subtitle-input');
  if (subEl && subEl.value !== state.subtitle) subEl.value = state.subtitle;
  const tagEl = $('#tagline-input');
  if (tagEl && tagEl.value !== state.tagline) tagEl.value = state.tagline;
  const zoomEl = $('#zoom-slider');
  const panel = state.panels[state.selected];
  if (zoomEl && panel) zoomEl.value = panel.zoom;
  const inkEl = $('#ink-slider');
  if (inkEl) inkEl.value = state.ink.strength;
  const inkToggle = $('#ink-toggle');
  if (inkToggle) inkToggle.checked = state.ink.on;
  document.querySelectorAll('[data-layout]').forEach((b) => {
    b.classList.toggle('active', b.dataset.layout === state.layout);
  });
  document.querySelectorAll('[data-preset]').forEach((b) => {
    b.classList.toggle('active', false);
  });
  document.querySelectorAll('[data-grade]').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === state.grade);
  });
  document.querySelectorAll('[data-size]').forEach((b) => {
    b.classList.toggle('active', b.dataset.size === previewSize.id);
  });
  const undoBtn = $('#undo-btn');
  if (undoBtn) undoBtn.disabled = !history.canUndo();
  const redoBtn = $('#redo-btn');
  if (redoBtn) redoBtn.disabled = !history.canRedo();
}

/** Build the photo tray: 14 samples plus the upload tile. */
function buildTray() {
  const tray = $('#tray');
  if (!tray) return;
  tray.innerHTML = '';
  for (const photo of library) {
    const btn = document.createElement('button');
    btn.className = 'tray-item';
    btn.type = 'button';
    btn.title = photo.label;
    const img = document.createElement('img');
    img.src = photo.src;
    img.alt = photo.label;
    img.loading = 'lazy';
    btn.appendChild(img);
    const cap = document.createElement('span');
    cap.textContent = photo.label;
    btn.appendChild(cap);
    btn.addEventListener('click', () => {
      const next = snapshot(state);
      if (next.layout === 'strip') {
        // Strip Five slices one photo: picking a tray photo picks the
        // photo the five strips are cut from.
        next.leadPhotoId = photo.id;
        assignPhotos(next, library);
      } else {
        swapPanelPhoto(next, next.selected, photo.id);
      }
      commit(next);
    });
    tray.appendChild(btn);
  }
  const up = document.createElement('label');
  up.className = 'tray-item tray-upload';
  up.innerHTML = '<span class="plus">+</span><span>Add photo</span>';
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.multiple = true;
  input.hidden = true;
  input.addEventListener('change', async () => {
    const recs = filesToPhotos(input.files);
    for (const rec of recs) {
      try {
        await hydrateUpload(rec);
        library.push(rec);
      } catch {
        // a broken file is skipped, the rest still load
      }
    }
    buildTray();
    const next = snapshot(state);
    assignPhotos(next, library);
    commit(next);
  });
  up.appendChild(input);
  tray.appendChild(up);
}

/** Build the layout rail: one mini-drawing tile per layout. */
function buildLayoutRail() {
  const rail = $('#layout-rail');
  if (!rail) return;
  rail.innerHTML = '';
  for (const layout of LAYOUTS) {
    const btn = document.createElement('button');
    btn.className = 'layout-tile';
    btn.type = 'button';
    btn.dataset.layout = layout.id;
    btn.innerHTML = `<svg viewBox="0 0 38 38" aria-hidden="true">${layout.tile}</svg><span>${layout.name}</span><small>${layout.blurb}</small>`;
    btn.addEventListener('click', () => {
      const next = snapshot(state);
      setLayout(next, layout.id, library);
      commit(next);
    });
    rail.appendChild(btn);
  }
}

/** Build the preset and grade rows. */
function buildRows() {
  const presetRow = $('#preset-row');
  if (presetRow) {
    presetRow.innerHTML = '';
    for (const preset of PRESETS) {
      const btn = document.createElement('button');
      btn.className = 'chip';
      btn.type = 'button';
      btn.dataset.preset = preset.id;
      btn.textContent = preset.name;
      btn.addEventListener('click', () => {
        const next = snapshot(state);
        applyPreset(next, presetById(preset.id));
        assignPhotos(next, library);
        commit(next);
      });
      presetRow.appendChild(btn);
    }
  }
  const gradeRow = $('#grade-row');
  if (gradeRow) {
    gradeRow.innerHTML = '';
    for (const grade of GRADES) {
      const btn = document.createElement('button');
      btn.className = 'chip';
      btn.type = 'button';
      btn.dataset.grade = grade.id;
      btn.textContent = grade.name;
      btn.addEventListener('click', () => {
        const next = snapshot(state);
        next.grade = grade.id;
        commit(next);
      });
      gradeRow.appendChild(btn);
    }
  }
}

/** Download one canvas as a PNG file. */
function downloadCanvas(canvas, filename) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }, 'image/png');
}

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cover';
}

/** Export the current cover in all three sizes, one PNG each. */
function exportAll() {
  const base = slug(state.title);
  for (const size of EXPORT_SIZES) {
    const canvas = renderToCanvas(size.w, size.h, state, library);
    downloadCanvas(canvas, `${base}-${size.id}-${size.w}x${size.h}.png`);
  }
}

/** Which panel (if any) sits under a point on the preview canvas. */
function panelAt(clientX, clientY) {
  const canvas = $('#preview');
  const rect = canvas.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width);
  const y = ((clientY - rect.top) / rect.height);
  const bandH = 0.26;
  if (y > 1 - bandH) return -1;
  const artH = 1 - bandH;
  const rects = panelsFor(state.layout, canvas.width, canvas.height * artH);
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    if (x >= r.x && x <= r.x + r.w && (y / artH) >= r.y && (y / artH) <= r.y + r.h) return i;
  }
  return -1;
}

function bindPreview() {
  const canvas = $('#preview');
  if (!canvas) return;
  canvas.addEventListener('pointerdown', (e) => {
    const i = panelAt(e.clientX, e.clientY);
    if (i < 0) return;
    const next = snapshot(state);
    next.selected = i;
    commit(next);
    dragging = { x: e.clientX, y: e.clientY, index: i };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const panel = state.panels[dragging.index];
    if (!panel) return;
    const photo = photoById(panel.photoId);
    if (!photo || !photo.img) return;
    const rect = canvas.getBoundingClientRect();
    const bandH = Math.round(rect.height * 0.26);
    const artH = rect.height - bandH;
    const rects = panelsFor(state.layout, rect.width, artH);
    const r = rects[dragging.index];
    if (!r) return;
    const pw = r.w * rect.width;
    const ph = r.h * artH;
    const win = cropWindow(photo.img, pw, ph, panel);
    const scale = pw / win.sw;
    const next = snapshot(state);
    const p = next.panels[dragging.index];
    p.x = Math.min(1, Math.max(0, p.x - (e.clientX - dragging.x) / scale / photo.img.naturalWidth));
    p.y = Math.min(1, Math.max(0, p.y - (e.clientY - dragging.y) / scale / photo.img.naturalHeight));
    dragging.x = e.clientX;
    dragging.y = e.clientY;
    state = next;
    renderPreview();
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = null;
    history.commit(state);
    syncControls();
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
}

function bindControls() {
  const titleEl = $('#title-input');
  if (titleEl) titleEl.addEventListener('input', () => {
    const next = snapshot(state);
    next.title = titleEl.value.toUpperCase().slice(0, 18);
    state = next;
    renderPreview();
  });
  const subEl = $('#subtitle-input');
  if (subEl) subEl.addEventListener('input', () => {
    const next = snapshot(state);
    next.subtitle = subEl.value.toLowerCase().slice(0, 32);
    state = next;
    renderPreview();
  });
  const tagEl = $('#tagline-input');
  if (tagEl) tagEl.addEventListener('input', () => {
    const next = snapshot(state);
    next.tagline = tagEl.value.toUpperCase().slice(0, 40);
    state = next;
    renderPreview();
  });
  const zoomEl = $('#zoom-slider');
  if (zoomEl) zoomEl.addEventListener('input', () => {
    const next = snapshot(state);
    const p = next.panels[next.selected];
    if (p) p.zoom = parseFloat(zoomEl.value);
    state = next;
    renderPreview();
  });
  const inkEl = $('#ink-slider');
  if (inkEl) inkEl.addEventListener('input', () => {
    const next = snapshot(state);
    next.ink.strength = parseFloat(inkEl.value);
    state = next;
    renderPreview();
  });
  const inkToggle = $('#ink-toggle');
  if (inkToggle) inkToggle.addEventListener('change', () => {
    const next = snapshot(state);
    next.ink.on = inkToggle.checked;
    commit(next);
  });
  const undoBtn = $('#undo-btn');
  if (undoBtn) undoBtn.addEventListener('click', () => {
    const prev = history.undo();
    if (prev) {
      state = prev;
      renderPreview();
      syncControls();
    }
  });
  const redoBtn = $('#redo-btn');
  if (redoBtn) redoBtn.addEventListener('click', () => {
    const next = history.redo();
    if (next) {
      state = next;
      renderPreview();
      syncControls();
    }
  });
  const exportBtn = $('#export-all-btn');
  if (exportBtn) exportBtn.addEventListener('click', exportAll);
  const exportOne = $('#export-one-btn');
  if (exportOne) exportOne.addEventListener('click', () => {
    const canvas = renderToCanvas(previewSize.w, previewSize.h, state, library);
    downloadCanvas(canvas, `${slug(state.title)}-${previewSize.id}-${previewSize.w}x${previewSize.h}.png`);
  });
  document.querySelectorAll('[data-size]').forEach((b) => {
    b.addEventListener('click', () => {
      previewSize = EXPORT_SIZES.find((s) => s.id === b.dataset.size) || previewSize;
      renderPreview();
      syncControls();
    });
  });
  document.querySelectorAll('[data-shuffle]').forEach((b) => {
    b.addEventListener('click', () => {
      const next = snapshot(state);
      const shuffled = [...library].sort(() => Math.random() - 0.5);
      assignPhotos(next, shuffled);
      commit(next);
    });
  });
}

/** Draw one cover full-bleed for a ?shot= scene, then signal readiness.
 * A scene with mode 'editor' instead shows the real editor with that
 * preset applied, so the screenshot proves the app at work. */
async function runShot(shotName) {
  const scene = applyShotScene(state, shotName);
  if (!scene) return;
  assignPhotos(state, library);
  await document.fonts.ready;
  if (scene.mode === 'editor') {
    buildTray();
    buildLayoutRail();
    buildRows();
    bindPreview();
    bindControls();
    try {
      await document.fonts.load('100px Anton');
      await document.fonts.load('100px "Kaushan Script"');
      await document.fonts.load('100px "Bebas Neue"');
    } catch {
      // canvas falls back to system fonts; the layout still renders
    }
    renderPreview();
    syncControls();
    window.__shotReady = true;
    return;
  }
  document.body.classList.add('shot-mode');
  const canvas = document.createElement('canvas');
  canvas.id = 'shot-canvas';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  renderCover(canvas.getContext('2d'), canvas.width, canvas.height, state, library);
  window.__shotReady = true;
}

async function init() {
  library = await loadSamples();
  assignPhotos(state, library);
  history = createHistory(state);
  const shot = shotFromUrl();
  if (shot) {
    await runShot(shot);
    return;
  }
  buildTray();
  buildLayoutRail();
  buildRows();
  bindPreview();
  bindControls();
  try {
    await document.fonts.load('100px Anton');
    await document.fonts.load('100px "Kaushan Script"');
    await document.fonts.load('100px "Bebas Neue"');
  } catch {
    // canvas falls back to system fonts; the layout still renders
  }
  renderPreview();
  syncControls();
}

init();
