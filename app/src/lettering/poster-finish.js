// The poster finish: the small print that makes a cover a poster.
//
// Seven elements ride on every cover: the callout tags on the photos,
// the seal, the volume tag, the five-star review bar, COMING SOON,
// the billing block, and the barcode. This file draws the last five;
// the tags are drawn by the renderer and the review bar by the title
// field. Everything is drawn with the canvas, from the fonts the app
// ships — no images, no network.
const INK = '#141210';
const GOLD = '#e8a317';
const PAPER = '#f6efe4';

// Draw the billing line in one line, shrinking the font until it fits
// (never below 45% of the starting size). Returns the size it settled on.
export function drawBillingLine(ctx, rect, text) {
  let size = rect.h * 0.62;
  const floor = size * 0.45;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  while (size > floor) {
    ctx.font = `700 ${size}px Oswald, sans-serif`;
    if (ctx.measureText(text).width <= rect.w) break;
    size *= 0.92;
  }
  ctx.font = `700 ${size}px Oswald, sans-serif`;
  ctx.fillStyle = PAPER;
  ctx.fillText(text, rect.x + rect.w / 2, rect.y + rect.h / 2);
  return size;
}

// The billing block: the billing line on a dark strip of its own, so
// it stays readable over any title field.
export function drawBillingBlock(ctx, rect, text, size) {
  ctx.fillStyle = 'rgba(10, 8, 6, 0.55)';
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  drawBillingLine(ctx, { x: rect.x + 8, y: rect.y, w: rect.w - 16, h: rect.h }, text);
}

// A barcode for the code (the title's slug): seeded bars, black on
// paper, with the code printed small beneath.
export function drawBarcode(ctx, x, y, w, h, code) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(x, y, w, h);
  let seed = 2166136261;
  for (let i = 0; i < code.length; i++) {
    seed ^= code.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }
  const rand = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  ctx.fillStyle = INK;
  let bx = x + 4;
  const barH = h - 16;
  while (bx < x + w - 5) {
    const bw = 1 + Math.floor(rand() * 4);
    if (rand() > 0.45) ctx.fillRect(bx, y + 3, bw, barH);
    bx += bw + 1 + Math.floor(rand() * 3);
  }
  ctx.font = `700 ${Math.max(8, h * 0.11)}px Oswald, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = INK;
  ctx.fillText(code.toUpperCase(), x + w / 2, y + h - 6);
}

// The round seal: a gold disc with a star and the studio's name.
export function drawSeal(ctx, x, y, size) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size / 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = GOLD;
  ctx.fill();
  ctx.lineWidth = Math.max(2, size * 0.04);
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.78, 0, Math.PI * 2);
  ctx.lineWidth = Math.max(1, size * 0.02);
  ctx.stroke();
  // A five-point star in the middle.
  ctx.fillStyle = INK;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r * 0.42 : r * 0.18;
    const px = cx + Math.cos(angle) * rad;
    const py = cy + Math.sin(angle) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.font = `700 ${Math.max(7, size * 0.11)}px Oswald, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = INK;
  ctx.fillText('SALTLINE', cx, cy + r * 0.58);
  ctx.font = `400 ${Math.max(6, size * 0.08)}px Oswald, sans-serif`;
  ctx.fillText('EST. 2026', cx, cy + r * 0.74);
  ctx.restore();
}

// The volume tag: a small gold chip, "VOL. 1" and friends.
export function drawVolTag(ctx, x, y, vol, h) {
  ctx.font = `700 ${h * 0.52}px Oswald, sans-serif`;
  const w = ctx.measureText(vol).width + h * 0.9;
  ctx.fillStyle = GOLD;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(vol, x + w / 2, y + h / 2 + 1);
  return w;
}

// COMING SOON, in gold, at the top of the cover.
export function drawComingSoon(ctx, x, y, coverW) {
  const size = Math.max(16, coverW * 0.022);
  ctx.font = `700 ${size}px Anton, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = GOLD;
  ctx.fillText('COMING SOON', x, y);
}
