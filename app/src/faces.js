// faces.js — face-aware slicing for Strip Five, with a whole-face guarantee.
//
// v7 kept the dividers off faces. v8 goes one step further: every face
// must be WHOLE inside its strip's visible window — eyes, nose, mouth,
// chin, ears and hairline, with air around it — at every export size.
//
// Why a strip can still cut a face even when no divider crosses it: a
// strip panel is tall and narrow, so at cover-fit it shows only a
// fraction of its slice. The fraction is narrowest on the portrait
// cover (a strip shows ~0.686 of its slice there). A face wider than
// that fraction gets its cheeks and ears cut by the strip's own edges,
// even perfectly centred. So the divider search now enforces a width
// rule: every slice that holds a face must be wide enough that its
// narrowest window contains the whole face span plus WHOLE_MARGIN of
// air on each side. Where the faces allow it, the dividers move until
// the rule holds; where they don't (a crowd filling the frame), the
// search returns null and the caller falls back to the v7 rule —
// dividers never cross a face, focus on the widest face — instead of
// pretending.
//
// Nothing here knows about one photo. Faces are horizontal intervals
// [x0, x1] in photo fractions (strip panels run the full height of the
// art area, and the window shows the full photo height on portrait and
// square, so only the horizontal span can be cut). The positions are
// computed from the face data and the photo's own dimensions every
// time, so any photo — sample or user upload — gets the same treatment.
// Uploads carry no face data, so they use equal dividers.

export const FACE_MARGIN = 0.015; // breathing room around each face, for dividers
export const WHOLE_MARGIN = 0.015; // air around a face inside its window, each side
export const MIN_STRIP = 0.03; // narrowest strip worth drawing (sky or palm sliver)
export const GAP_MIN = 0.02; // narrowest strip between two faces (a sliver of sky)
export const EDGE_CLEARANCE = 0.002; // divider never sits exactly on a face edge
export const ART_FRACTION = 0.74; // art area share of cover height (matches render.js)
export const STRIP_GUT = 0.012; // gutter share of art width (matches layouts.js)
export const SEARCH_STEP = 0.005; // divider search grid, photo fractions
export const SEARCH_NODES = 400000; // safety budget for the divider search

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

// The fraction of a slice its strip panel actually shows, for one
// export size: a cover-fit window of the slice inside the panel. The
// panel is sliceW * (1 - 4 gutters) of the art width and the full art
// height; the window's width over the slice's width is the ratio below.
// The narrowest ratio over the export sizes is the one the width rule
// must satisfy, because a face whole at the narrowest size is whole at
// every size.
export function windowRatioForSize(photoW, photoH, sizeW, sizeH) {
  const avail = 1 - 4 * STRIP_GUT;
  const artH = ART_FRACTION * sizeH;
  const u = (avail * sizeW) / photoW;
  const v = artH / photoH;
  return Math.min(1, u / v);
}

export function narrowWindowRatio(photoW, photoH, sizes) {
  if (!sizes || sizes.length === 0) return 0.686;
  let ratio = 1;
  for (const s of sizes) {
    ratio = Math.min(ratio, windowRatioForSize(photoW, photoH, s.w, s.h));
  }
  return ratio;
}

// Faces whose centre falls inside a slice [x0, x1].
export function facesInSlice(faces, x0, x1) {
  return (faces || []).filter(([a, b]) => {
    const centre = (a + b) / 2;
    return centre >= x0 && centre <= x1;
  });
}

// The horizontal span of the faces in a slice, or null when the slice
// holds no face.
export function faceSpanInSlice(faces, x0, x1) {
  const inside = facesInSlice(faces, x0, x1);
  if (inside.length === 0) return null;
  return [Math.min(...inside.map(([a]) => a)), Math.max(...inside.map(([, b]) => b))];
}

// Choose `count - 1` divider positions for `count` strips.
//
// Candidates: the ideal equal divider, or — when the ideal falls inside a
// blocked zone — the two edges of that zone (nudged clear of the face).
// Every combination is tried; the winner maximises the narrowest strip,
// then minimises the total drift from the equal split. That keeps the
// strips as even as the faces allow instead of shoving every divider to
// one side.
//
// This is the v7 rule: dividers never cross a face. It is the fallback
// when the whole-face search finds no divider set that also fits every
// face whole inside its strip's window.
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

