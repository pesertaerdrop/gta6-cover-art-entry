// lettering.js — the cover's words: a gradient Anton title with outline
// and hard shadow, a neon Kaushan Script subtitle that keeps its own
// clear zone above the tagline bar (never clipped by it), and a Bebas
// Neue tagline bar with hand-spaced capitals.

/** Shrink an Anton title until it fits maxW; returns the fitted size. */
export function fitAnton(ctx, text, maxW, start) {
  let fs = start;
  ctx.font = `${fs}px Anton, sans-serif`;
  while (fs > 12 && ctx.measureText(text).width > maxW) {
    fs -= 2;
    ctx.font = `${fs}px Anton, sans-serif`;
  }
  return fs;
}

/**
 * The big title: a sunset gradient (gold to orange to pink, one hue
 * ramp), a dark outline and a hard offset shadow. Drawn left-aligned
 * at the given baseline.
 */
export function drawTitle(ctx, text, x, baselineY, maxW, startSize) {
  const fs = fitAnton(ctx, text, maxW, startSize);
  const grad = ctx.createLinearGradient(x, baselineY - fs, x, baselineY);
  grad.addColorStop(0, '#ffd76a');
  grad.addColorStop(0.55, '#ff9e4f');
  grad.addColorStop(1, '#ff6b9d');
  ctx.save();
  ctx.font = `${fs}px Anton, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.shadowColor = 'rgba(20, 6, 14, 0.9)';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = fs * 0.05;
  ctx.shadowOffsetY = fs * 0.05;
  ctx.lineWidth = Math.max(2, fs * 0.06);
  ctx.strokeStyle = '#2a0e1e';
  ctx.strokeText(text, x, baselineY);
  ctx.fillStyle = grad;
  ctx.fillText(text, x, baselineY);
  ctx.restore();
  return fs;
}

/**
 * The script subtitle in neon pink with a soft glow, fitted to maxW.
 * The caller gives it its own clear zone (top and height) above the
 * tagline bar, so the script is never overlapped or clipped.
 */
export function drawSubtitle(ctx, text, x, zoneTop, zoneH, maxW, startSize) {
  let fs = startSize;
  ctx.font = `${fs}px "Kaushan Script", cursive`;
  while (fs > 12 && ctx.measureText(text).width > maxW) {
    fs -= 2;
    ctx.font = `${fs}px "Kaushan Script", cursive`;
  }
  ctx.save();
  ctx.font = `${fs}px "Kaushan Script", cursive`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(255, 93, 143, 0.85)';
  ctx.shadowBlur = fs * 0.35;
  ctx.fillStyle = '#ff8fb8';
  ctx.fillText(text, x, zoneTop + zoneH / 2);
  ctx.restore();
  return fs;
}

/**
 * The tagline bar: a black strip with Bebas capitals spaced by hand
 * (canvas has no letter-spacing here, so each glyph is placed). The
 * spacing spreads the text across the full width.
 */
export function drawTagline(ctx, text, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = '#12060d';
  ctx.fillRect(x, y, w, h);
  const letters = text.replace(/\s+/g, ' ').split('');
  let fs = h * 0.62;
  ctx.font = `${fs}px Bebas Neue, sans-serif`;
  const widths = letters.map((ch) => ctx.measureText(ch === ' ' ? '  ' : ch).width);
  const total = widths.reduce((a, b) => a + b, 0);
  let gap = (w - total) / Math.max(1, letters.length);
  if (gap < 0) {
    fs = Math.max(10, fs * (w / total));
    ctx.font = `${fs}px Bebas Neue, sans-serif`;
    gap = 0;
  }
  ctx.fillStyle = '#f3e6d8';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  let cx = x + gap / 2;
  letters.forEach((ch, i) => {
    if (ch !== ' ') ctx.fillText(ch, cx, y + h / 2 + h * 0.02);
    cx += widths[i] + gap;
  });
  ctx.restore();
}
