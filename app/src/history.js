// history.js — undo / redo for Sunset Strip Studio.
//
// A plain stack of cover states (plain JSON, no images), capped at 50
// steps. Every editor change pushes once; undo and redo move the
// pointer and hand back a fresh copy of the state at that step.

export class History {
  constructor(limit = 50) {
    this.limit = limit;
    this.stack = [];
    this.index = -1;
  }

  static clone(state) {
    return JSON.parse(JSON.stringify(state));
  }

  push(state) {
    const snap = History.clone(state);
    // A new change drops everything redone past this point.
    this.stack = this.stack.slice(0, this.index + 1);
    this.stack.push(snap);
    if (this.stack.length > this.limit) this.stack.shift();
    this.index = this.stack.length - 1;
  }

  undo() {
    if (!this.canUndo()) return null;
    this.index -= 1;
    return History.clone(this.stack[this.index]);
  }

  redo() {
    if (!this.canRedo()) return null;
    this.index += 1;
    return History.clone(this.stack[this.index]);
  }

  canUndo() {
    return this.index > 0;
  }

  canRedo() {
    return this.index < this.stack.length - 1;
  }
}
