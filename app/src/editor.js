// editor.js — the editor of Sunset Strip Studio.
//
// Three steps, one PNG: 1 Add photos, 2 Pick a layout, 3 Export. The
// left side is a live preview of the cover; the right rail holds the
// photos, the layout tiles (drawn as mini diagrams, not text), the
// grades, the Sunset Tape dial, the caption fields and the sizes.
// Click a panel to select it, drag to reframe it, scroll to zoom it.
// Everything the user does lands in the undo history; Export writes
// the PNGs at their exact post sizes.

import { layoutById, LAYOUTS } from './frames.js';
import { GRADES, gradeById } from './tint.js';
import { PHOTOS, PRESETS, presetById } from './library.js';
import { renderToCanvas, EXPORT_SIZES, cropWindow } from './canvas.js';
import { History } from './history.js';

const $ = (id) => document.getElementById(id);

export function stateFromPreset(preset) {
  return {
    layout: preset.layout,
    grade: preset.grade,
    tape: { on: preset.tape.on, strength: preset.tape.strength },
    title: preset.title,
    subtitle: preset.subtitle,
    tagline: preset.tagline,
    panels: preset.photos.map((id) => ({ photoId: id, zoom: 1, x: 0.5, y: 0.32 })),
    size: 'wide',
  };
}

