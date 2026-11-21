// Binds the seven caption fields (title, script line, tagline ribbon,
// review quote, review outlet, billing block, volume tag) to the document.
// Typing re-renders the preview live; leaving a field commits the change
// so undo can step back to the earlier caption.
export const CAPTION_FIELDS = [
  { id: 'titleInput', key: 'title', upper: true },
  { id: 'scriptInput', key: 'script', upper: false },
  { id: 'taglineInput', key: 'tagline', upper: true },
  { id: 'quoteInput', key: 'quote', upper: false },
  { id: 'outletInput', key: 'outlet', upper: true },
  { id: 'billingInput', key: 'billing', upper: false },
  { id: 'volInput', key: 'vol', upper: true },
];

export function setupCaptionFields(studio) {
  for (const field of CAPTION_FIELDS) {
    const input = document.getElementById(field.id);
    if (!input) continue;
    input.addEventListener('input', () => {
      studio.doc[field.key] = field.upper ? input.value.toUpperCase() : input.value;
      studio.renderPreviewOnly();
    });
    input.addEventListener('change', () => studio.commit(`edit ${field.key}`));
  }
}

export function syncCaptionFields(doc) {
  for (const field of CAPTION_FIELDS) {
    const input = document.getElementById(field.id);
    if (input) input.value = doc[field.key] ?? '';
  }
}
