// poster-finish.js — the seven poster-finish elements that make every cover
// read as a printed movie poster: per-panel callout tags, a seal, a volume
// or part tag, a five-star review-quote bar, a billing block, a generated
// barcode, and a coming-soon line. All of them are drawn in code from the
// document, and every line of text is editable in the editor.
export function drawCalloutTag(ctx, rect, tag, accent, placement, coverH) {
  if (!tag) return;
  const pad = Math.max(10, rect.h * 0.06);
  // Size the tag from the panel, but never taller than 5% of the cover, so
  // a tag on a tall panel cannot grow wide enough to reach the barcode.
  const cap = coverH ? Math.round(coverH * 0.05) : 999;
  let fontSize = Math.min(Math.max(14, Math.round(rect.h * 0.11)), cap);
  ctx.save();
  ctx.font = `700 ${fontSize}px Oswald, sans-serif`;
  // Shrink the tag until its chip fits inside the panel.
  const maxW = rect.w - 16;
  let textW = ctx.measureText(tag).width;
  let chipW = textW + pad * 2 + fontSize * 0.5;
  while (chipW > maxW && fontSize > 12) {
    fontSize = Math.round(fontSize * 0.92);
    ctx.font = `700 ${fontSize}px Oswald, sans-serif`;
    textW = ctx.measureText(tag).width;
    chipW = textW + pad * 2 + fontSize * 0.5;
  }
  const h = fontSize + pad * 1.1;
  const x = rect.x + Math.max(8, rect.w * 0.03);
  const y = placement === 'top'
    ? rect.y + Math.max(8, rect.h * 0.04)
    : rect.y + rect.h - h - Math.max(8, rect.h * 0.04);
  ctx.fillStyle = 'rgba(10, 8, 6, 0.92)';
  ctx.fillRect(x, y, chipW, h);
  ctx.fillStyle = accent;
  ctx.fillRect(x, y, fontSize * 0.32, h);
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'middle';
  ctx.fillText(tag, x + pad + fontSize * 0.32, y + h / 2 + 1);
  ctx.restore();
}

export function drawSeal(ctx, cx, cy, radius, text) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#e8a317';
  ctx.fill();
  ctx.lineWidth = Math.max(2, radius * 0.07);
  ctx.strokeStyle = '#7a4d00';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.78, 0, Math.PI * 2);
  ctx.strokeStyle = '#7a4d00';
  ctx.lineWidth = Math.max(1, radius * 0.03);
  ctx.stroke();
  ctx.fillStyle = '#3d2400';
  ctx.font = `700 ${Math.round(radius * 0.34)}px Oswald, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const words = text.split(' ');
  ctx.fillText(words[0] ?? '', 0, -radius * 0.22);
  ctx.fillText(words.slice(1).join(' ') || 'ORIGINAL', 0, radius * 0.22);
  ctx.restore();
}

export function drawVolTag(ctx, x, y, text, fontSize) {
  ctx.save();
  ctx.font = `700 ${fontSize}px Oswald, sans-serif`;
  const pad = fontSize * 0.7;
  const w = ctx.measureText(text).width + pad * 2;
  const h = fontSize * 1.9;
  ctx.fillStyle = '#141210';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#e8a317';
  ctx.lineWidth = Math.max(2, fontSize * 0.08);
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = '#e8a317';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + pad, y + h / 2 + 1);
  ctx.restore();
  return w;
}

export function drawQuoteBar(ctx, x, y, w, quote, outlet, fontSize) {
  const barH = fontSize * 2.6;
  ctx.save();
  ctx.fillStyle = 'rgba(10, 8, 6, 0.94)';
  ctx.fillRect(x, y, w, barH);
  ctx.fillStyle = '#e8a317';
  ctx.font = `${Math.round(fontSize * 1.1)}px sans-serif`;
  ctx.textBaseline = 'middle';
  const stars = '★★★★★';
  ctx.fillText(stars, x + fontSize * 0.7, y + barH / 2);
  const starW = ctx.measureText(stars).width;
  ctx.fillStyle = '#fff';
  ctx.font = `italic 700 ${fontSize}px Georgia, serif`;
  const quoteX = x + fontSize * 0.7 + starW + fontSize * 0.6;
  const maxQuote = w - (quoteX - x) - fontSize * 0.7 - ctx.measureText(outlet).width - fontSize * 1.4;
  let shown = quote;
  while (ctx.measureText(`"${shown}"`).width > maxQuote && shown.length > 8) {
    shown = shown.slice(0, -1);
  }
  ctx.fillText(`"${shown}"`, quoteX, y + barH / 2);
  ctx.fillStyle = '#e8a317';
  ctx.font = `700 ${Math.round(fontSize * 0.85)}px Oswald, sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText(outlet, x + w - fontSize * 0.7, y + barH / 2);
  ctx.restore();
  return barH;
}

