// The help dialog: a short sheet of how the studio works.
//
// The Help button opens it; it closes from its Close button or from a
// click on the backdrop. The shortcuts it lists are the ones
// keyboard-shortcuts.js wires up.
export function setupHelpDialog(studio) {
  const dialog = document.getElementById('help-dialog');
  const open = document.getElementById('help-btn');
  if (!dialog || !open) return;
  open.addEventListener('click', () => dialog.showModal());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  const close = dialog.querySelector('[data-close]');
  if (close) close.addEventListener('click', () => dialog.close());
  void studio;
}
