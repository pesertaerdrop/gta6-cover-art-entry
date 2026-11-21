// The seven poster-finish elements that make every cover read as a printed
// movie poster: per-panel callout tags, a seal, a volume tag, a five-star
// review bar, a billing block, a generated barcode, and a coming-soon line.
// The billing line shrinks to fit its box (measuring with the active font,
// ×0.92 a step, down to a floor of max(8px, 0.55× the requested size), and
// wrapping to two lines if it still does not fit) — it never truncates and
// never uses an ellipsis. The billing line and the title cluster each sit
// on a dark strip (the billing strip here, the title band in render-cover),
// so white text always reads over any photo.
const FONT_DISPLAY = (px) => `${px}px Anton, 'Archivo Black', sans-serif`;
const FONT_SCRIPT = (px) => `${px}px 'Mr Dafoe', cursive`;

export function drawCalloutTag(ctx, x, y, text, size = 14) {
  if (!text) return;
  const pad = 8;
  ctx.save();
  ctx.font = `700 ${size}px Oswald, sans-serif`;
  const width = ctx.measureText(text).width + pad * 2;
  const height = 24;
  ctx.fillStyle = '#111';
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(text, x + pad, y + height / 2 + 0.5);
  ctx.restore();
}

export function drawSeal(ctx, x, y, radius) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(17,17,17,0.85)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#fff';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, radius - 5, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#ffd166';
  ctx.font = `700 ${Math.round(radius * 0.55)}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('★', 0, -radius * 0.18);
  ctx.fillStyle = '#fff';
  ctx.font = `700 ${Math.round(radius * 0.22)}px Oswald, sans-serif`;
  ctx.fillText('SALTLINE', 0, radius * 0.32);
  ctx.restore();
}

export function drawVolTag(ctx, x, y, text) {
  if (!text) return;
  ctx.save();
  ctx.font = `700 15px Oswald, sans-serif`;
  const width = ctx.measureText(text).width + 16;
  ctx.fillStyle = '#fff';
  ctx.fillRect(x, y, width, 26);
  ctx.fillStyle = '#111';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(text, x + 8, y + 13.5);
  ctx.restore();
}

export function drawReviewBar(ctx, rect, quote, outlet) {
  if (!quote && !outlet) return;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.62)';
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  const stars = '★★★★★';
  const size = Math.round(rect.h * 0.42);
  ctx.font = `${size}px sans-serif`;
  ctx.fillStyle = '#ffd166';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(stars, rect.x + 14, rect.y + rect.h / 2);
  const starWidth = ctx.measureText(stars).width;
  ctx.fillStyle = '#fff';
  ctx.font = `italic 400 ${Math.round(rect.h * 0.34)}px Georgia, serif`;
  const quoteText = quote ? `"${quote}"` : '';
  ctx.fillText(quoteText, rect.x + 14 + starWidth + 12, rect.y + rect.h / 2);
  if (outlet) {
    ctx.font = `700 ${Math.round(rect.h * 0.3)}px Oswald, sans-serif`;
    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'right';
    ctx.fillText(outlet, rect.x + rect.w - 14, rect.y + rect.h / 2);
  }
  ctx.restore();
}

// Wrap text into at most two lines that fit maxWidth, drawing them centred
// on (cx, y) — the billing fallback when shrink-to-fit reaches its floor.
export function drawBillingBlock(ctx, cx, y, maxWidth, text, size) {
  ctx.save();
  ctx.font = `${size}px Oswald, sans-serif`;
  const words = text.split(' ');
  const lines = [''];
  for (const word of words) {
    const trial = lines[lines.length - 1] ? lines[lines.length - 1] + ' ' + word : word;
    if (ctx.measureText(trial).width <= maxWidth || lines[lines.length - 1] === '') {
      lines[lines.length - 1] = trial;
    } else if (lines.length < 2) {
      lines.push(word);
    } else {
      lines[1] += ' ' + word;
    }
  }
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  lines.forEach((line, i) => ctx.fillText(line, cx, y + i * (size + 2)));
  ctx.restore();
}

// The billing line: shrink the font ×0.92 a step until the text fits the
// box, never below max(8px, 0.55× the requested size); if it still does
// not fit, wrap it into two lines instead of cutting anything off.
export function drawBillingLine(ctx, x, y, maxWidth, text, requestedSize) {
  if (!text) return;
  const floor = Math.max(8, 0.55 * requestedSize);
  let size = requestedSize;
  ctx.save();
  ctx.font = `${size}px Oswald, sans-serif`;
  while (size > floor && ctx.measureText(text).width > maxWidth) {
    size = Math.max(floor, size * 0.92);
    ctx.font = `${size}px Oswald, sans-serif`;
  }
  if (ctx.measureText(text).width <= maxWidth) {
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(text, x, y);
    ctx.restore();
    return;
  }
  ctx.restore();
  drawBillingBlock(ctx, x + maxWidth / 2, y, maxWidth, text, floor);
}

// A dark strip behind the billing line, so white billing text always reads
// over any photo or panel border beneath it. The strip spans the billing
// box with a little padding on every side.
export function drawBillingStrip(ctx, x, y, maxWidth, size) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(x - 10, y - 5, maxWidth + 20, size + 10);
  ctx.restore();
}

export function drawBarcode(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.fillRect(x - 4, y - 4, w + 8, h + 18);
  ctx.fillStyle = '#111';
  let cursor = x;
  let seed = 1234567;
  const next = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  while (cursor < x + w - 2) {
    const bar = 1 + Math.floor(next() * 4);
    const gap = 1 + Math.floor(next() * 3);
    if (next() > 0.35) ctx.fillRect(cursor, y, bar, h);
    cursor += bar + gap;
  }
  ctx.font = '11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('8 900241 202611', x + w / 2, y + h + 12);
  ctx.restore();
}

export function drawComingSoon(ctx, x, y, text) {
  if (!text) return;
  ctx.save();
  ctx.font = `700 16px Oswald, sans-serif`;
  const width = ctx.measureText(text).width + 16;
  ctx.fillStyle = '#e5381a';
  ctx.fillRect(x - width, y, width, 26);
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(text, x - width + 8, y + 13.5);
  ctx.restore();
}

// Draw all seven finish elements onto a cover described by plan (from
// planCover) and doc. Callout tags sit on each panel, the seal on the hero
// panel's bottom-right, the volume tag top-left, the review bar across the
// bottom, the billing line above it, the barcode bottom-right, and the
// coming-soon line top-right.
export function drawPosterFinish(ctx, plan, doc) {
  const { w, h } = plan;
  const caption = plan.caption;
  // Callout tags, one per panel. The hero panel's tag sits below the
  // volume tag (top-left of the cover) so the two never collide, and any
  // tag that would fall across the title band drops just below the band.
  const glyphTop = plan.titleRect.y + plan.titleRect.h / 2 - plan.titleLift - plan.titleSize / 2;
  const bandBottom = plan.titleBand ? plan.titleBand.y + plan.titleBand.h : plan.titleRect.y + plan.titleRect.h * 0.8 + Math.round(h * 0.032);
  plan.panels.forEach((panel, i) => {
    if (!panel.tagOn || !panel.tag) return;
    const tagSize = Math.max(11, Math.round(w * 0.011));
    ctx.save();
    ctx.font = `700 ${tagSize}px Oswald, sans-serif`;
    const width = ctx.measureText(panel.tag).width + 16;
    const height = Math.round(tagSize * 1.7);
    let tagY = i === 0 ? Math.round(0.03 * h) + 30 : panel.rect.y + 8;
    if (tagY + height > glyphTop && tagY < bandBottom) tagY = bandBottom + 6;
    ctx.fillStyle = '#111';
    ctx.fillRect(panel.rect.x + 8, tagY, width, height);
    ctx.fillStyle = '#fff';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(panel.tag, panel.rect.x + 16, tagY + height / 2 + 0.5);
    ctx.restore();
  });
  // Seal on the hero panel.
  const hero = plan.panels[0];
  if (hero) {
    drawSeal(ctx, hero.rect.x + hero.rect.w - 34, hero.rect.y + hero.rect.h - 34, 28);
  }
  // Volume tag top-left, coming soon top-right.
  drawVolTag(ctx, 0.04 * w, 0.03 * h, doc.vol || caption.vol);
  drawComingSoon(ctx, 0.96 * w, 0.03 * h, doc.comingSoon || caption.comingSoon);
  // Review bar and billing above the bottom edge. The billing strip is
  // painted first so the billing line reads over any photo beneath it.
  const barH = Math.round(h * 0.055);
  drawReviewBar(ctx, { x: 0.04 * w, y: h - barH - 12, w: 0.92 * w, h: barH }, doc.quote || caption.quote, doc.outlet || caption.outlet);
  const billingSize = doc.size === '4:5' ? 17 : 15;
  const billingY = h - barH - 12 - billingSize - 8;
  drawBillingStrip(ctx, 0.1 * w, billingY, 0.72 * w, billingSize);
  drawBillingLine(ctx, 0.1 * w, billingY, 0.72 * w, doc.billing || caption.billing, billingSize);
  // Barcode bottom-right, clear of the billing box and of the review bar.
  drawBarcode(ctx, 0.86 * w, h - barH - 68, Math.round(0.09 * w), 30);
}
