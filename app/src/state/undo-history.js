// A small undo/redo stack for the document (used by the app's main
// function). Every entry is a full JSON snapshot of the document at the
// moment before a change, with the time it was made, the label the UI
// shows it under, and the size it covers; entries are capped at 50.
export function createUndoHistory(limit = 50) {
  let undo = [];
  let redo = [];

  function snapshot(doc) {
    return JSON.stringify(doc);
  }

  function restore(doc, saved) {
    for (const key of Object.keys(doc)) delete doc[key];
    Object.assign(doc, JSON.parse(saved));
  }

  return {
    push(doc, label, size) {
      undo.push({ snapshot: snapshot(doc), time: Date.now(), label, size });
      if (undo.length > limit) undo.shift();
      redo = [];
    },
    undo(doc) {
      const step = undo.pop();
      if (!step) return false;
      redo.push({ snapshot: snapshot(doc), time: Date.now(), label: step.label, size: step.size });
      restore(doc, step.snapshot);
      return true;
    },
    redo(doc) {
      const step = redo.pop();
      if (!step) return false;
      undo.push({ snapshot: snapshot(doc), time: Date.now(), label: step.label, size: step.size });
      restore(doc, step.snapshot);
      return true;
    },
    canUndo() { return undo.length > 0; },
    canRedo() { return redo.length > 0; },
    undoLabel() { return undo.length ? undo[undo.length - 1].label : ''; },
    redoLabel() { return redo.length ? redo[redo.length - 1].label : ''; },
    clear() { undo = []; redo = []; },
  };
}
