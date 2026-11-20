// keyboard-shortcuts.js — the keyboard map, listed in full in the help
// dialog: Tab or 1-7 selects a panel, arrows pan, plus and minus zoom,
// brackets change the photo, F flips, R resets, M marks the face, A runs
// auto layout, S surprises, E exports, Ctrl+Z and Ctrl+Y undo and redo.
import { zoomPanel, resetPanel } from './panel-gestures.js';
import { nextSamplePhoto } from '../photos/sample-photos.js';

export function setupKeyboardShortcuts(studio) {
  document.addEventListener('keydown', (event) => {
    const tag = event.target?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (event.ctrlKey || event.metaKey) {
      if (event.key.toLowerCase() === 'z' && !event.shiftKey) {
        event.preventDefault();
        studio.undo();
      } else if (event.key.toLowerCase() === 'y' || (event.key.toLowerCase() === 'z' && event.shiftKey)) {
        event.preventDefault();
        studio.redo();
      }
      return;
    }
    const slot = studio.selectedSlot();
    const plan = studio.currentPlan;
    const count = plan ? plan.panels.length : 0;
    switch (event.key) {
      case 'Tab':
        event.preventDefault();
        studio.doc.selected = (studio.doc.selected + (event.shiftKey ? -1 : 1) + count) % count;
        studio.renderPanelsOnly();
        break;
      case '1': case '2': case '3': case '4': case '5': case '6': case '7': {
        const n = Number(event.key) - 1;
        if (n < count) {
          studio.doc.selected = n;
          studio.renderPanelsOnly();
        }
        break;
      }
      case 'ArrowLeft': if (slot) { slot.panX = Math.max(-1, (slot.panX || 0) - 0.08); studio.renderPreviewDraft(); } break;
      case 'ArrowRight': if (slot) { slot.panX = Math.min(1, (slot.panX || 0) + 0.08); studio.renderPreviewDraft(); } break;
      case 'ArrowUp': if (slot) { slot.panY = Math.max(-1, (slot.panY || 0) - 0.08); studio.renderPreviewDraft(); } break;
      case 'ArrowDown': if (slot) { slot.panY = Math.min(1, (slot.panY || 0) + 0.08); studio.renderPreviewDraft(); } break;
      case '+': case '=': if (slot) { zoomPanel(slot, 1.1); studio.renderPreviewDraft(); } break;
      case '-': case '_': if (slot) { zoomPanel(slot, 0.91); studio.renderPreviewDraft(); } break;
      case '[': if (slot) { slot.photo = nextSamplePhoto(slot.photo, -1).file; studio.commit('previous photo'); } break;
      case ']': if (slot) { slot.photo = nextSamplePhoto(slot.photo, 1).file; studio.commit('next photo'); } break;
      case 'f': case 'F': if (slot) { slot.flip = !slot.flip; studio.commit('flip panel'); } break;
      case 'r': case 'R': if (slot) { resetPanel(slot); studio.commit('reset panel'); } break;
      case 'm': case 'M': if (slot) { slot.faceMarked = !slot.faceMarked; studio.commit('toggle face mark'); } break;
      case 'a': case 'A': studio.autoLayout(); break;
      case 's': case 'S': studio.surpriseMe(); break;
      case 'e': case 'E': document.getElementById('exportAllBtn')?.click(); break;
      case '?': studio.openHelp(); break;
      default: break;
    }
  });
}
