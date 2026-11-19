// photos.js — the photo library: 14 image-model samples, uploads, and
// the per-panel framing model (relative zoom / pan, smart face framing).
// Every photo is a file under app/samples/ or a file the user picked on
// their own machine; nothing is ever uploaded anywhere.

export const SAMPLE_PHOTOS = [
  { id: "supercar-boulevard", label: "Supercar", file: "samples/supercar-boulevard.jpg" },
  { id: "motel-rain", label: "Motel Rain", file: "samples/motel-rain.jpg" },
  { id: "marina-skyline", label: "Marina", file: "samples/marina-skyline.jpg" },
  { id: "night-market", label: "Night Market", file: "samples/night-market.jpg" },
  { id: "boardwalk-flamingo", label: "Flamingo", file: "samples/boardwalk-flamingo.jpg" },
  { id: "woman-convertible", label: "Convertible", file: "samples/woman-convertible.jpg" },
  { id: "man-rooftop", label: "Rooftop", file: "samples/man-rooftop.jpg" },
  { id: "friends-neon", label: "Neon Night", file: "samples/friends-neon.jpg" },
  { id: "speedboat", label: "Speedboat", file: "samples/speedboat.jpg" },
  { id: "man-motorcycle", label: "Motorcycle", file: "samples/man-motorcycle.jpg" },
  { id: "beach-bar", label: "Beach Bar", file: "samples/beach-bar.jpg" },
  { id: "palm-street", label: "Palm Street", file: "samples/palm-street.jpg" },
  { id: "woman-boardwalk", label: "Boardwalk", file: "samples/woman-boardwalk.jpg" },
  { id: "pier-fisher", label: "Pier Fisher", file: "samples/pier-fisher.jpg" },
];

// A photo record the editor and the renderer share.
export function makePhotoRecord(id, label, src) {
  const img = new Image();
  img.decoding = "async";
  img.src = src;
  return { id, label, src, img, w: 0, h: 0, ready: false };
}

export function loadPhotoRecord(rec) {
  if (rec.ready) return Promise.resolve(rec);
  return new Promise((resolve) => {
    const done = () => {
      rec.w = rec.img.naturalWidth || 0;
      rec.h = rec.img.naturalHeight || 0;
      rec.ready = rec.w > 0 && rec.h > 0;
      resolve(rec);
    };
    if (rec.img.complete) done();
    else {
      rec.img.onload = done;
      rec.img.onerror = () => resolve(rec);
    }
  });
}

export async function loadSampleLibrary() {
  const lib = SAMPLE_PHOTOS.map((s) => makePhotoRecord(s.id, s.label, s.file));
  await Promise.all(lib.map(loadPhotoRecord));
  return lib.filter((p) => p.ready);
}

// One panel's framing: relative values, so the same framing renders
// correctly at every export size.
export function freshFrame(photoId) {
  return { photoId, zoom: 1, panX: 0, panY: 0 };
}

// Smart face framing: a square or portrait photo dropped into a wide
// panel starts on its upper third, where faces live; a landscape photo
// in a tall panel does the same. Faces stay framed at every size.
export function smartFrame(photo, panelAspect) {
  const frame = freshFrame(photo.id);
  if (!photo.ready) return frame;
  const photoAspect = photo.w / photo.h;
  const widePanel = panelAspect > 1.25;
  const tallPanel = panelAspect < 0.8;
  if (widePanel && photoAspect < 1.15) frame.panY = -0.35;
  else if (tallPanel && photoAspect > 1.2) frame.panY = -0.25;
  return frame;
}

// The source window a frame shows, in photo pixels. Zoom multiplies the
// cover scale; pan moves the window inside the slack the zoom leaves.
export function frameWindow(photo, panelW, panelH, frame) {
  const iw = photo.w;
  const ih = photo.h;
  const cover = Math.max(panelW / iw, panelH / ih);
  const scale = cover * frame.zoom;
  const sw = Math.min(iw, panelW / scale);
  const sh = Math.min(ih, panelH / scale);
  const slackX = iw - sw;
  const slackY = ih - sh;
  const sx = Math.max(0, Math.min(slackX, slackX / 2 + (frame.panX * slackX) / 2));
  const sy = Math.max(0, Math.min(slackY, slackY / 2 + (frame.panY * slackY) / 2));
  return { sx, sy, sw, sh };
}

// Fill panel slots with photos: round-robin over the library, never the
// same photo twice in one cover when the library is big enough.
export function dealPhotos(library, slotCount, startAt = 0) {
  const out = [];
  const used = new Set();
  for (let i = 0; i < slotCount; i++) {
    let pick = null;
    for (let k = 0; k < library.length; k++) {
      const cand = library[(startAt + i + k) % library.length];
      if (!used.has(cand.id)) { pick = cand; break; }
    }
    if (!pick) pick = library[(startAt + i) % library.length];
    used.add(pick.id);
    out.push(pick);
  }
  return out;
}

// Read image files the user picked (input, drop, paste) into records.
export async function readUserFiles(files) {
  const recs = [];
  for (const file of files) {
    if (!file.type || !file.type.startsWith("image/")) continue;
    const url = URL.createObjectURL(file);
    const label = file.name.replace(/\.[^.]+$/, "").slice(0, 18) || "Photo";
    const rec = makePhotoRecord("up-" + Date.now() + "-" + recs.length, label, url);
    await loadPhotoRecord(rec);
    if (rec.ready) recs.push(rec);
  }
  return recs;
}
