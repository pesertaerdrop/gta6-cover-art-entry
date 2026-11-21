// Saltline Cover Studio — the app's entry point.
//
// Boot builds the studio: a fresh document, the sample photos loaded,
// the fonts waited for, and then either one cover drawn full-frame
// (a screenshot scene) or the editor with all its cards wired up.
// The studio is the one object every editor card talks to: it holds
// the document and the images, re-renders on every change, and keeps
// the undo history.
import { defaultDoc } from './state/default-doc.js';
import { createUndoHistory } from './state/undo-history.js';
import { SAMPLE_PHOTOS } from './photos/sample-photos.js';
import { planCover, applyShotScene } from './layouts/plan-cover.js';
import { renderCover } from './render/render-cover.js';
import { sceneFromUrl, sceneMode } from './shot/shot-scenes.js';
import { setupCaptionFields, syncCaptionFields } from './editor/caption-fields.js';
import { setupCoverActions } from './editor/cover-actions.js';
import { setupExportPanel } from './editor/export-panel.js';
import { setupHelpDialog } from './editor/help-dialog.js';
import { setupKeyboardShortcuts } from './editor/keyboard-shortcuts.js';
import { renderLookSliders } from './editor/look-sliders.js';
import { renderInspector } from './editor/panel-inspector.js';
import { renderPhotoTray, setupPhotoInput } from './editor/photo-tray.js';
import { renderLayoutPicker, renderGradePicker, renderTitlePicker, renderSizePicker } from './editor/preset-pickers.js';
import { setupPreviewCanvas, drawPreview } from './editor/preview-canvas.js';
import { setupStepBar } from './editor/step-bar.js';

// Load one image. A photo that fails to load resolves to null and its
// panel draws dark, so one bad file never stops the app.
function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Build the studio around a document and its loaded images.
export function createStudio(doc, images) {
  const history = createUndoHistory(50);
  history.seed(doc);
  const studio = {
    doc,
    images,
    userPhotos: [],
    history,
    // Re-render everything from the document as it stands.
    render() {
      drawPreview(studio);
      renderPhotoTray(studio);
      renderInspector(studio);
      renderLookSliders(studio);
      renderLayoutPicker(studio);
      renderGradePicker(studio);
      renderTitlePicker(studio);
      renderSizePicker(studio);
      syncCaptionFields(doc);
      const undoBtn = document.getElementById('undo-btn');
      const redoBtn = document.getElementById('redo-btn');
      if (undoBtn) undoBtn.disabled = !history.canUndo();
      if (redoBtn) redoBtn.disabled = !history.canRedo();
    },
    // Record the document after a change, for undo.
    commit() {
      history.commit(doc);
      const undoBtn = document.getElementById('undo-btn');
      const redoBtn = document.getElementById('redo-btn');
      if (undoBtn) undoBtn.disabled = !history.canUndo();
      if (redoBtn) redoBtn.disabled = !history.canRedo();
    },
    undo() {
      const restored = history.undo();
      if (!restored) return;
      replaceDoc(doc, restored);
      studio.render();
    },
    redo() {
      const restored = history.redo();
      if (!restored) return;
      replaceDoc(doc, restored);
      studio.render();
    },
    selectedPanel() {
      return doc.panels[doc.selected] || null;
    },
  };
  // Wire every editor card to the studio.
  setupCaptionFields(studio);
  setupCoverActions(studio);
  setupExportPanel(studio);
  setupHelpDialog(studio);
  setupKeyboardShortcuts(studio);
  setupPhotoInput(studio);
  setupPreviewCanvas(studio);
  setupStepBar(studio);
  return studio;
}

// Replace a document's contents in place, so every card that holds a
// reference to it keeps working.
function replaceDoc(doc, restored) {
  for (const key of Object.keys(doc)) delete doc[key];
  Object.assign(doc, restored);
}

// Boot: a fresh document, the shot scene if the URL names one, the
// photos loaded, the fonts waited for — then a full-frame cover for a
// screenshot scene, or the editor.
async function boot() {
  const doc = defaultDoc();
  const scene = sceneFromUrl();
  if (scene) applyShotScene(doc, scene);
  const images = new Map();
  const loaded = await Promise.all(SAMPLE_PHOTOS.map((photo) => loadImage(photo.src)));
  SAMPLE_PHOTOS.forEach((photo, i) => {
    if (loaded[i]) images.set(photo.src, loaded[i]);
  });
  try {
    await document.fonts.ready;
  } catch (error) {
    // Fonts are best-effort; the cover still draws with fallbacks.
  }
  if (scene && sceneMode(scene) === 'cover') {
    document.body.classList.add('shot-cover');
    const plan = planCover(doc);
    const canvas = document.getElementById('shot-canvas');
    canvas.width = plan.w;
    canvas.height = plan.h;
    renderCover(canvas.getContext('2d'), doc, images);
    return;
  }
  const studio = createStudio(doc, images);
  studio.render();
}

boot();
