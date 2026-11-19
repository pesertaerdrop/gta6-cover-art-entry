// Neon Coast Cover Studio — wires the editor page.
//
// The page holds one cover state and one preview canvas. Every control
// edits the state and redraws the same renderer the PNG export uses, so the
// preview is the export. Dragging on the preview reframes the photo inside
// the panel under the pointer; the panel inspector edits the same crop.

import { drawCover, layoutSlots } from './cover.js';
import { LAYOUTS, GRADES, SIZES, SAMPLES, PRESETS, sizeById } from './presets.js';
import {
  createCoverState,
  remapPanelsForLayout,
  autoFillPanels,
  shuffleCover,
  applyCoverPreset,
  CoverHistory,
} from './state.js';
import { applyShotScene } from './shots.js';

const state = createCoverState();
const history = new CoverHistory(state);

// The photo library: every entry has an id, a label and either a bundled
// sample path or an object URL from an upload. `photos` holds the loaded
// <img> elements by id for the renderer.
const library = SAMPLES.map((s) => ({ ...s, uploaded: false }));
const photos = new Map();
let uploadCount = 0;

const preview = document.getElementById('preview');
const statusEl = document.getElementById('status');
const outlineEl = document.getElementById('panelOutline');

function photoIds() {
  return library.map((p) => p.id);
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

async function loadPhoto(id) {
  if (photos.has(id)) return photos.get(id);
  const entry = library.find((p) => p.id === id);
  if (!entry) return null;
  const img = await loadImage(entry.src);
  photos.set(id, img);
  return img;
}

async function loadAllSamples() {
  await Promise.all(SAMPLES.map((s) => loadPhoto(s.id).catch(() => null)));
}

let redrawQueued = false;
function redraw() {
  if (redrawQueued) return;
  redrawQueued = true;
  requestAnimationFrame(() => {
    redrawQueued = false;
    drawCover(preview, state, photos);
    positionPanelOutline();
  });
}

// Frame every panel on the top of its photo: faces usually sit in the top
// half, and a wide panel crops a tall photo hard. The pan is chosen so the
// visible window starts about 5% down the photo, and clamped so the photo
// never slides out of its panel.
function framePanels() {
  const size = sizeById(state.size);
  const slots = layoutSlots(state.layout, size.w, size.h);
  state.panels.forEach((panel, i) => {
    const img = panel.photoId ? photos.get(panel.photoId) : null;
    const slot = slots[i];
    if (!img || !slot) return;
    const scale = Math.max(slot.w / img.naturalWidth, slot.h / img.naturalHeight);
    const dh = img.naturalHeight * scale;
    const slack = dh - slot.h;
    if (slack <= 0) {
      panel.dy = 0;
      panel.dx = 0;
      return;
    }
    const oy = slack / 2 - 0.05 * dh;
    panel.dy = Math.max(-0.9, Math.min(0.9, oy / slot.h));
    panel.dx = 0;
  });
}

// The white outline around the selected panel, laid over the preview.
function positionPanelOutline() {
  const slots = layoutSlots(state.layout, preview.width, preview.height);
  const slot = slots[state.selected];
  if (!slot) {
    outlineEl.style.display = 'none';
    return;
  }
  outlineEl.style.display = 'block';
  outlineEl.style.left = `${(slot.x / preview.width) * 100}%`;
  outlineEl.style.top = `${(slot.y / preview.height) * 100}%`;
  outlineEl.style.width = `${(slot.w / preview.width) * 100}%`;
  outlineEl.style.height = `${(slot.h / preview.height) * 100}%`;
  outlineEl.style.transform = slot.rot ? `rotate(${slot.rot}deg)` : '';
}

function selectedPanel() {
  return state.panels[state.selected];
}

function setStatus(text) {
  statusEl.textContent = text;
}

// --- pickers ---------------------------------------------------------------

function buildLayoutPicker() {
  const box = document.getElementById('layoutPicker');
  box.textContent = '';
  for (const [id, layout] of Object.entries(LAYOUTS)) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pick';
    btn.dataset.layout = id;
    btn.innerHTML = `<strong>${layout.name}</strong><span>${layout.blurb}</span>`;
    btn.addEventListener('click', () => {
      history.commit();
      state.layout = id;
      remapPanelsForLayout(state, photoIds());
      framePanels();
      syncControls();
      redraw();
    });
    box.appendChild(btn);
  }
}

