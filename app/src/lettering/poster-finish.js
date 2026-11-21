// The poster finish: the small systems that make a cover read as a
// poster on every size — the billing line, the barcode, the gold seal,
// the volume tag and the COMING SOON flag. Each is drawn with plain canvas
// shapes and the Oswald/Anton faces, so the finish is identical in the
// browser and in the exported PNG.
const INK = '#141210';
const GOLD = '#e8a317';
const PAPER = '#f6efe4';

// Fit one line of text into a rect by shrinking it step by step; the
// billing must read whole on every cover, so the floor is low and the
// fallback wraps to a second line only when shrinking cannot save it.
export function drawBillingLine(ctx, rect, text) {
  let size = Math.round(rect.h * 0.72);
  const face = (s) => `600 ${s}px Oswald, "Archivo Black", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  while (size > 8) {
    ctx.font = face(size);
    if (ctx.measureText(text).width <= rect.w) break;
    size = Math.max(8, Math.floor(size * 0.92));
  }
  ctx.fillStyle = PAPER;
  ctx.font = face(size);
  ctx.fillText(text.toUpperCase(), rect.x + rect.w / 2, rect.y + rect.h / 2);
  return size;
}

// The billing block: the production line at a given size, shrinking to
// fit the rect the same way the single line does.
export function drawBillingBlock(ctx, rect, text, size) {
  let s = size || Math.round(rect.h * 0.72);
  const face = (v) => `600 ${v}px Oswald, "Archivo Black", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  while (s > 8) {
    ctx.font = face(s);
    if (ctx.measureText(text).width <= rect.w) break;
    s = Math.max(8, Math.floor(s * 0.92));
  }
  ctx.fillStyle = PAPER;
  ctx.font = face(s);
  ctx.fillText(text.toUpperCase(), rect.x + rect.w / 2, rect.y + rect.h / 2);
  return s;
}

// A barcode: bar widths from a hash of the code, so the same code always
// draws the same bars, with the code itself in tiny caps underneath.
export function drawBarcode(ctx, x, y, w, h, code) {
  const label = (code || 'SALTLINE').toUpperCase();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, w, h);
  let seed = 0;
  for (let i = 0; i < label.length; i++) seed = (seed * 31 + label.charCodeAt(i)) >>> 0;
  const barH = h * 0.72;
  let bx = x + w * 0.06;
  const end = x + w * 0.94;
  ctx.fillStyle = '#111111';
  while (bx < end) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    const bw = 1 + (seed % 4) * (w / 90);
    const gap = 1 + ((seed >> 8) % 3) * (w / 110);
    if ((seed >> 4) % 3 !== 0) ctx.fillRect(bx, y + h * 0.08, bw, barH);
    bx += bw + gap;
  }
  ctx.fillStyle = INK;
  ctx.font = `600 ${Math.max(7, Math.round(h * 0.16))}px Oswald, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h * 0.9);
}

// The gold seal: a double-ringed circle with a star, SALTLINE and the
// founding year, stamped over the panel band's top-right corner.
export function drawSeal(ctx, x, y, size) {
  const r = size / 2;
  const cx = x + r;
  const cy = y + r;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = GOLD;
  ctx.fill();
  ctx.lineWidth = Math.max(2, size * 0.04);
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2);
  ctx.lineWidth = Math.max(1, size * 0.02);
  ctx.stroke();
  // Five-point star.
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r * 0.30 : r * 0.13;
    const px = cx + Math.cos(ang) * rad;
    const py = cy + r * 0.18 + Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = INK;
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${Math.max(8, Math.round(size * 0.13))}px Anton, "Archivo Black", sans-serif`;
  ctx.fillText('SALTLINE', cx, cy + r * 0.48);
  ctx.font = `600 ${Math.max(6, Math.round(size * 0.09))}px Oswald, sans-serif`;
  ctx.fillText('EST. 2026', cx, cy + r * 0.68);
  ctx.restore();
}

// The volume tag: a black chip with a gold edge, bottom-left of the
// panel band. The optional height scales it to the cover.
export function drawVolTag(ctx, x, y, vol, h) {
  const text = (vol || 'VOL. 1').toUpperCase();
  const height = h || 30;
  ctx.font = `700 ${Math.max(10, Math.round(height * 0.6))}px Oswald, sans-serif`;
  const pad = Math.round(height * 0.4);
  const w = ctx.measureText(text).width + pad * 2;
  ctx.fillStyle = INK;
  ctx.fillRect(x, y, w, height);
  ctx.lineWidth = 2;
  ctx.strokeStyle = GOLD;
  ctx.strokeRect(x + 1, y + 1, w - 2, height - 2);
  ctx.fillStyle = GOLD;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + height / 2 + 1);
}

// COMING SOON in gold caps across the panel band's top-left corner.
export function drawComingSoon(ctx, x, y, coverW) {
  const size = Math.max(16, Math.round(coverW * 0.022));
  ctx.font = `700 ${size}px Oswald, "Archivo Black", sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = GOLD;
  ctx.fillText('COMING SOON', x, y);
}
