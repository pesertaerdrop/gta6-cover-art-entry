// undo-history.js — a small snapshot stack for the document. Every edit
// pushes the previous document JSON; undo and redo move a pointer through
// the stack instead of mutating history, so a redo after an undo still works.
import { cloneDoc, docToJson, docFromJson } from './default-doc.js';

export function createHistory(firstDoc) {
  return {
    stack: [docToJson(firstDoc)],
    index: 0,
  };
}

export function historyPush(history, doc) {
  const snapshot = docToJson(doc);
  if (history.stack[history.index] === snapshot) return history;
  history.stack = history.stack.slice(0, history.index + 1);
  history.stack.push(snapshot);
  if (history.stack.length > 80) history.stack.shift();
  history.index = history.stack.length - 1;
  return history;
}

export function historyUndo(history) {
  if (history.index <= 0) return null;
  history.index -= 1;
  return docFromJson(history.stack[history.index]);
}

export function historyRedo(history) {
  if (history.index >= history.stack.length - 1) return null;
  history.index += 1;
  return docFromJson(history.stack[history.index]);
}

export function historyCanUndo(history) {
  return history.index > 0;
}

export function historyCanRedo(history) {
  return history.index < history.stack.length - 1;
}

export function historySnapshotCount(history) {
  return history.stack.length;
}

export function cloneHistoryDoc(doc) {
  return cloneDoc(doc);
}
