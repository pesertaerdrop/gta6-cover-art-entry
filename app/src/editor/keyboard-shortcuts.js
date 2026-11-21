// Keyboard shortcuts: the fast path through the editor. Undo and redo
// follow the platform convention, S surprises, A lays out again, ? opens
// the help sheet, the arrows nudge the selected panel's photo, and +/-
// zoom it. Shortcuts never fire while the user is typing in a field.
import { zoomPanel, resetPanel } from './panel-gestures.js';

function typingInField() {
  const el = document.activeElement;
  return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT');
}

export function setupKeyboardShortcuts(studio) {
  document.addEventListener('keydown', (e) => {
    if (typingInField()) return;
    const mod = e.ctrlKey || e.metaKey;
    const doc = studio.doc;
    const panel = doc.panels[doc.selected];
    if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      e.preventDefault();
      studio.undo();
    } else if ((mod && e.key.toLowerCase() === 'y') || (mod && e.shiftKey && e.key.toLowerCase() === 'z')) {
      e.preventDefault();
      studio.redo();
    } else if (e.key === 's' || e.key === 'S') {
      studio.commit(() => studio.surprise());
    } else if (e.key === 'a' || e.key === 'A') {
      studio.commit(() => studio.autoLayout());
    } else if (e.key === '?') {
      document.getElementById('helpDialog')?.showModal();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      if (!panel) return;
      e.preventDefault();
      studio.checkpoint();
      const step = 0.06;
      if (e.key === 'ArrowLeft') panel.panX = Math.max(-1, panel.panX - step);
      if (e.key === 'ArrowRight') panel.panX = Math.min(1, panel.panX + step);
      if (e.key === 'ArrowUp') panel.panY = Math.max(-1, panel.panY - step);
      if (e.key === 'ArrowDown') panel.panY = Math.min(1, panel.panY + step);
      studio.drawPreview();
    } else if (e.key === '+' || e.key === '=') {
      if (!panel) return;
      studio.commit(() => zoomPanel(panel, 1.1));
    } else if (e.key === '-' || e.key === '_') {
      if (!panel) return;
      studio.commit(() => zoomPanel(panel, 0.9));
    } else if (e.key === '0') {
      if (!panel) return;
      studio.commit(() => resetPanel(panel));
    }
  });
}
