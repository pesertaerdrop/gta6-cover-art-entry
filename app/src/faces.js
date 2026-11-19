// faces.js — face-aware slicing for the Strip Five layout.
//
// The v6 bug, in one sentence: Strip Five cut one photo into five equal
// vertical strips, and the fixed dividers landed on the faces of the hero
// duo portrait. The app's smart face framing only framed crops; it never
// protected a face from a slice divider.
//
// This module is the fix. A face is a horizontal interval [x0, x1] in photo
// fractions (the strip panels run the full height of the art area, so only
// the horizontal span of a face can be cut by a divider). Given the faces
// of the lead photo and the strip count, stripDividers() returns divider
// positions that never cross a face: every divider sits in a face-free gap,
// with a margin around each face, and every strip stays wide enough to
// read. If the faces block so much of the frame that no legal split exists
// (a crowd filling the whole width), it falls back to equal dividers and
// says so — the caller can show that state instead of pretending.
//
// Nothing here knows about one photo. The positions are computed from the
// face data every time, so any photo — sample or user upload — gets the
// same treatment. Uploads carry no face data, so they use equal dividers.

export const FACE_MARGIN = 0.015; // breathing room around each face
export const MIN_STRIP = 0.05; // narrowest strip worth drawing
export const EDGE_CLEARANCE = 0.002; // divider never sits exactly on a face edge
// The narrowest strip view any export size shows, in photo fractions.
// The portrait cover shows ~0.14 of the photo per strip; the focus point
// stored for a slice is computed for this width, so one stored focus
// keeps its face whole at every size (wider views only show more around
// the same centre).
export const NARROW_VIEW = 0.14;

// Merge a list of [x0, x1] intervals (sorted by x0) into the smallest set
// of non-overlapping intervals. Overlapping or touching faces become one
// blocked zone, because a divider cannot pass between two faces that
// overlap or touch.
export function mergeIntervals(intervals) {
  const sorted = intervals
    .map(([a, b]) => [Math.min(a, b), Math.max(a, b)])
    .filter(([a, b]) => b > a)
    .sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  const merged = [];
  for (const [a, b] of sorted) {
    const last = merged[merged.length - 1];
    if (last && a <= last[1]) {
      last[1] = Math.max(last[1], b);
    } else {
      merged.push([a, b]);
    }
  }
  return merged;
}

// Blocked zones: each face widened by the margin, clamped to the frame,
// then merged. A divider may not land inside any of these.
export function blockedZones(faces, margin = FACE_MARGIN) {
  const widened = (faces || []).map(([a, b]) => [
    Math.max(0, a - margin),
    Math.min(1, b + margin),
  ]);
  return mergeIntervals(widened);
}

function insideBlocked(x, zones) {
  return zones.some(([a, b]) => x > a && x < b);
}

// The free gaps between blocked zones, as [start, end] pairs. Dividers
// live in these gaps.
export function freeGaps(faces, margin = FACE_MARGIN) {
  const zones = blockedZones(faces, margin);
  const gaps = [];
  let cursor = 0;
  for (const [a, b] of zones) {
    if (a > cursor) gaps.push([cursor, a]);
    cursor = Math.max(cursor, b);
  }
  if (cursor < 1) gaps.push([cursor, 1]);
  return gaps;
}

// Choose `count - 1` divider positions for `count` strips.
//
// Candidates: the ideal equal divider, or — when the ideal falls inside a
// blocked zone — the two edges of that zone (nudged clear of the face).
// Every combination is tried; the winner maximises the narrowest strip,
// then minimises the total drift from the equal split. That keeps the
// strips as even as the faces allow instead of shoving every divider to
// one side.
export function stripDividers(faces, count, opts = {}) {
  const margin = opts.margin ?? FACE_MARGIN;
  const minStrip = opts.minStrip ?? MIN_STRIP;
  if (!count || count < 2) return [];
  const zones = blockedZones(faces, margin);
  if (zones.length === 0) {
    return equalDividers(count);
  }
  const perDivider = [];
  for (let i = 1; i < count; i++) {
    const ideal = i / count;
    if (!insideBlocked(ideal, zones)) {
      perDivider.push([ideal]);
      continue;
    }
    const zone = zones.find(([a, b]) => ideal > a && ideal < b);
    const options = [];
    const left = zone[0] - EDGE_CLEARANCE;
    const right = zone[1] + EDGE_CLEARANCE;
    if (left > 0) options.push(left);
    if (right < 1) options.push(right);
    // A face hugging the frame edge leaves only one way out; if both
    // edges are off-frame the ideal is unusable, so keep it and let the
    // combination filter drop it.
    perDivider.push(options.length ? options : [ideal]);
  }

  let best = null;
  const walk = (idx, chosen) => {
    if (idx === perDivider.length) {
      const dividers = [...chosen].sort((a, b) => a - b);
      // Dividers must increase and every strip must clear the minimum.
      const edges = [0, ...dividers, 1];
      let minGap = Infinity;
      for (let i = 1; i < edges.length; i++) {
        minGap = Math.min(minGap, edges[i] - edges[i - 1]);
      }
      if (minGap < minStrip) return;
      if (dividers.some((d) => d <= 0 || d >= 1)) return;
      if (dividers.some((d) => insideBlocked(d, zones))) return;
      let drift = 0;
      for (let i = 0; i < dividers.length; i++) {
        drift += Math.abs(dividers[i] - (i + 1) / count);
      }
      const score = [minGap, -drift];
      if (!best || score[0] > best.score[0] || (score[0] === best.score[0] && score[1] > best.score[1])) {
        best = { dividers, score };
      }
      return;
    }
    for (const option of perDivider[idx]) {
      chosen.push(option);
      walk(idx + 1, chosen);
      chosen.pop();
    }
  };
  walk(0, []);
  return best ? best.dividers : equalDividers(count);
}

export function equalDividers(count) {
  const out = [];
  for (let i = 1; i < count; i++) out.push(i / count);
  return out;
}

// Faces whose centre falls inside a slice [x0, x1].
export function facesInSlice(faces, x0, x1) {
  return (faces || []).filter(([a, b]) => {
    const centre = (a + b) / 2;
    return centre >= x0 && centre <= x1;
  });
}

// Where a strip panel should look inside its slice. `viewWidth` is the
// fraction of the photo one strip actually shows at the current cover
// size (narrow on tall covers, wide on landscape ones).
//   - no faces: the middle of the slice.
//   - the faces fit inside one view: their shared centre, so every face
//     in the slice is whole.
//   - the faces are wider than one view: the centre of the widest face,
//     so at least one face is whole instead of two half-faces.
export function sliceFocus(faces, x0, x1, viewWidth) {
  const inside = facesInSlice(faces, x0, x1);
  if (inside.length === 0) return (x0 + x1) / 2;
  const spanStart = Math.min(...inside.map(([a]) => a));
  const spanEnd = Math.max(...inside.map(([, b]) => b));
  if (spanEnd - spanStart <= viewWidth) return (spanStart + spanEnd) / 2;
  let widest = inside[0];
  for (const face of inside) {
    if (face[1] - face[0] > widest[1] - widest[0]) widest = face;
  }
  return (widest[0] + widest[1]) / 2;
}

// True when a divider set keeps every face whole: no divider falls
// inside any face interval (margin included). Used by the self-check in
// the editor and by the test script.
export function dividersRespectFaces(dividers, faces, margin = FACE_MARGIN) {
  const zones = blockedZones(faces, margin);
  return dividers.every((d) => !insideBlocked(d, zones));
}
