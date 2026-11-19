// photos.js — the photo library for Afterglow Cover Studio.
//
// The 14 sample photos are image-model scenes that ship with the app.
// A photo the user picks (upload, drop, paste) joins the same library.
// Nothing is ever sent anywhere: every photo lives on this machine.
//
// Framing is relative (zoom + pan in -1..1), so one framing renders
// correctly at every export size, and smart framing keeps faces in
// view when a square or portrait photo lands in a wide panel.

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

// One panel's framing: zoom 1 means "cover the panel", pan moves the
// window inside the slack the zoom leaves.
export function freshFrame(photoId) {
  return { photoId, zoom: 1, panX: 0, panY: 0 };
}

// Smart face framing: a square or portrait photo in a wide panel, or
// a landscape photo in a tall panel, starts on its upper third, where
// faces live. The framing is relative, so it holds at every size.
export function smartFrame(photo, panelAspect) {
  const frame = freshFrame(photo.id);
  if (!photo.ready) return frame;
  const aspect = photo.w / photo.h;
  const wide = panelAspect > 1.25;
  const tall = panelAspect < 0.8;
  if (wide && aspect < 1.15) frame.panY = -0.35;
  else if (tall && aspect > 1.2) frame.panY = -0.25;
  return frame;
}

// The source window a frame shows, in photo pixels.
export function frameWindow(photo, panelW, panelH, frame) {
  const coverScale = Math.max(panelW / photo.w, panelH / photo.h);
  const scale = coverScale * frame.zoom;
  const sw = Math.min(photo.w, panelW / scale);
  const sh = Math.min(photo.h, panelH / scale);
  const slackX = photo.w - sw;
  const slackY = photo.h - sh;
  const sx = Math.max(0, Math.min(slackX, slackX / 2 + (frame.panX * slackX) / 2));
  const sy = Math.max(0, Math.min(slackY, slackY / 2 + (frame.panY * slackY) / 2));
  return { sx, sy, sw, sh };
}

// Deal photos into panel slots, round-robin from `startAt`, never the
// same photo twice in one cover while the library is big enough.
export function dealPhotos(library, slotCount, startAt = 0) {
  const dealt = [];
  const used = new Set();
  for (let i = 0; i < slotCount; i++) {
    let pick = null;
    for (let k = 0; k < library.length && !pick; k++) {
      const cand = library[(startAt + i + k) % library.length];
      if (!used.has(cand.id)) pick = cand;
    }
    pick = pick || library[(startAt + i) % library.length];
    used.add(pick.id);
    dealt.push(pick);
  }
  return dealt;
}

// A photo record shared by the editor and the renderer.
function newPhoto(id, label, src) {
  const img = new Image();
  img.decoding = "async";
  img.src = src;
  return { id, label, src, img, w: 0, h: 0, ready: false };
}

function loadPhoto(rec) {
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
  const lib = SAMPLE_PHOTOS.map((s) => newPhoto(s.id, s.label, s.file));
  await Promise.all(lib.map(loadPhoto));
  return lib.filter((p) => p.ready);
}

// Read image files the user picked (input, drop, paste) into records.
export async function readUserFiles(files) {
  const recs = [];
  for (const file of files) {
    if (!file.type || !file.type.startsWith("image/")) continue;
    const url = URL.createObjectURL(file);
    const label = file.name.replace(/\.[^.]+$/, "").slice(0, 18) || "Photo";
    const rec = newPhoto("up-" + Date.now() + "-" + recs.length, label, url);
    await loadPhoto(rec);
    if (rec.ready) recs.push(rec);
  }
  return recs;
}