export function drawBillingLine(ctx, x, y, w, text, fontSize) {
  ctx.save();
  ctx.font = `${fontSize}px Oswald, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let shown = text.toUpperCase();
  while (ctx.measureText(shown).width > w && shown.length > 12) {
    shown = shown.slice(0, -1);
  }
  if (shown.length < text.length) shown = `${shown.trim()}...`;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = Math.round(fontSize * 0.4);
  ctx.fillStyle = '#fff';
  ctx.fillText(shown, x + w / 2, y);
  ctx.restore();
}

export function drawBillingBlock(ctx, x, y, w, text, fontSize) {
  ctx.save();
  ctx.fillStyle = 'rgba(255, 250, 240, 0.92)';
  ctx.font = `${fontSize}px Oswald, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width > w * 0.96 && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  const shown = lines.slice(0, 2);
  ctx.fillStyle = '#141210';
  shown.forEach((line, i) => {
    ctx.fillText(line.toUpperCase(), x + w / 2, y + fontSize * (i + 0.6));
  });
  ctx.restore();
  return shown.length * fontSize * 1.15;
}

export function barcodeNumber(seed) {
  let state = seed >>> 0;
  const digits = [];
  for (let i = 0; i < 12; i += 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    digits.push(String(state % 10));
  }
  return digits.join('');
}

export function drawBarcode(ctx, x, y, w, h, number) {
  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.fillRect(x, y, w, h);
  let state = 0;
  for (const ch of number) state = (state * 31 + ch.charCodeAt(0)) >>> 0;
  const barW = w / (number.length * 3);
  let bx = x + barW;
  for (const ch of number) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const thick = (state % 3) + 1;
    ctx.fillStyle = '#141210';
    ctx.fillRect(bx, y + 4, barW * thick * 0.5, h * 0.62);
    bx += barW * 3;
  }
  ctx.fillStyle = '#141210';
  ctx.font = `${Math.max(10, Math.round(h * 0.16))}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`${number.slice(0, 6)} ${number.slice(6)}`, x + w / 2, y + h - 3);
  ctx.restore();
}

export function drawComingSoon(ctx, x, y, w, fontSize) {
  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.font = `700 ${fontSize}px Oswald, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('COMING SOON', x + w / 2, y);
  ctx.restore();
}

export function drawTaglineRibbon(ctx, x, y, w, text, fontSize) {
  ctx.save();
  const tri = fontSize * 0.9;
  ctx.fillStyle = '#e8531f';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w - tri, y + fontSize * 1.7);
  ctx.lineTo(x + tri, y + fontSize * 1.7);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#b23a10';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + tri, y + fontSize * 1.7);
  ctx.lineTo(x, y + fontSize * 1.7);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + w, y);
  ctx.lineTo(x + w - tri, y + fontSize * 1.7);
  ctx.lineTo(x + w, y + fontSize * 1.7);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `700 ${fontSize}px Oswald, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.toUpperCase(), x + w / 2, y + fontSize * 0.85);
  ctx.restore();
  return fontSize * 1.7;
}
