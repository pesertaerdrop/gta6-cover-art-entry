// Undo history: a bounded stack of document snapshots. Every committed
// change pushes the document's JSON before the change, so undo restores
// exactly what was there. A new change after an undo drops the redo tail.
// Snapshots are plain JSON strings, so the history never holds a live
// reference to a document the editor keeps mutating.
export function createUndoHistory(limit = 50) {
  const past = [];
  const future = [];
  let current = null;

  const snap = (doc) => JSON.stringify(doc);
  const thaw = (json) => JSON.parse(json);

  return {
    // Remember the document as it is now, before the next change.
    push(doc) {
      if (current !== null) {
        past.push(current);
        if (past.length > limit) past.shift();
      }
      current = snap(doc);
      future.length = 0;
    },
    // Step back one change; returns the restored document or null.
    undo() {
      if (past.length === 0) return null;
      future.push(current);
      current = past.pop();
      return thaw(current);
    },
    // Step forward again after an undo; returns the document or null.
    redo() {
      if (future.length === 0) return null;
      past.push(current);
      current = future.pop();
      return thaw(current);
    },
    canUndo() {
      return past.length > 0;
    },
    canRedo() {
      return future.length > 0;
    },
    // Forget everything and start from a document.
    clear(doc) {
      past.length = 0;
      future.length = 0;
      current = doc ? snap(doc) : null;
    },
  };
}
