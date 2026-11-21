// The three-step bar in the top bar: 1 Add photos, 2 Caption, 3 Export
// PNG. The steps are navigation, not a wizard: each jumps to the card it
// names, and the current step is marked so the user always knows where
// they are in the three moves from a photo to a poster.
const STEP_TARGETS = {
  1: 'photosHeading',
  2: 'captionHeading',
  3: 'exportHeading',
};

export function setupStepBar(studio) {
  const bar = document.getElementById('stepbar');
  if (!bar) return;
  for (const button of bar.querySelectorAll('button[data-step]')) {
    button.addEventListener('click', () => {
      const n = Number(button.dataset.step);
      markStep(n);
      const target = document.getElementById(STEP_TARGETS[n]);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}

export function markStep(number) {
  const bar = document.getElementById('stepbar');
  if (!bar) return;
  for (const button of bar.querySelectorAll('button[data-step]')) {
    const on = Number(button.dataset.step) === number;
    button.setAttribute('aria-current', on ? 'step' : 'false');
  }
}
