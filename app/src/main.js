// Editor wiring: loads the photos, builds the rails, and turns every
// control into a state change. Nothing here draws a cover — that is
// cover.js's job. Every content change goes through commit(), which pushes
// one undo step and repaints the preview.

import { createCoverState, createHistory, historyPush, historyUndo, historyRedo, historyCanUndo, historyCanRedo, SIZES, SIZE_IDS } from './state.js';
import { layoutById, LAYOUTS } from './layouts.js';
import { gradeById, GRADES } from './grades.js';
import { drawCover, exportPNGDataURL, smartFrame } from './cover.js';
import { SAMPLE_POOL, PRESETS, presetByName, autoFillDistinct, shuffleDistinct, panelsForPhotos } from './presets.js';
import { runShotScene } from './shots.js';

const $ = (id) => document.getElementById(id);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

const state = createCoverState();
const history = createHistory();
const images = new Map();
let uploadCount = 0;
let renderQueued = false;
let gesturePushed = false;

const preview = $('preview');

function panelRectsPx() {
  const size = SIZES[state.sizeId];
  const layout = layoutById(state.layoutId);
  const photoH = layout.titleOverlay ? preview.height : preview.height * 0.8;
  return layout.panels().map((p) => ({
    x: p.x * preview.width,
    y: p.y * preview.height * (photoH / preview.height),
    w: p.w * preview.width,
    h: p.h * photoH,
    rot: p.rot,
  }));
}

function scheduleRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    renderPreview();
  });
}

function renderPreview() {
  const size = SIZES[state.sizeId];
  preview.width = Math.round(size.w / 2);
  preview.height = Math.round(size.h / 2);
  drawCover(preview, state, images);
  syncChrome();
}

function commit() {
  historyPush(history, state);
  scheduleRender();
}

function beginGesture() {
  if (!gesturePushed) {
    historyPush(history, state);
    gesturePushed = true;
  }
}

function endGesture() {
  gesturePushed = false;
  scheduleRender();
}

function syncChrome() {
  $('undoBtn').disabled = !historyCanUndo(history);
  $('redoBtn').disabled = !historyCanRedo(history);
  const size = SIZES[state.sizeId];
  const layout = layoutById(state.layoutId);
  const grade = gradeById(state.gradeId);
  $('sizeText').innerHTML = `<b>${size.w} × ${size.h}</b> · ${layout.name} · ${grade.name}`;
  document.querySelectorAll('[data-size]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.size === state.sizeId));
  });
  document.querySelectorAll('[data-layout]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.layout === state.layoutId));
  });
  document.querySelectorAll('[data-grade]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.grade === state.gradeId));
  });
  const panel = state.panels[state.selected];
  $('panelReadout').textContent = `Panel ${state.selected + 1} of ${state.panels.length}`;
  if (panel) {
    $('panelPhotoSelect').value = panel.photoId;
    $('zoomRange').value = String(panel.zoom);
    $('panXRange').value = String(panel.panX);
    $('panYRange').value = String(panel.panY);
  }
  document.querySelectorAll('.photo-chip').forEach((chip) => {
    chip.setAttribute('aria-pressed', String(panel && chip.dataset.photo === panel.photoId));
  });
}

function buildPhotoGrid() {
  const grid = $('photoGrid');
  grid.innerHTML = '';
  for (const photo of state.photos) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'photo-chip';
    chip.dataset.photo = photo.id;
    const img = document.createElement('img');
    img.src = photo.src;
    img.alt = photo.label;
    const label = document.createElement('span');
    label.textContent = photo.label;
    chip.append(img, label);
    chip.addEventListener('click', () => assignPhotoToSelected(photo.id));
    grid.appendChild(chip);
  }
  const select = $('panelPhotoSelect');
  select.innerHTML = '';
  for (const photo of state.photos) {
    const opt = document.createElement('option');
    opt.value = photo.id;
    opt.textContent = photo.label;
    select.appendChild(opt);
  }
}

function buildLayoutList() {
  const list = $('layoutList');
  for (const layout of LAYOUTS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'layout-btn';
    btn.dataset.layout = layout.id;
    const name = document.createElement('strong');
    name.textContent = layout.name;
    const blurb = document.createElement('small');
    blurb.textContent = layout.blurb;
    btn.append(name, blurb);
    btn.addEventListener('click', () => switchLayout(layout.id));
    list.appendChild(btn);
  }
}