export function bootEditor(library) {
  const byId = new Map(library.map((p) => [p.id, p]));
  const history = new History(50);
  let state = stateFromPreset(PRESETS[0]);
  let selected = 0;
  let size = 'wide';
  history.push(state);

  const preview = $('previewCanvas');
  const pctx = preview.getContext('2d');

  // ---- geometry -------------------------------------------------------
  function previewSize() {
    const s = EXPORT_SIZES.find((e) => e.id === size) || EXPORT_SIZES[2];
    const maxW = 920;
    const scale = Math.min(1, maxW / s.w);
    return { w: Math.round(s.w * scale), h: Math.round(s.h * scale), size: s };
  }

  function geometry() {
    const { w, h } = previewSize();
    const layout = layoutById(state.layout);
    const bandH = Math.round(h * 0.24);
    const topBand = layout.band === 'top';
    return {
      w, h, bandH,
      artY: topBand ? bandH : 0,
      artH: h - bandH,
      rects: layout.rects(w, h - bandH),
      layout,
    };
  }

  // ---- render ---------------------------------------------------------
  function render() {
    const { w, h } = previewSize();
    preview.width = w;
    preview.height = h;
    const cover = renderToCanvas(w, h, state, library);
    pctx.drawImage(cover, 0, 0);
    // Selected panel outline.
    const g = geometry();
    const r = g.rects[selected];
    if (r) {
      pctx.save();
      pctx.strokeStyle = '#ff2ea6';
      pctx.lineWidth = 3;
      pctx.setLineDash([]);
      pctx.strokeRect(r.x * g.w + 1, g.artY + r.y * g.artH + 1, r.w * g.w - 2, r.h * g.artH - 2);
      pctx.restore();
    }
    $('readyLine').textContent =
      `${library.length} photos ready · ${layoutById(state.layout).label} · ${gradeById(state.grade).label} · drag a panel to reframe it, then Export PNG.`;
    $('undoBtn').disabled = !history.canUndo();
    $('redoBtn').disabled = !history.canRedo();
  }

  function commit() {
    history.push(state);
    render();
  }

  // ---- controls -------------------------------------------------------
  function buildTray() {
    const tray = $('tray');
    tray.innerHTML = '';
    library.forEach((p) => {
      const b = document.createElement('button');
      b.className = 'thumb';
      b.title = p.label;
      const img = document.createElement('img');
      img.src = p.src;
      img.alt = p.label;
      const span = document.createElement('span');
      span.textContent = p.label;
      b.append(img, span);
      b.addEventListener('click', () => {
        state.panels[selected] = { ...state.panels[selected], photoId: p.id };
        commit();
      });
      tray.appendChild(b);
    });
  }

  function drawTile(canvas, layout) {
    const c = canvas.getContext('2d');
    canvas.width = 96;
    canvas.height = 64;
    c.fillStyle = '#241028';
    c.fillRect(0, 0, 96, 64);
    const rects = layout.rects(96, 64);
    const hues = ['#ffb347', '#ff5e7a', '#ff7ad9', '#7ad9ff', '#ffe9a3', '#9dffb0'];
    rects.forEach((r, i) => {
      c.fillStyle = hues[i % hues.length];
      c.fillRect(r.x * 96 + 1, r.y * 64 + 1, r.w * 96 - 2, r.h * 64 - 2);
    });
  }

  function buildLayouts() {
    const wrap = $('layoutTiles');
    wrap.innerHTML = '';
    LAYOUTS.forEach((layout) => {
      const b = document.createElement('button');
      b.className = 'tile' + (layout.id === state.layout ? ' active' : '');
      const cv = document.createElement('canvas');
      drawTile(cv, layout);
      const span = document.createElement('span');
      span.textContent = layout.label;
      b.append(cv, span);
      b.title = layout.desc;
      b.addEventListener('click', () => setLayout(layout.id));
      wrap.appendChild(b);
    });
  }

  function buildGrades() {
    const wrap = $('gradeChips');
    wrap.innerHTML = '';
    GRADES.forEach((g) => {
      const b = document.createElement('button');
      b.className = 'chip' + (g.id === state.grade ? ' active' : '');
      b.textContent = g.label;
      b.addEventListener('click', () => {
        state.grade = g.id;
        syncGradeChips();
        commit();
      });
      wrap.appendChild(b);
    });
  }

  function syncGradeChips() {
    [...$('gradeChips').children].forEach((b, i) => {
      b.classList.toggle('active', GRADES[i].id === state.grade);
    });
  }

  function buildSizes() {
    const wrap = $('sizeChips');
    wrap.innerHTML = '';
    EXPORT_SIZES.forEach((s) => {
      const b = document.createElement('button');
      b.className = 'chip' + (s.id === size ? ' active' : '');
      b.textContent = `${s.label} ${s.w}×${s.h}`;
      b.addEventListener('click', () => {
        size = s.id;
        state.size = s.id;
        [...wrap.children].forEach((c, i) => c.classList.toggle('active', EXPORT_SIZES[i].id === size));
        render();
      });
      wrap.appendChild(b);
    });
  }

  function buildPresets() {
    const wrap = $('presetChips');
    wrap.innerHTML = '';
    PRESETS.forEach((p) => {
      const b = document.createElement('button');
      b.className = 'chip';
      b.textContent = p.label;
      b.addEventListener('click', () => applyPreset(p.id));
      wrap.appendChild(b);
    });
  }

  function applyPreset(id) {
    const preset = presetById(id);
    state = stateFromPreset(preset);
    state.size = size;
    selected = 0;
    buildLayouts();
    syncGradeChips();
    $('titleInput').value = state.title;
    $('subtitleInput').value = state.subtitle;
    $('taglineInput').value = state.tagline;
    $('tapeOn').checked = state.tape.on;
    $('tapeStrength').value = Math.round(state.tape.strength * 100);
    commit();
  }

  function setLayout(id) {
    const layout = layoutById(id);
    const old = state.panels;
    const next = [];
    for (let i = 0; i < layout.slots; i++) {
      next.push(old[i] ? { ...old[i] } : { photoId: PHOTOS[i % PHOTOS.length].id, zoom: 1, x: 0.5, y: 0.32 });
    }
    state.layout = id;
    state.panels = next;
    selected = Math.min(selected, next.length - 1);
    buildLayouts();
    commit();
  }

  function autoFill() {
    const layout = layoutById(state.layout);
    state.panels = Array.from({ length: layout.slots }, (_, i) => ({
      photoId: PHOTOS[i % PHOTOS.length].id, zoom: 1, x: 0.5, y: 0.32,
    }));
    selected = 0;
    commit();
  }

  function shufflePhotos() {
    const ids = [...PHOTOS].sort(() => Math.random() - 0.5).map((p) => p.id);
    state.panels = state.panels.map((p, i) => ({ ...p, photoId: ids[i % ids.length] }));
    commit();
  }

  // ---- export ---------------------------------------------------------
  function download(canvas, filename) {
    canvas.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    }, 'image/png');
  }

  function exportSize(sizeId) {
    const s = EXPORT_SIZES.find((e) => e.id === sizeId) || EXPORT_SIZES[2];
    const canvas = renderToCanvas(s.w, s.h, state, library);
    download(canvas, `sunset-strip-${s.id}.png`);
  }

  // ---- panel interaction ----------------------------------------------
  function hitPanel(px, py) {
    const g = geometry();
    const x = px / g.w;
    const y = (py - g.artY) / g.artH;
    for (let i = g.rects.length - 1; i >= 0; i--) {
      const r = g.rects[i];
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
    }
    return -1;
  }

  let drag = null;
  let wheelTimer = null;

  preview.addEventListener('pointerdown', (e) => {
    const rect = preview.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (preview.width / rect.width);
    const py = (e.clientY - rect.top) * (preview.height / rect.height);
    const hit = hitPanel(px, py);
    if (hit < 0) return;
    selected = hit;
    const panel = state.panels[selected];
    const photo = byId.get(panel.photoId);
    drag = { x: px, y: py, fx: panel.x, fy: panel.y, photo };
    preview.setPointerCapture(e.pointerId);
    render();
  });

  preview.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const rect = preview.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (preview.width / rect.width);
    const py = (e.clientY - rect.top) * (preview.height / rect.height);
    const g = geometry();
    const r = g.rects[selected];
    const panel = state.panels[selected];
    const photo = drag.photo;
    if (!photo || !photo.img) return;
    const win = cropWindow(photo.img, r.w * g.w, r.h * g.artH, panel, photo.faces && photo.faces[0]);
    const dx = (px - drag.x) / win.scale / photo.img.naturalWidth;
    const dy = (py - drag.y) / win.scale / photo.img.naturalHeight;
    panel.x = Math.min(1, Math.max(0, drag.fx - dx));
    panel.y = Math.min(1, Math.max(0, drag.fy - dy));
    render();
  });

  preview.addEventListener('pointerup', () => {
    if (!drag) return;
    drag = null;
    commit();
  });

  preview.addEventListener('wheel', (e) => {
    e.preventDefault();
    const panel = state.panels[selected];
    if (!panel) return;
    panel.zoom = Math.min(4, Math.max(1, panel.zoom * Math.exp(-e.deltaY * 0.0012)));
    render();
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => history.push(state), 400);
  }, { passive: false });

  // ---- wiring ---------------------------------------------------------
  $('undoBtn').addEventListener('click', () => {
    const s = history.undo();
    if (s) { state = s; selected = 0; syncAll(); render(); }
  });
  $('redoBtn').addEventListener('click', () => {
    const s = history.redo();
    if (s) { state = s; selected = 0; syncAll(); render(); }
  });
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      e.preventDefault();
      $('undoBtn').click();
    } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
      e.preventDefault();
      $('redoBtn').click();
    }
  });

  $('exportBtn').addEventListener('click', () => exportSize(size));
  $('exportAllBtn').addEventListener('click', () => {
    EXPORT_SIZES.forEach((s, i) => setTimeout(() => exportSize(s.id), i * 350));
  });
  $('autoFillBtn').addEventListener('click', autoFill);
  $('shuffleBtn').addEventListener('click', shufflePhotos);
  $('loadSamplesBtn').addEventListener('click', autoFill);

  $('tapeOn').addEventListener('change', (e) => {
    state.tape.on = e.target.checked;
    commit();
  });
  $('tapeStrength').addEventListener('input', (e) => {
    state.tape.strength = parseInt(e.target.value, 10) / 100;
    $('tapeValue').textContent = `${e.target.value}%`;
    render();
  });
  $('tapeStrength').addEventListener('change', () => commit());

  function captionInput(id, key) {
    $(id).addEventListener('input', (e) => {
      state[key] = e.target.value;
      render();
    });
    $(id).addEventListener('change', () => commit());
  }
  captionInput('titleInput', 'title');
  captionInput('subtitleInput', 'subtitle');
  captionInput('taglineInput', 'tagline');

  $('zoomInBtn').addEventListener('click', () => {
    const panel = state.panels[selected];
    if (!panel) return;
    panel.zoom = Math.min(4, panel.zoom * 1.2);
    commit();
  });
  $('zoomOutBtn').addEventListener('click', () => {
    const panel = state.panels[selected];
    if (!panel) return;
    panel.zoom = Math.max(1, panel.zoom / 1.2);
    commit();
  });
  $('resetCropBtn').addEventListener('click', () => {
    const panel = state.panels[selected];
    if (!panel) return;
    panel.zoom = 1;
    panel.x = 0.5;
    panel.y = 0.32;
    commit();
  });

  let uploadCount = 0;
  $('addPhotosBtn').addEventListener('click', () => $('fileInput').click());
  $('fileInput').addEventListener('change', (e) => {
    const files = [...e.target.files];
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          uploadCount += 1;
          const rec = {
            id: `up-${uploadCount}`, src: reader.result,
            label: file.name.replace(/\.[^.]+$/, '').slice(0, 14) || `Photo ${uploadCount}`,
            faces: [], img,
          };
          library.push(rec);
          byId.set(rec.id, rec);
          buildTray();
          state.panels[selected] = { ...state.panels[selected], photoId: rec.id };
          commit();
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  });

  function syncAll() {
    buildLayouts();
    syncGradeChips();
    $('titleInput').value = state.title;
    $('subtitleInput').value = state.subtitle;
    $('taglineInput').value = state.tagline;
    $('tapeOn').checked = state.tape.on;
    $('tapeStrength').value = Math.round(state.tape.strength * 100);
    $('tapeValue').textContent = `${Math.round(state.tape.strength * 100)}%`;
  }

  buildTray();
  buildLayouts();
  buildGrades();
  buildSizes();
  buildPresets();
  syncAll();
  render();
}
