// help-dialog.js — the help dialog: a plain list of every shortcut plus the
// three-step flow, opened from the header Help button or the question-mark
// key, closed with its Close button or the Escape key.
export function setupHelpDialog(studio) {
  const dialog = document.getElementById('helpDialog');
  const openBtn = document.getElementById('helpBtn');
  const closeBtn = document.getElementById('helpCloseBtn');
  openBtn.addEventListener('click', () => dialog.showModal());
  closeBtn.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  studio.openHelp = () => {
    if (!dialog.open) dialog.showModal();
  };
}
