// The help dialog: the shortcut sheet behind the Help button and the ?
// key. It is a plain <dialog> in the page; this module only opens and
// closes it, so the sheet itself stays in the markup where it is easy to
// read and edit.
export function setupHelpDialog(studio) {
  const dialog = document.getElementById('helpDialog');
  const open = document.getElementById('helpBtn');
  if (!dialog || !open) return;
  open.addEventListener('click', () => dialog.showModal());
  const close = dialog.querySelector('[data-close]');
  if (close) close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
}
