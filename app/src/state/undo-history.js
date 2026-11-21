// Undo and redo for the document. Each entry is a full JSON snapshot of
// the document taken just before a change, with the time, the label the UI
// shows, and the cover size it covers. The stacks hold at most 50 entries.
export function createUndoHistory(limit = 50) {
  let undoStack = [];
  let redoStack = [];

  function takeSnapshot(doc) {
    return JSON.stringify(doc);
  }

  function applySnapshot(doc, saved) {
    for (const key of Object.keys(doc)) delete doc[key];
    Object.assign(doc, JSON.parse(saved));
  }

  return {
    push(doc, label, size) {
      undoStack.push({ snapshot: takeSnapshot(doc), time: Date.now(), label, size });
      if (undoStack.length > limit) undoStack.shift();
      redoStack = [];
    },
    undo(doc) {
      const step = undoStack.pop();
      if (!step) return false;
      redoStack.push({ snapshot: takeSnapshot(doc), time: Date.now(), label: step.label, size: step.size });
      applySnapshot(doc, step.snapshot);
      return true;
    },
    redo(doc) {
      const step = redoStack.pop();
      if (!step) return false;
      undoStack.push({ snapshot: takeSnapshot(doc), time: Date.now(), label: step.label, size: step.size });
      applySnapshot(doc, step.snapshot);
      return true;
    },
    canUndo() { return undoStack.length > 0; },
    canRedo() { return redoStack.length > 0; },
    undoLabel() { return undoStack.length ? undoStack[undoStack.length - 1].label : ''; },
    redoLabel() { return redoStack.length ? redoStack[redoStack.length - 1].label : ''; },
    clear() { undoStack = []; redoStack = []; },
  };
}
