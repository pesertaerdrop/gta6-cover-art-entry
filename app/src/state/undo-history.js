// Undo and redo for the editor.
//
// The history keeps deep copies of the document, one per committed
// change. Undo steps back through them, redo steps forward, and any
// new change after an undo drops the future — the usual behaviour.
// Nothing here touches the DOM; the studio calls commit() after each
// edit and re-renders from the document the history hands back.
export function createUndoHistory(limit = 50) {
  let past = [];
  let future = [];
  let current = null;

  // Remember the document as it stands now, so the first undo has
  // somewhere to go back to.
  function seed(doc) {
    current = structuredClone(doc);
  }

  // Record a new document state. Called after every edit.
  function commit(doc) {
    if (current !== null) {
      past.push(current);
      if (past.length > limit) past.shift();
    }
    current = structuredClone(doc);
    future = [];
  }

  function canUndo() {
    return past.length > 0;
  }

  function canRedo() {
    return future.length > 0;
  }

  // Step back one state and hand it back; null when there is nothing.
  function undo() {
    if (!canUndo()) return null;
    future.push(current);
    current = past.pop();
    return structuredClone(current);
  }

  // Step forward one state and hand it back; null when there is nothing.
  function redo() {
    if (!canRedo()) return null;
    past.push(current);
    current = future.pop();
    return structuredClone(current);
  }

  return { seed, commit, undo, redo, canUndo, canRedo };
}
