// main.js — Saltline Cover Studio entry point. Builds the studio object
// (the document, its history, the loaded photos, and the render/commit
// verbs every editor module shares), wires all the modules, preloads the
// sample photos, and applies a ?shot= scene when one is requested.
// Saltline Cover Studio: turn any photo and a caption into GTA-style cover
// art — multi-panel posters with callout tags, a seal, a review bar, a
// barcode and a giant chrome title — and export the PNG in three post sizes.
import { defaultDoc, cloneDoc, SIZES } from './state/default-doc.js';
import { createHistory, historyPush, historyUndo, historyRedo, historyCanUndo, historyCanRedo } from './state/undo-history.js';
import { SAMPLE_PHOTOS } from './photos/sample-photos.js';
import { planCover } from './layouts/plan-cover.js';
import { renderCover } from './render/render-cover.js';
import { setupPreviewCanvas } from './editor/preview-canvas.js';
import { renderInspector } from './editor/panel-inspector.js';
import { renderLookSliders } from './editor/look-sliders.js';
import { renderLayoutPicker, renderGradePicker, renderTitlePicker } from './editor/preset-pickers.js';
import { renderPhotoTray, setupPhotoInput } from './editor/photo-tray.js';
import { setupStepBar, markStep } from './editor/step-bar.js';
import { setupExportPanel } from './editor/export-panel.js';
import { setupKeyboardShortcuts } from './editor/keyboard-shortcuts.js';
import { setupCoverActions, applyAutoLayout, applySurpriseMe } from './editor/cover-actions.js';
import { setupHelpDialog } from './editor/help-dialog.js';
import { setupCaptionFields, syncCaptionFields } from './editor/caption-fields.js';
import { sceneFromUrl, applyShotScene, sceneMode } from './shot/shot-scenes.js';

const studio = {
  doc: defaultDoc(),
  history: null,
  images: new Map(),
  uploaded: new Map(),
  currentPlan: null,
  preview: null,
  step: 1,
  openHelp: () => {},
};

studio.history = createHistory(studio.doc);

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function preloadSamples() {
  const jobs = SAMPLE_PHOTOS.map(async (photo) => {
    const img = await loadImage(`./${photo.file}`);
    if (img) studio.images.set(photo.file, img);
  });
  await Promise.all(jobs);
}

studio.selectedSlot = () => {
  const plan = studio.currentPlan;
  if (!plan) return studio.doc.panels[studio.doc.selected] ?? null;
  const panel = plan.panels[studio.doc.selected];
  return panel ? panel.slot : null;
};

studio.uploadedCount = () => studio.uploaded.size;

studio.addUploadedFiles = async (files) => {
  const list = [...files].filter((file) => file.type.startsWith('image/'));
  for (const file of list) {
    const url = URL.createObjectURL(file);
    const img = await loadImage(url);
    if (!img) continue;
    const key = `upload:${file.name}:${Date.now()}`;
    studio.uploaded.set(key, img);
    studio.images.set(key, img);
    const slot = studio.selectedSlot();
    if (slot) slot.photo = key;
  }
  studio.commit('add photos');
};

studio.renderPreviewOnly = () => {
  if (studio.preview) studio.currentPlan = studio.preview.draw(false);
};

studio.renderPreviewDraft = () => {
  if (studio.preview) studio.currentPlan = studio.preview.draw(true);
};

studio.renderPanelsOnly = () => {
  studio.renderPreviewOnly();
  renderInspector(studio);
};

studio.render = () => {
  studio.currentPlan = planCover(studio.doc);
  studio.renderPreviewOnly();
  renderInspector(studio);
  renderLookSliders(studio);
  renderLayoutPicker(studio);
  renderGradePicker(studio);
  renderTitlePicker(studio);
  syncCaptionFields(studio.doc);
  document.getElementById('undoBtn').disabled = !historyCanUndo(studio.history);
  document.getElementById('redoBtn').disabled = !historyCanRedo(studio.history);
};

studio.commit = (label) => {
  historyPush(studio.history, studio.doc);
  studio.render();
  void label;
};

studio.undo = () => {
  const doc = historyUndo(studio.history);
  if (doc) {
    studio.doc = doc;
    studio.render();
  }
};

studio.redo = () => {
  const doc = historyRedo(studio.history);
  if (doc) {
    studio.doc = doc;
    studio.render();
  }
};

studio.setStep = (step) => {
  studio.step = step;
  markStep(step);
};

studio.autoLayout = () => applyAutoLayout(studio);
studio.surpriseMe = () => applySurpriseMe(studio);
studio.syncCaptionFields = () => syncCaptionFields(studio.doc);

async function boot() {
  const scene = sceneFromUrl();
  if (scene) applyShotScene(studio.doc, scene);
  await preloadSamples();
  try {
    await document.fonts.ready;
  } catch {
    // Fonts are decorative; the canvas still draws with fallbacks.
  }
  if (scene && sceneMode(scene) === 'cover') {
    document.body.classList.add('shot-cover');
    const canvas = document.getElementById('shotCanvas');
    renderCover(canvas, studio.doc, studio.images, { draft: false });
    document.title = 'saltline-ready';
    return;
  }
  studio.preview = setupPreviewCanvas(studio);
  renderPhotoTray(studio);
  setupPhotoInput(studio);
  setupStepBar(studio);
  setupExportPanel(studio);
  setupKeyboardShortcuts(studio);
  setupCoverActions(studio);
  setupHelpDialog(studio);
  setupCaptionFields(studio);
  studio.render();
  document.title = 'saltline-ready';
}

boot();
