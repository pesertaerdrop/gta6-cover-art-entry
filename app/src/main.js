// Saltline Cover Studio — entry point.
//
// The studio object is the one thing every editor module shares: the
// document (doc), its undo history, the loaded photos (images, keyed by
// source), the uploaded photos (uploaded), the last plan the preview drew
// (currentPlan), the preview's draw handle, and the verbs render / commit /
// undo / redo that every module calls. boot() wires the modules, preloads
// the seventeen sample photos, and either draws a ?shot= cover scene
// full-frame (for the screenshots) or opens the editor.
//
// Saltline Cover Studio: turn any photo and a caption into GTA-style cover
// art — multi-panel posters with callout tags, a seal, a review bar, a
// barcode and a giant chrome title in its own title field along the foot
// of the cover — and export the PNG in three post sizes (1080x1080,
// 1080x1350, 1920x1080).
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

// The studio: one object, built up below, so the modules never import
// each other — they all take `studio` and call its verbs.
const studio = {
  doc: defaultDoc(),
  history: createUndoHistory(),
  images: new Map(),
  uploaded: new Map(),
  currentPlan: null,
  preview: null,
  step: 1,
  openHelp: () => {},
};

// Load one image by source, resolving to null (never rejecting) so a
// missing file cannot stop the preload.
function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Preload every sample photo in parallel, keeping the ones that load.
async function preloadSamples() {
  const jobs = SAMPLE_PHOTOS.map(async (photo) => {
    const img = await loadImage(`./${photo.src}`);
    if (img) studio.images.set(photo.src, img);
  });
  await Promise.all(jobs);
}

// The selected panel's slot, or null when nothing is selected.
studio.selectedSlot = () => studio.doc.panels[studio.doc.selected] ?? null;

studio.uploadedCount = () => studio.uploaded.size;

// Take files the user added (picker, drop, paste): keep the images, put
// each one in the tray under an upload: key, and fill the selected panel
// with the last one. Nothing leaves the machine.
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

// Re-render the preview only (full quality), in draft (fast, per-pixel
// pass skipped) for a drag, or just the panels when the selection moves.
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

// Re-render everything: the preview and every picker, inspector, slider
// and caption field, and the undo/redo buttons' disabled state.
studio.render = () => {
  studio.currentPlan = planCover(studio.doc);
  studio.renderPreviewOnly();
  renderInspector(studio);
  renderLookSliders(studio);
  renderLayoutPicker(studio);
  renderGradePicker(studio);
  renderTitlePicker(studio);
  renderSizePicker(studio);
  syncCaptionFields(studio.doc);
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');
  if (undoBtn) undoBtn.disabled = !studio.history.canUndo();
  if (redoBtn) redoBtn.disabled = !studio.history.canRedo();
};

// Commit the document as it stands (push the pre-change snapshot with a
// label) and re-render, so undo can step back to it.
studio.commit = (label) => {
  studio.history.push(studio.doc, label, studio.doc.size);
  studio.render();
};

studio.undo = () => {
  if (studio.history.undo(studio.doc)) studio.render();
};

studio.redo = () => {
  if (studio.history.redo(studio.doc)) studio.render();
};

studio.setStep = (step) => {
  studio.step = step;
  markStep(step);
};

studio.autoLayout = () => applyAutoLayout(studio);
studio.surpriseMe = () => applySurpriseMe(studio);
studio.syncCaptionFields = () => syncCaptionFields(studio.doc);

// Boot: apply a ?shot= scene if one is named, preload the samples, wait
// for the fonts (fallbacks cover a failure), then either draw the cover
// scene full-frame for a screenshot or open the editor.
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
    const plan = planCover(studio.doc);
    const canvas = document.getElementById('shotCanvas');
    canvas.width = plan.w;
    canvas.height = plan.h;
    const ctx = canvas.getContext('2d');
    renderCover(ctx, studio.doc, studio.images, { draft: false });
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
