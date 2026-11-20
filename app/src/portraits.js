// portraits.js — measured face boxes for Sunset Strip Studio.
//
// Every box was measured from the actual generated photo (visual
// grounding on the real file) and is stored in fractions of the photo:
// [x0, y0, x1, y1]. For a photo with more than one face, faces[0] is
// the UNION box of all its faces — the framing focus, so a crop centres
// on the whole group — and the rest are the individual faces, used by
// the face-guarantee check. Photos with no entry have no prominent
// face; the editor frames them by the upper third instead.

export const FACE_BOXES = {
  'hero-duo': [
    [0.318, 0.198, 0.669, 0.538],
    [0.318, 0.272, 0.468, 0.538],
    [0.512, 0.198, 0.669, 0.482],
  ],
  'convertible-night': [
    [0.31, 0.36, 0.543, 0.535],
    [0.47, 0.393, 0.543, 0.535],
    [0.31, 0.36, 0.39, 0.52],
  ],
  'motorcycle': [[0.385, 0.215, 0.438, 0.305]],
  'ice-cream': [
    [0.284, 0.392, 0.69, 0.612],
    [0.284, 0.392, 0.383, 0.572],
    [0.599, 0.44, 0.69, 0.612],
  ],
  'bonfire': [[0.79, 0.254, 0.92, 0.465]],
  'rooftop-pool': [[0.758, 0.525, 0.875, 0.73]],
  'lowrider': [],
  'roller-rink': [],
  'speedboat': [],
  'deco-hotel': [],
  'ferris-wheel': [],
  'taco-truck': [],
  'lifeguard-tower': [],
  'jet-ski': [],
};