function buildGradePicker() {
  const box = document.getElementById('gradePicker');
  box.textContent = '';
  for (const [id, grade] of Object.entries(GRADES)) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pick grade-pick';
    btn.dataset.grade = id;
    btn.innerHTML = `<span class="swatch" style="background:${grade.swatch}"></span><strong>${grade.name}</strong>`;
    btn.addEventListener('click', () => {
      history.commit();
      state.grade = id;
      syncControls();
      redraw();
    });
    box.appendChild(btn);
  }
}

function buildPresetPicker() {
  const box = document.getElementById('presetPicker');
  box.textContent = '';
  for (const preset of PRESETS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pick';
    btn.dataset.preset = preset.id;
    btn.innerHTML = `<strong>${preset.name}</strong><span>${preset.title} · ${preset.subtitle}</span>`;
    btn.addEventListener('click', () => {
      history.commit();
      applyCoverPreset(state, preset.id, photoIds());
      framePanels();
      syncControls();
      redraw();
      setStatus(`Preset “${preset.name}” applied.`);
    });
    box.appendChild(btn);
  }
}

function buildPhotoLibrary() {
  const box = document.getElementById('photoLibrary');
  box.textContent = '';
  for (const entry of library) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'thumb';
    btn.dataset.photo = entry.id;
    btn.title = entry.label;
    const img = document.createElement('img');
    img.src = entry.src;
    img.alt = entry.label;
    img.loading = 'lazy';
    const label = document.createElement('span');
    label.textContent = entry.label;
    btn.append(img, label);
    btn.addEventListener('click', async () => {
      await loadPhoto(entry.id);
      history.commit();
      selectedPanel().photoId = entry.id;
      syncControls();
      redraw();
    });
    box.appendChild(btn);
  }
}

function buildSizeSwitch() {
  const box = document.getElementById('sizeSwitch');
  box.textContent = '';
  for (const size of SIZES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.size = size.id;
    btn.textContent = size.label.split('·')[0].trim();
    btn.title = size.label;
    btn.addEventListener('click', () => {
      history.commit();
      state.size = size.id;
      framePanels();
      syncControls();
      redraw();
    });
    box.appendChild(btn);
  }
}

function buildPanelPhotoSelect() {
  const select = document.getElementById('panelPhoto');
  select.textContent = '';
  for (const entry of library) {
    const opt = document.createElement('option');
    opt.value = entry.id;
    opt.textContent = entry.label;
    select.appendChild(opt);
  }
}

// --- controls --------------------------------------------------------------

function syncControls() {
  document.querySelectorAll('#layoutPicker .pick').forEach((b) => {
    b.classList.toggle('active', b.dataset.layout === state.layout);
  });
  document.querySelectorAll('#gradePicker .pick').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === state.grade);
  });
  document.querySelectorAll('#sizeSwitch button').forEach((b) => {
    b.classList.toggle('active', b.dataset.size === state.size);
  });
  document.getElementById('titleInput').value = state.title;
  document.getElementById('subtitleInput').value = state.subtitle;
  document.getElementById('badgeInput').value = state.badge;
  document.getElementById('grainToggle').checked = state.grain;
  document.getElementById('vignetteToggle').checked = state.vignette;
  document.getElementById('halftoneToggle').checked = state.halftone;
  document.getElementById('undoBtn').disabled = !history.canUndo;
  document.getElementById('redoBtn').disabled = !history.canRedo;

  const panel = selectedPanel();
  const select = document.getElementById('panelPhoto');
  if (panel) {
    select.value = panel.photoId ?? '';
    document.getElementById('zoomRange').value = String(panel.zoom ?? 1);
    document.getElementById('offsetXRange').value = String(panel.dx ?? 0);
    document.getElementById('offsetYRange').value = String(panel.dy ?? 0);
    document.getElementById('panelLabel').textContent = `Panel ${state.selected + 1} of ${state.panels.length}`;
  }
  document.querySelectorAll('#photoLibrary .thumb').forEach((t) => {
    t.classList.toggle('in-use', state.panels.some((p) => p.photoId === t.dataset.photo));
  });
}

