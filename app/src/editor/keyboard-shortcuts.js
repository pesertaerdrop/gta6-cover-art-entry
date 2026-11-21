// Keyboard shortcuts for the editor.
//
// Ctrl/Cmd+Z undoes, Ctrl+Shift+Z or Ctrl+Y redoes. The arrow keys
// pan the selected panel (Shift for bigger steps), + and - zoom it,
// F flips it, and R resets it. Shortcuts do nothing while the user is
// typing in a text field.
export function setupKeyboardShortcuts(studio) {
  document.addEventListener('keydown', (event) => {
    const target = event.target;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) return;
    const mod = event.ctrlKey || event.metaKey;
    if (mod && event.key.toLowerCase() === 'z' && !event.shiftKey) {
      event.preventDefault();
      studio.undo();
      return;
    }
    if ((mod && event.key.toLowerCase() === 'y') || (mod && event.shiftKey && event.key.toLowerCase() === 'z')) {
      event.preventDefault();
      studio.redo();
      return;
    }
    const panel = studio.selectedPanel();
    if (!panel) return;
    const step = event.shiftKey ? 0.2 : 0.05;
    if (event.key === 'ArrowLeft') { panel.panX = Math.max(-1, panel.panX - step); studio.commit(); studio.render(); }
    else if (event.key === 'ArrowRight') { panel.panX = Math.min(1, panel.panX + step); studio.commit(); studio.render(); }
    else if (event.key === 'ArrowUp') { panel.panY = Math.max(-1, panel.panY - step); studio.commit(); studio.render(); }
    else if (event.key === 'ArrowDown') { panel.panY = Math.min(1, panel.panY + step); studio.commit(); studio.render(); }
    else if (event.key === '+' || event.key === '=') { panel.zoom = Math.min(3, panel.zoom * 1.1); studio.commit(); studio.render(); }
    else if (event.key === '-') { panel.zoom = Math.max(1, panel.zoom / 1.1); studio.commit(); studio.render(); }
    else if (event.key.toLowerCase() === 'f') { panel.flip = !panel.flip; studio.commit(); studio.render(); }
    else if (event.key.toLowerCase() === 'r') { panel.zoom = 1.15; panel.panX = 0; panel.panY = 0; panel.flip = false; studio.commit(); studio.render(); }
  });
}
