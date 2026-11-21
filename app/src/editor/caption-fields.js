// The caption fields: the two text inputs under the stage.
//
// The cover title and the script line under it are the only words the
// user edits by hand. Typing here writes straight into the document
// (an empty field falls back to the deck entry), commits the change
// for undo, and re-renders the cover live.
export const CAPTION_FIELDS = [
  { key: 'title', label: 'Cover title', input: 'caption-title' },
  { key: 'script', label: 'Script line under the title', input: 'caption-script' },
];

export function setupCaptionFields(studio) {
  for (const field of CAPTION_FIELDS) {
    const input = document.getElementById(field.input);
    if (!input) continue;
    input.addEventListener('input', () => {
      studio.doc[field.key] = input.value;
      studio.commit();
      studio.render();
    });
  }
}

// Fill the inputs from the document: the user's words if they typed
// any, else the deck entry the cover is showing.
export function syncCaptionFields(doc) {
  for (const field of CAPTION_FIELDS) {
    const input = document.getElementById(field.input);
    if (!input) continue;
    if (document.activeElement !== input) input.value = doc[field.key] || '';
  }
}