// True when a divider set keeps every face whole inside its strip's
// narrowest window: no divider falls inside any face interval (margin
// included), every slice holding a face is wide enough that the window
// it shows at the narrowest export size contains the whole face span
// plus WHOLE_MARGIN of air on each side, and every strip meets its
// minimum width — MIN_STRIP, or GAP_MIN for a strip lying wholly inside
// one free gap (a sliver of sky). This is the single validator: both
// the search and the refinement below must pass it, so neither can
// produce a set the other would reject.
export function dividersWholeFace(dividers, faces, ratio, opts = {}) {
  const margin = opts.wholeMargin ?? WHOLE_MARGIN;
  const minStrip = opts.minStrip ?? MIN_STRIP;
  const gapMin = opts.gapMin ?? GAP_MIN;
  const zones = blockedZones(faces, opts.margin ?? FACE_MARGIN);
  if (dividers.some((d) => insideBlocked(d, zones))) return false;
  const gaps = freeGaps(faces, opts.margin ?? FACE_MARGIN);
  const gapOf = (x) => gaps.findIndex(([a, b]) => x >= a - 1e-9 && x <= b + 1e-9);
  const edges = [0, ...dividers, 1];
  for (let i = 0; i < edges.length; i++) {
    const w = edges[i + 1] - edges[i];
    const span = faceSpanInSlice(faces, edges[i], edges[i + 1]);
    if (span) {
      const need = span[1] - span[0] + 2 * margin;
      if (w * ratio < need) return false;
    }
    const gl = gapOf(edges[i]);
    const gr = gapOf(edges[i + 1]);
    const minW = gl >= 0 && gl === gr ? gapMin : minStrip;
    if (w < minW) return false;
  }
  return true;
}

