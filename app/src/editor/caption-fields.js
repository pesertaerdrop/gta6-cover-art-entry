// The caption fields: the eight text inputs under the preview that edit
// the cover's words. A field starts from the deck entry and remembers
// what the user typed: typing wins over the deck until the caption is
// picked again. syncCaptionFields writes the resolved caption into the
// inputs whenever the document changes under them.
import { applyDocCaption } from '../layouts/plan-cover.js';

export const CAPTION_FIELDS = [
  { key: 'title', label: 'Cover title', max: 24 },
  { key: 'script', label: 'Script line under the title', max: 48 },
  { key: 'tagline', label: 'Tagline on the gold ribbon', max: 48 },
  { key: 'quote', label: 'Review quote', max: 64 },
  { key: 'outlet', label: 'Review outlet', max: 32 },
  { key: 'billing', label: 'Billing line', max: 120 },
  { key: 'vol', label: 'Volume tag', max: 16 },
  { key: 'comingSoon', label: 'Coming soon flag', max: 16 },
];

const INPUT_IDS = {
  title: 'titleInput',
  script: 'scriptInput',
  tagline: 'taglineInput',
  quote: 'quoteInput',
  outlet: 'outletInput',
  billing: 'billingInput',
  vol: 'volInput',
  comingSoon: 'comingSoonInput',
};

export function setupCaptionFields(studio) {
  for (const field of CAPTION_FIELDS) {
    const input = document.getElementById(INPUT_IDS[field.key]);
    if (!input) continue;
    input.addEventListener('focus', () => studio.checkpoint());
    input.addEventListener('input', () => {
      studio.doc[field.key] = input.value;
      studio.drawPreview();
    });
    input.addEventListener('change', () => studio.drawPreview());
  }
}

export function syncCaptionFields(doc) {
  const resolved = applyDocCaption(doc);
  for (const field of CAPTION_FIELDS) {
    const input = document.getElementById(INPUT_IDS[field.key]);
    if (input && document.activeElement !== input) input.value = resolved[field.key] || '';
  }
}