function bindControls() {
  document.getElementById('titleInput').addEventListener('input', (e) => {
    state.title = e.target.value;
    redraw();
  });
  document.getElementById('titleInput').addEventListener('change', () => history.commit());
  document.getElementById('subtitleInput').addEventListener('input', (e) => {
    state.subtitle = e.target.value;
    redraw();
  });
  document.getElementById('subtitleInput').addEventListener('change', () => history.commit());
  document.getElementById('badgeInput').addEventListener('input', (e) => {
    state.badge = e.target.value;
    redraw();
  });
  document.getElementById('badgeInput').addEventListener('change', () => history.commit());

  document.getElementById('panelPhoto').addEventListener('change', async (e) => {
    await loadPhoto(e.target.value);
    history.commit();
    selectedPanel().photoId = e.target.value;
    syncControls();
    redraw();
  });
  document.getElementById('zoomRange').addEventListener('input', (e) => {
    selectedPanel().zoom = Number(e.target.value);
    redraw();
  });
  document.getElementById('zoomRange').addEventListener('change', () => history.commit());
  document.getElementById('offsetXRange').addEventListener('input', (e) => {
    selectedPanel().dx = Number(e.target.value);
    redraw();
  });
  document.getElementById('offsetXRange').addEventListener('change', () => history.commit());
  document.getElementById('offsetYRange').addEventListener('input', (e) => {
    selectedPanel().dy = Number(e.target.value);
    redraw();
  });
  document.getElementById('offsetYRange').addEventListener('change', () => history.commit());

  document.getElementById('grainToggle').addEventListener('change', (e) => {
    history.commit();
    state.grain = e.target.checked;
    redraw();
  });
  document.getElementById('vignetteToggle').addEventListener('change', (e) => {
    history.commit();
    state.vignette = e.target.checked;
    redraw();
  });
  document.getElementById('halftoneToggle').addEventListener('change', (e) => {
    history.commit();
    state.halftone = e.target.checked;
    redraw();
  });

  document.getElementById('undoBtn').addEventListener('click', () => {
    if (history.undo()) {
      syncControls();
      redraw();
    }
  });
  document.getElementById('redoBtn').addEventListener('click', () => {
    if (history.redo()) {
      syncControls();
      redraw();
    }
  });
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      e.preventDefault();
      if (history.undo()) {
        syncControls();
        redraw();
      }
    }
    if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
      e.preventDefault();
      if (history.redo()) {
        syncControls();
        redraw();
      }
    }
  });

  document.getElementById('autoFillBtn').addEventListener('click', () => {
    history.commit();
    autoFillPanels(state, photoIds());
    framePanels();
    syncControls();
    redraw();
    setStatus('Panels filled from your photos.');
  });
  document.getElementById('shuffleBtn').addEventListener('click', () => {
    history.commit();
    shuffleCover(state, photoIds());
    syncControls();
    redraw();
    setStatus('Shuffled — new layout, grade and crops.');
  });

  document.getElementById('uploadPhotos').addEventListener('change', async (e) => {
    const files = [...e.target.files];
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      uploadCount += 1;
      const id = `upload-${uploadCount}`;
      const src = URL.createObjectURL(file);
      library.push({ id, label: file.name.replace(/\.[^.]+$/, '').slice(0, 18) || `Upload ${uploadCount}`, src, uploaded: true });
      await loadPhoto(id);
    }
    buildPhotoLibrary();
    buildPanelPhotoSelect();
    history.commit();
    autoFillPanels(state, photoIds());
    framePanels();
    syncControls();
    redraw();
    setStatus(`${files.length} photo${files.length === 1 ? '' : 's'} added — photos never leave this machine.`);
    e.target.value = '';
  });

  document.getElementById('exportBtn').addEventListener('click', () => exportCover(state.size));
  document.getElementById('exportAllBtn').addEventListener('click', exportAllSizes);
}