// The whole-face divider search: divider positions on a grid over the
// free gaps, satisfying every constraint at once —
//   - dividers increasing, each inside a free gap
//   - every strip >= MIN_STRIP (a strip lying wholly inside one free
//     gap may go to GAP_MIN: it is only sky)
//   - every face-bearing slice wide enough for the width rule above
// The winner maximises the minimum slack (window minus required width
// over the face slices), then minimises drift from the equal split.
// Returns the divider array, or null when no set satisfies the rule —
// the caller then falls back to stripDividers() (v7 behaviour).
export function wholeFaceDividers(faces, count, ratio, opts = {}) {
  const margin = opts.margin ?? FACE_MARGIN;
  const wholeMargin = opts.wholeMargin ?? WHOLE_MARGIN;
  const minStrip = opts.minStrip ?? MIN_STRIP;
  const gapMin = opts.gapMin ?? GAP_MIN;
  const step = opts.step ?? SEARCH_STEP;
  if (!count || count < 2) return null;
  const zones = blockedZones(faces, margin);
  if (zones.length === 0) return null;
  const gaps = freeGaps(faces, margin);

  // Grid points inside the free gaps, in increasing order. A divider
  // may only ever sit on one of these.
  const points = [];
  for (const [a, b] of gaps) {
    for (let x = Math.ceil((a + 1e-9) / step) * step; x < b - 1e-9; x += step) {
      points.push(Math.round(x * 1000) / 1000);
    }
    // The gap's right edge is a legal divider too (just clear of the
    // next face), so the search can use the whole gap.
    if (b < 1) points.push(Math.round((b - EDGE_CLEARANCE) * 1000) / 1000);
  }
  points.sort((a, b) => a - b);

  const gapOf = (x) => gaps.findIndex(([a, b]) => x >= a - 1e-9 && x <= b + 1e-9);
  const minWidthFor = (left, right) => {
    // A strip wholly inside one free gap is a sliver of sky: GAP_MIN.
    // Anything else (a face slice, an edge strip) needs MIN_STRIP.
    const gl = gapOf(left);
    const gr = gapOf(right);
    if (gl >= 0 && gl === gr) return gapMin;
    return minStrip;
  };
  const faceNeed = (x0, x1) => {
    const span = faceSpanInSlice(faces, x0, x1);
    if (!span) return 0;
    return (span[1] - span[0] + 2 * wholeMargin) / ratio;
  };

  let best = null;
  let nodes = 0;
  const budget = opts.nodeBudget ?? SEARCH_NODES;
  // A divider never needs to move far from its equal-split ideal: the
  // whole-face solution is a perturbation of the equal split, and a
  // divider more than 0.30 from its ideal would starve another strip.
  // The window keeps the search small enough to finish in milliseconds
  // on every layout switch; a photo that truly needs a wilder move
  // falls back to stripDividers() instead of hanging the editor.
  const windowFor = (i) => {
    const ideal = (i + 1) / count;
    return [ideal - 0.3, ideal + 0.3];
  };

  const evaluate = (dividers) => {
    const edges = [0, ...dividers, 1];
    let minSlack = Infinity;
    let drift = 0;
    for (let i = 0; i < edges.length; i++) {
      const w = edges[i + 1] - edges[i];
      const need = faceNeed(edges[i], edges[i + 1]);
      if (need > 0) minSlack = Math.min(minSlack, w * ratio - (need * ratio));
    }
    for (let i = 0; i < dividers.length; i++) {
      drift += Math.abs(dividers[i] - (i + 1) / count);
    }
    const score = [minSlack, -drift];
    if (!best || score[0] > best.score[0] || (score[0] === best.score[0] && score[1] > best.score[1])) {
      best = { dividers: [...dividers], score };
    }
  };

  // Depth-first search over divider positions, pruning any branch the
  // moment a closed slice breaks a rule.
  const walk = (idx, prev, chosen) => {
    if (++nodes > budget) return;
    if (idx === count - 1) {
      // The last strip [prev, 1]: check its minimum, then score.
      if (1 - prev < minWidthFor(prev, 1)) return;
      const need = faceNeed(prev, 1);
      if (need > 0 && (1 - prev) < need) return;
      evaluate(chosen);
      return;
    }
    const remaining = count - 1 - idx;
    const [winLo, winHi] = windowFor(idx);
    for (const x of points) {
      if (x <= prev) continue;
      if (x < winLo || x > winHi) continue;
      // The strip [prev, x] must clear its minimum, and the face rule
      // when it holds a face.
      if (x - prev < minWidthFor(prev, x)) continue;
      const need = faceNeed(prev, x);
      if (need > 0 && (x - prev) < need) continue;
      // Room must remain for the dividers after this one.
      if (1 - x < remaining * gapMin) continue;
      chosen.push(x);
      walk(idx + 1, x, chosen);
      chosen.pop();
      if (nodes > budget) return;
    }
  };
  walk(0, 0, []);

  if (!best) return null;
  // Refine around the coarse winner at 0.001 steps: coordinate descent,
  // a few passes, keeping only strict improvements. Deterministic: the
  // same data always refines to the same dividers.
  let dividers = best.dividers;
  const scoreOf = (ds) => {
    const edges = [0, ...ds, 1];
    let minSlack = Infinity;
    let drift = 0;
    for (let i = 0; i < edges.length; i++) {
      const w = edges[i + 1] - edges[i];
      const need = faceNeed(edges[i], edges[i + 1]);
      if (need > 0) minSlack = Math.min(minSlack, w * ratio - need * ratio);
    }
    for (let i = 0; i < ds.length; i++) drift += Math.abs(ds[i] - (i + 1) / count);
    return [minSlack, -drift];
  };
  const legal = (ds) => {
    if (ds.some((d) => insideBlocked(d, zones))) return false;
    const edges = [0, ...ds, 1];
    for (let i = 1; i < edges.length; i++) {
      if (edges[i] <= edges[i - 1]) return false;
      if (edges[i] - edges[i - 1] < minWidthFor(edges[i - 1], edges[i])) return false;
      const need = faceNeed(edges[i - 1], edges[i]);
      if (need > 0 && edges[i] - edges[i - 1] < need) return false;
    }
    return true;
  };
  const better = (a, b) => a[0] > b[0] || (a[0] === b[0] && a[1] > b[1]);
  for (let pass = 0; pass < 3; pass++) {
    let improved = false;
    for (let i = 0; i < dividers.length; i++) {
      for (const delta of [-0.005, -0.002, -0.001, 0.001, 0.002, 0.005]) {
        const trial = [...dividers];
        trial[i] = Math.round((trial[i] + delta) * 1000) / 1000;
        if (!legal(trial)) continue;
        if (better(scoreOf(trial), scoreOf(dividers))) {
          dividers = trial;
          improved = true;
        }
      }
    }
    if (!improved) break;
  }
  return dividers;
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
