// step-bar.js — the clickable three-step header: 1 Add photos, 2 Caption,
// 3 Export PNG. Clicking a step moves focus to that part of the editor and
// marks it current, so the path from a photo to a PNG is always visible.
export function setupStepBar(studio) {
  const bar = document.getElementById('stepbar');
  const targets = {
    1: document.getElementById('photoTray'),
    2: document.getElementById('titleInput'),
    3: document.getElementById('exportAllBtn'),
  };
  bar.querySelectorAll('button[data-step]').forEach((button) => {
    button.addEventListener('click', () => {
      bar.querySelectorAll('button[data-step]').forEach((other) => other.removeAttribute('aria-current'));
      button.setAttribute('aria-current', 'step');
      const target = targets[button.dataset.step];
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (target.focus) target.focus({ preventScroll: true });
      }
      studio.setStep(Number(button.dataset.step));
    });
  });
}

export function markStep(number) {
  const bar = document.getElementById('stepbar');
  bar.querySelectorAll('button[data-step]').forEach((button) => {
    if (Number(button.dataset.step) === number) {
      button.setAttribute('aria-current', 'step');
    } else {
      button.removeAttribute('aria-current');
    }
  });
}
