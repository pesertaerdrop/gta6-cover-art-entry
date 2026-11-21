// The step bar: the three steps across the top of the studio.
//
// 1 Add photos, 2 Caption, 3 Export PNG. Clicking a step scrolls to
// the part of the bench it names and marks it current; the studio
// marks step 2 once the caption is touched and step 3 once an export
// has run.
export function setupStepBar(studio) {
  const targets = { 1: 'photos-card', 2: 'caption-card', 3: 'export-card' };
  for (const [number, id] of Object.entries(targets)) {
    const button = document.getElementById('step-' + number);
    if (!button) continue;
    button.addEventListener('click', () => {
      const card = document.getElementById(id);
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      markStep(Number(number));
    });
  }
  void studio;
}

export function markStep(number) {
  for (let i = 1; i <= 3; i++) {
    const button = document.getElementById('step-' + i);
    if (!button) continue;
    if (i === number) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
  }
}