function buildGradeList() {
  const list = $('gradeList');
  for (const grade of GRADES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'grade-btn';
    btn.dataset.grade = grade.id;
    const swatch = document.createElement('span');
    swatch.className = 'grade-swatch';
    swatch.style.background = grade.swatch;
    const name = document.createElement('span');
    name.textContent = `${grade.name} — ${grade.blurb}`;
    btn.append(swatch, name);
    btn.addEventListener('click', () => {
      historyPush(history, state);
      state.gradeId = grade.id;
      scheduleRender();
    });
    list.appendChild(btn);
  }
}

function buildPresetList() {
  const list = $('presetList');
  for (const preset of PRESETS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = preset.name;
    btn.addEventListener('click', () => applyPreset(preset.name));
    list.appendChild(btn);
  }
}

function applyPreset(name) {
  const preset = presetByName(name);
  if (!preset) return;
  historyPush(history, state);
  state.layoutId = preset.layoutId;
  state.gradeId = preset.gradeId;
  state.title = preset.title;
  state.subtitle = preset.subtitle;
  state.badge = preset.badge;
  $('titleInput').value = preset.title;
  $('subtitleInput').value = preset.subtitle;
  $('badgeInput').value = preset.badge;
  const layout = layoutById(preset.layoutId);
  const size = SIZES[state.sizeId];
  const photoH = layout.titleOverlay ? size.h : size.h * 0.8;
  const rects = layout.panels().map((p) => ({ w: p.w * size.w, h: p.h * photoH }));
  state.panels = panelsForPhotos(preset.photos, layout.panelCount, images, rects);
  state.selected = 0;
  scheduleRender();
}

function switchLayout(layoutId) {
  const layout = layoutById(layoutId);
  historyPush(history, state);
  state.layoutId = layoutId;
  const keep = [...new Set(state.panels.map((p) => p.photoId))];
  const size = SIZES[state.sizeId];
  const photoH = layout.titleOverlay ? size.h : size.h * 0.8;
  const rects = layout.panels().map((p) => ({ w: p.w * size.w, h: p.h * photoH }));
  state.panels = panelsForPhotos(keep, layout.panelCount, images, rects);
  state.selected = 0;
  scheduleRender();
}

function assignPhotoToSelected(photoId) {
  const panel = state.panels[state.selected];
  if (!panel) return;
  historyPush(history, state);
  panel.photoId = photoId;
  const img = images.get(photoId);
  const rects = panelRectsPx();
  const rect = rects[state.selected];
  if (img && rect) {
    const frame = smartFrame(img, rect.w, rect.h);
    panel.panX = frame.panX;
    panel.panY = frame.panY;
    panel.zoom = frame.zoom;
  }
  scheduleRender();
}

function loadImage(photo) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { images.set(photo.id, img); resolve(true); };
    img.onerror = () => resolve(false);
    img.src = photo.src;
  });
}

async function loadAllPhotos() {
  const results = await Promise.all(state.photos.map(loadImage));
  return results.filter(Boolean).length;
}

function downloadPNG(sizeId) {
  const dataUrl = exportPNGDataURL(sizeId, state, images);
  const size = SIZES[sizeId];
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `neon-coast-${size.w}x${size.h}.png`;
  a.click();
}

