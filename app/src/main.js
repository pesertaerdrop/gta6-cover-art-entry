// Saltline Cover Studio: the boot and the studio. The studio is the one
// object every editor module shares: the document, the loaded photos, the
// undo history, and the three verbs the UI runs on — checkpoint (remember
// the document before a drag starts), commit (remember, mutate, redraw)
// and redraw (re-plan and repaint every card). The boot loads the photos
// and the local fonts first, then either draws one cover full-frame for
// a ?shot= scene or opens the workbench.
import { defaultDoc } from './state/default-doc.js';
import { createUndoHistory } from './state/undo-history.js';
import { SAMPLE_PHOTOS } from './photos/sample-photos.js';
import { planCover, applyShotScene } from './layouts/plan-cover.js';
import { renderCover } from './render/render-cover.js';
import { setupPreviewCanvas } from './editor/preview-canvas.js';
import { renderInspector } from './editor/panel-inspector.js';
import { renderLookSliders } from './editor/look-sliders.js';
import { renderLayoutPicker, renderGradePicker, renderTitlePicker, renderSizePicker } from './editor/preset-pickers.js';
import { renderPhotoTray, setupPhotoInput } from './editor/photo-tray.js';
import { setupStepBar, markStep } from './editor/step-bar.js';
import { setupExportPanel } from './editor/export-panel.js';
import { setupKeyboardShortcuts } from './editor/keyboard-shortcuts.js';
import { setupCoverActions, applyAutoLayout, applySurpriseMe } from './editor/cover-actions.js';
import { setupHelpDialog } from './editor/help-dialog.js';
import { setupCaptionFields, syncCaptionFields } from './editor/caption-fields.js';
import { sceneFromUrl, sceneMode } from './shot/shot-scenes.js';

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function loadAllPhotos(doc) {
  const srcs = [...new Set([...SAMPLE_PHOTOS.map((p) => p.src), ...doc.panels.map((p) => p.photo)])];
  const map = new Map();
  for (const src of srcs) {
    const img = await loadImage(src);
    if (img) map.set(src, img);
  }
  return map;
}

async function loadFonts() {
  const wants = ['16px Anton', '16px "Mr Dafoe"', '600 16px Oswald', '700 16px "Archivo Black"', '16px "Fascinate Inline"'];
  try {
    await Promise.race([
      Promise.all(wants.map((f) => document.fonts.load(f))),
      new Promise((r) => setTimeout(r, 3000)),
    ]);
    await document.fonts.ready;
  } catch {
    // A missing face falls back to the stack in the CSS; never block boot.
  }
}

function createStudio(doc, images) {
  const history = createUndoHistory(50);
  let lastSnap = null;
  const studio = {
    doc,
    images,
    history,
    plan: planCover(doc),
    previewScale: 1,
    previewPlan: null,

    checkpoint() {
      const snap = JSON.stringify(this.doc);
      if (snap !== lastSnap) {
        this.history.push(this.doc);
        lastSnap = snap;
      }
    },

    commit(mutator) {
      this.checkpoint();
      mutator(this.doc);
      this.redraw();
    },

    redraw() {
      this.plan = planCover(this.doc);
      this.drawPreview();
      renderInspector(this);
      renderLookSliders(this);
      renderLayoutPicker(this);
      renderGradePicker(this);
      renderTitlePicker(this);
      renderSizePicker(this);
      renderPhotoTray(this);
      syncCaptionFields(this.doc);
      const undo = document.getElementById('undoBtn');
      const redo = document.getElementById('redoBtn');
      if (undo) undo.disabled = !this.history.canUndo();
      if (redo) redo.disabled = !this.history.canRedo();
    },

    select(index) {
      this.doc.selected = index;
      this.redraw();
    },

    undo() {
      const prev = this.history.undo();
      if (!prev) return;
      this.doc = prev;
      lastSnap = JSON.stringify(this.doc);
      this.redraw();
    },

    redo() {
      const next = this.history.redo();
      if (!next) return;
      this.doc = next;
      lastSnap = JSON.stringify(this.doc);
      this.redraw();
    },

    autoLayout() {
      applyAutoLayout(this);
    },

    surprise() {
      applySurpriseMe(this);
    },
  };
  history.push(doc);
  lastSnap = JSON.stringify(doc);
  return studio;
}

async function boot() {
  const doc = defaultDoc();
  const scene = sceneFromUrl();
  if (scene) applyShotScene(doc, scene);
  const images = await loadAllPhotos(doc);
  await loadFonts();
  if (scene && sceneMode(scene) === 'cover') {
    document.body.classList.add('shot-cover');
    const canvas = document.getElementById('shotCanvas');
    const plan = planCover(doc);
    canvas.width = plan.w;
    canvas.height = plan.h;
    renderCover(canvas.getContext('2d'), doc, images);
    return;
  }
  const studio = createStudio(doc, images);
  setupPreviewCanvas(studio);
  setupPhotoInput(studio);
  setupStepBar(studio);
  setupExportPanel(studio);
  setupKeyboardShortcuts(studio);
  setupCoverActions(studio);
  setupHelpDialog(studio);
  setupCaptionFields(studio);
  studio.redraw();
  markStep(1);
}

boot();
