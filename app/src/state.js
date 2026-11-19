// Cover state and its undo history. The state is plain data: every field is
// a value the renderer can draw from, and every change goes through commit()
// so Undo and Redo always see a clean snapshot.

export const SIZES = {
  '1080x1080': { w: 1080, h: 1080, label: 'Square' },
  '1080x1350': { w: 1080, h: 1350, label: 'Portrait' },
  '1920x1080': { w: 1920, h: 1080, label: 'Wide' },
};

export const SIZE_IDS = ['1080x1080', '1080x1350', '1920x1080'];

export function blankPanel(photoId) {
  return { photoId, zoom: 1, panX: 0, panY: 0 };
}

export function createCoverState() {
  return {
    sizeId: '1080x1080',
    layoutId: 'grid9',
    gradeId: 'neon-nights',
    title: 'NEON COAST',
    subtitle: 'Vice City nights',
    badge: 'EST. 2026',
    photos: [],
    panels: [],
    selected: 0,
  };
}

export function snapshotState(state) {
  return JSON.parse(JSON.stringify({
    sizeId: state.sizeId,
    layoutId: state.layoutId,
    gradeId: state.gradeId,
    title: state.title,
    subtitle: state.subtitle,
    badge: state.badge,
    panels: state.panels,
    selected: state.selected,
  }));
}

export function restoreSnapshot(state, snap) {
  state.sizeId = snap.sizeId;
  state.layoutId = snap.layoutId;
  state.gradeId = snap.gradeId;
  state.title = snap.title;
  state.subtitle = snap.subtitle;
  state.badge = snap.badge;
  state.panels = snap.panels;
  state.selected = snap.selected;
}

// A 50-step undo stack. push() records the state before a change; undo()
// and redo() swap whole snapshots, so no edit can leave a half-applied cover.
export function createHistory(limit = 50) {
  return { past: [], future: [], limit };
}

export function historyPush(history, state) {
  history.past.push(snapshotState(state));
  if (history.past.length > history.limit) history.past.shift();
  history.future.length = 0;
}

export function historyUndo(history, state) {
  if (!history.past.length) return false;
  history.future.push(snapshotState(state));
  restoreSnapshot(state, history.past.pop());
  return true;
}

export function historyRedo(history, state) {
  if (!history.future.length) return false;
  history.past.push(snapshotState(state));
  restoreSnapshot(state, history.future.pop());
  return true;
}

export function historyCanUndo(history) { return history.past.length > 0; }
export function historyCanRedo(history) { return history.future.length > 0; }
