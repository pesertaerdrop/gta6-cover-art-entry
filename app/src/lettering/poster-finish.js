// The small finish pieces: the billing line, the generated barcode, the
// seal, the volume tag and the COMING SOON line.
//
// The billing line shrinks to fit its box (about 8% per step) down to a
// floor of the larger of 8 px and 55% of the requested size; if it still
// does not fit, it falls back to a two-line wrapped block. The ellipsis
// path is gone — a billing line is never cut off with dots. The billing
// line sits inside the title field, on the field's own dark gradient, so
// white text always reads.
export function drawBillingLine(ctx, rect, text) {
  if (!text) return;
  const upper = text.toUpperCase();
  const startSize = rect.h * 0.92;
  const floor = Math.max(8, startSize * 0.45);
  let size = startSize;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${size}px "Oswald", sans-serif`;
  let width = ctx.measureText(upper).width;
  while (width > rect.w && size > floor) {
    size *= 0.92;
    ctx.font = `bold ${size}px "Oswald", sans-serif`;
    width = ctx.measureText(upper).width;
  }
  ctx.fillStyle = '#ffffff';
  if (width <= rect.w) {
    ctx.fillText(upper, rect.x + rect.w / 2, rect.y + rect.h / 2);
    return;
  }
  drawBillingBlock(ctx, rect, upper, floor);
}

// The two-line fallback: split the billing text at the word nearest the
// middle, and draw both halves centred.
export function drawBillingBlock(ctx, rect, text, size) {
  const words = text.split(' ');
  let best = 1;
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const left = words.slice(0, i).join(' ').length;
    const diff = Math.abs(left - text.length / 2);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  }
  const line1 = words.slice(0, best).join(' ');
  const line2 = words.slice(best).join(' ');
  ctx.font = `bold ${size}px "Oswald", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(line1, rect.x + rect.w / 2, rect.y + rect.h * 0.28);
  ctx.fillText(line2, rect.x + rect.w / 2, rect.y + rect.h * 0.72);
}

// The barcode: a white box, black bars generated deterministically from
// the code (a hash of the title), and the code's characters under it.
export function drawBarcode(ctx, x, y, w, h, code) {
  const digits = String(code || 'SALTLINE').replace(/[^A-Z0-9]/gi, '').toUpperCase() || 'SALTLINE';
  const barH = h * 0.72;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, w, h);
  let hash = 2166136261;
  for (let i = 0; i < digits.length; i++) {
    hash ^= digits.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  let seed = hash >>> 0;
  const next = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  let bx = x + w * 0.05;
  const endX = x + w * 0.95;
  ctx.fillStyle = '#111111';
  while (bx < endX - 2) {
    const bw = 1 + next() * (w * 0.02);
    if (next() > 0.4) ctx.fillRect(bx, y + h * 0.06, bw, barH);
    bx += bw + 1 + next() * 2;
  }
  ctx.fillStyle = '#111111';
  ctx.font = `${Math.max(8, h * 0.14)}px "Oswald", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(digits.slice(0, 12), x + w / 2, y + h * 0.88);
}

// The seal: a gold disc with a dark ring, a star, the studio name and the
// year, sitting on a mosaic corner.
export function drawSeal(ctx, x, y, size) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size / 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#f5c542';
  ctx.fill();
  ctx.lineWidth = Math.max(2, size * 0.05);
  ctx.strokeStyle = '#1a0b2e';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.78, 0, Math.PI * 2);
  ctx.lineWidth = Math.max(1, size * 0.02);
  ctx.stroke();
  ctx.fillStyle = '#1a0b2e';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${size * 0.22}px "Oswald", sans-serif`;
  ctx.fillText('★', cx, cy - r * 0.42);
  ctx.font = `bold ${size * 0.13}px "Oswald", sans-serif`;
  ctx.fillText('SALTLINE', cx, cy + r * 0.08);
  ctx.font = `${size * 0.1}px "Oswald", sans-serif`;
  ctx.fillText('EST. 2026', cx, cy + r * 0.45);
  ctx.restore();
}

// The volume tag: a dark chip with a gold border, e.g. "VOL. 3".
export function drawVolTag(ctx, x, y, vol) {
  if (!vol) return;
  const text = String(vol).toUpperCase();
  const fontSize = 15;
  ctx.font = `bold ${fontSize}px "Oswald", sans-serif`;
  const pad = 10;
  const w = ctx.measureText(text).width + pad * 2;
  const h = fontSize * 1.9;
  ctx.fillStyle = 'rgba(10,8,16,0.88)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#f5c542';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5);
  ctx.fillStyle = '#f5c542';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + h / 2 + 1);
}

// COMING SOON, top-left, gold with a dark shadow so it reads over any photo.
export function drawComingSoon(ctx, x, y, coverW) {
  const fontSize = Math.max(13, coverW * 0.02);
  ctx.font = `bold ${fontSize}px "Archivo Black", sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(10,8,16,0.7)';
  ctx.fillText('COMING SOON', x + 2, y + 2);
  ctx.fillStyle = '#f5c542';
  ctx.fillText('COMING SOON', x, y);
}
