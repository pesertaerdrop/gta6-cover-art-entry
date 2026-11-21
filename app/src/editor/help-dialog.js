// The help dialog: a plain list of every shortcut plus the three-step
// flow, opened from the header Help button or the question-mark key, and
// closed from its Close button or the dialog's own backdrop.
export function setupHelpDialog(studio) {
  const dialog = document.getElementById('helpDialog');
  const openBtn = document.getElementById('helpBtn');
  const closeBtn = document.getElementById('helpCloseBtn');
  const open = () => {
    if (dialog && typeof dialog.showModal === 'function') dialog.showModal();
  };
  if (openBtn) openBtn.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', () => dialog.close());
  if (dialog) {
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
  }
  studio.openHelp = open;
}