function bindControls() {
  document.querySelectorAll('[data-size]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (state.sizeId === btn.dataset.size) return;
      historyPush(history, state);
      state.sizeId = btn.dataset.size;
      scheduleRender();
    });
  });

  $('undoBtn').addEventListener('click', () => {
    if (historyUndo(history, state)) {
      $('titleInput').value = state.title;
      $('subtitleInput').value = state.subtitle;
      $('badgeInput').value = state.badge;
      scheduleRender();
    }
  });
  $('redoBtn').addEventListener('click', () => {
    if (historyRedo(history, state)) {
      $('titleInput').value = state.title;
      $('subtitleInput').value = state.subtitle;
      $('badgeInput').value = state.badge;
      scheduleRender();
    }
  });

  $('exportAllBtn').addEventListener('click', () => {
    for (const sizeId of SIZE_IDS) downloadPNG(sizeId);
    $('statusText').textContent = 'Exported all 3 sizes — check your downloads.';
  });

  $('uploadBtn').addEventListener('click', () => $('uploadInput').click());
  $('uploadInput').addEventListener('change', async (ev) => {
    const files = [...ev.target.files];
    for (const file of files) {
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
      uploadCount += 1;
      const photo = { id: `upload-${uploadCount}`, label: file.name.replace(/\.[^.]+$/, '').slice(0, 14) || `Photo ${uploadCount}`, src: dataUrl };
      state.photos.push(photo);
      await loadImage(photo);
    }
    buildPhotoGrid();
    syncChrome();
    $('statusText').textContent = `${files.length} photo${files.length === 1 ? '' : 's'} added — click one to put it in the selected panel.`;
    ev.target.value = '';
  });

  $('autoFillBtn').addEventListener('click', () => {
    historyPush(history, state);
    const layout = layoutById(state.layoutId);
    const size = SIZES[state.sizeId];
    const photoH = layout.titleOverlay ? size.h : size.h * 0.8;
    const rects = layout.panels().map((p) => ({ w: p.w * size.w, h: p.h * photoH }));
    autoFillDistinct(state, layout.panelCount, images, rects);
    scheduleRender();
  });

  $('shuffleBtn').addEventListener('click', () => {
    historyPush(history, state);
    const layout = layoutById(state.layoutId);
    const size = SIZES[state.sizeId];
    const photoH = layout.titleOverlay ? size.h : size.h * 0.8;
    const rects = layout.panels().map((p) => ({ w: p.w * size.w, h: p.h * photoH }));
    shuffleDistinct(state, layout.panelCount, images, rects);
    scheduleRender();
  });

  $('titleInput').addEventListener('input', (ev) => {
    state.title = ev.target.value;
    scheduleRender();
  });
  $('subtitleInput').addEventListener('input', (ev) => {
    state.subtitle = ev.target.value;
    scheduleRender();
  });
  $('badgeInput').addEventListener('input', (ev) => {
    state.badge = ev.target.value;
    scheduleRender();
  });

  $('panelPhotoSelect').addEventListener('change', (ev) => assignPhotoToSelected(ev.target.value));

  const bindSlider = (id, key) => {
    $(id).addEventListener('input', (ev) => {
      const panel = state.panels[state.selected];
      if (!panel) return;
      beginGesture();
      panel[key] = parseFloat(ev.target.value);
      scheduleRender();
    });
    $(id).addEventListener('change', () => endGesture());
  };
  bindSlider('zoomRange', 'zoom');
  bindSlider('panXRange', 'panX');
  bindSlider('panYRange', 'panY');

  preview.addEventListener('pointerdown', (ev) => {
    const rect = preview.getBoundingClientRect();
    const x = (ev.clientX - rect.left) * (preview.width / rect.width);
    const y = (ev.clientY - rect.top) * (preview.height / rect.height);
    const rects = panelRectsPx();
    const hit = rects.findIndex((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
    if (hit < 0) return;
    state.selected = hit;
    syncChrome();
    const panel = state.panels[hit];
    const startX = x;
    const startY = y;
    const startPanX = panel.panX;
    const startPanY = panel.panY;
    beginGesture();
    const move = (mev) => {
      const mx = (mev.clientX - rect.left) * (preview.width / rect.width);
      const my = (mev.clientY - rect.top) * (preview.height / rect.height);
      panel.panX = clamp(startPanX + ((mx - startX) / rects[hit].w) * 1.4, -1, 1);
      panel.panY = clamp(startPanY + ((my - startY) / rects[hit].h) * 1.4, -1, 1);
      scheduleRender();
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      endGesture();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    preview.setPointerCapture(ev.pointerId);
  });

  preview.addEventListener('wheel', (ev) => {
    ev.preventDefault();
    const panel = state.panels[state.selected];
    if (!panel) return;
    beginGesture();
    panel.zoom = clamp(panel.zoom * (1 - ev.deltaY * 0.0012), 1, 3);
    scheduleRender();
    clearTimeout(preview._wheelTimer);
    preview._wheelTimer = setTimeout(endGesture, 350);
  }, { passive: false });
}

async function boot() {
  try {
    buildLayoutList();
    buildGradeList();
    buildPresetList();
    bindControls();
    state.photos = SAMPLE_POOL.map((p) => ({ ...p }));
    buildPhotoGrid();
    const loaded = await loadAllPhotos();
    const layout = layoutById(state.layoutId);
    const size = SIZES[state.sizeId];
    const photoH = layout.titleOverlay ? size.h : size.h * 0.8;
    const rects = layout.panels().map((p) => ({ w: p.w * size.w, h: p.h * photoH }));
    autoFillDistinct(state, layout.panelCount, images, rects);
    await document.fonts.ready;
    const hasShot = new URLSearchParams(window.location.search).has('shot');
    if (hasShot) {
      await runShotScene(state, images, renderPreview);
    } else {
      renderPreview();
    }
    $('statusText').textContent = `${loaded} sample photos loaded — pick a layout, a grade, and export.`;
  } catch (err) {
    window.__shotError = String(err && err.message ? err.message : err);
    $('statusText').textContent = `Could not start: ${window.__shotError}`;
  }
}

boot();