// --- drag to reframe -------------------------------------------------------

function canvasPoint(event) {
  const rect = preview.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * preview.width,
    y: ((event.clientY - rect.top) / rect.height) * preview.height,
  };
}

function hitPanel(point) {
  const slots = layoutSlots(state.layout, preview.width, preview.height);
  for (let i = slots.length - 1; i >= 0; i -= 1) {
    const s = slots[i];
    if (point.x >= s.x && point.x <= s.x + s.w && point.y >= s.y && point.y <= s.y + s.h) return i;
  }
  return -1;
}

function bindPreviewDrag() {
  let dragging = false;
  let last = null;
  let committed = false;
  preview.addEventListener('pointerdown', (e) => {
    const point = canvasPoint(e);
    const hit = hitPanel(point);
    if (hit === -1) return;
    state.selected = hit;
    syncControls();
    dragging = true;
    last = point;
    committed = false;
    preview.setPointerCapture(e.pointerId);
  });
  preview.addEventListener('pointermove', (e) => {
    if (!dragging || !last) return;
    const point = canvasPoint(e);
    const slots = layoutSlots(state.layout, preview.width, preview.height);
    const slot = slots[state.selected];
    if (!slot) return;
    if (!committed) {
      history.commit();
      committed = true;
    }
    const panel = selectedPanel();
    panel.dx += (point.x - last.x) / slot.w;
    panel.dy += (point.y - last.y) / slot.h;
    panel.dx = Math.max(-1, Math.min(1, panel.dx));
    panel.dy = Math.max(-1, Math.min(1, panel.dy));
    last = point;
    syncControls();
    redraw();
  });
  const endDrag = () => {
    dragging = false;
    last = null;
  };
  preview.addEventListener('pointerup', endDrag);
  preview.addEventListener('pointercancel', endDrag);
}

// --- export ----------------------------------------------------------------

function renderOffscreen(sizeId) {
  const size = sizeById(sizeId);
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  drawCover(canvas, { ...state, size: sizeId }, photos);
  return canvas;
}

function downloadCanvas(canvas, filename) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      resolve(blob);
    }, 'image/png');
  });
}

async function exportCover(sizeId) {
  const size = sizeById(sizeId);
  const canvas = renderOffscreen(sizeId);
  await downloadCanvas(canvas, `neon-coast-${size.id}.png`);
  setStatus(`Saved neon-coast-${size.id}.png (${size.w} × ${size.h}).`);
}

async function exportAllSizes() {
  for (const size of SIZES) {
    await exportCover(size.id);
    await new Promise((r) => setTimeout(r, 400));
  }
  setStatus('Saved all three sizes — square, portrait and wide.');
}

// Test hook for the screenshot script: renders one size and returns a PNG
// data URL, so the exported file can be checked without a download dialog.
async function exportPNGDataURL(sizeId) {
  const canvas = renderOffscreen(sizeId);
  return canvas.toDataURL('image/png');
}

// --- boot ------------------------------------------------------------------

const app = {
  state,
  photos,
  loadPhoto,
  redraw,
  framePanels,
  exportPNGDataURL,
};
window.__coverApp = app;

buildLayoutPicker();
buildGradePicker();
buildPresetPicker();
buildPhotoLibrary();
buildPanelPhotoSelect();
buildSizeSwitch();
bindControls();
bindPreviewDrag();
syncControls();

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  await loadAllSamples();
  try {
    await document.fonts.load('80px Anton');
    await document.fonts.load('40px Pacifico');
  } catch {
    // Fall back to system fonts if the vendored ones fail to load.
  }
  await applyShotScene(app, new URLSearchParams(location.search));
} else {
  redraw();
  loadAllSamples().then(() => {
    framePanels();
    syncControls();
    redraw();
  });
  document.fonts.ready.then(redraw);
}
