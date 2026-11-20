// keyart.js — the title band's extras, all drawn in canvas code: a
// seeded skyline strip, the HEAT star pill, the EST. 2026 badge, the
// diagonal NOW SHOWING ribbon, and the FRESH INK starburst sticker.
// Each helper takes explicit coordinates, so the renderer places them
// per size.

import { seededRandom } from './ink.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// A city skyline strip: seeded towers with lit windows, a pink rim glow
// along the rooftops, and two palm silhouettes. Drawn dark on the band.
export function drawSkyline(ctx, x, y, w, h, seed = 7) {
  const rnd = seededRandom(seed);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  // Pink rim glow along the top of the strip.
  const glow = ctx.createLinearGradient(x, y, x, y + h * 0.5);
  glow.addColorStop(0, 'rgba(255, 110, 160, 0.55)');
  glow.addColorStop(1, 'rgba(255, 110, 160, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x, y, w, h * 0.5);
  let cx = x;
  while (cx < x + w) {
    const tw = w * (0.05 + rnd() * 0.07);
    const th = h * (0.35 + rnd() * 0.6);
    const top = y + h - th;
    ctx.fillStyle = '#1c0d1a';
    ctx.fillRect(cx, top, tw, th);
    ctx.fillStyle = 'rgba(255, 120, 170, 0.9)';
    ctx.fillRect(cx, top, tw, Math.max(1.5, h * 0.03));
    // Lit windows: a sparse grid of warm and pink dots.
    for (let wy = top + h * 0.1; wy < y + h - h * 0.06; wy += h * 0.16) {
      for (let wx = cx + tw * 0.14; wx < cx + tw * 0.86; wx += tw * 0.26) {
        if (rnd() < 0.42) {
          ctx.fillStyle = rnd() < 0.6 ? 'rgba(255, 210, 110, 0.95)' : 'rgba(255, 140, 190, 0.95)';
          ctx.fillRect(wx, wy, Math.max(1.5, tw * 0.09), Math.max(1.5, h * 0.05));
        }
      }
    }
    cx += tw + w * 0.012;
  }
  // Two palm silhouettes at the strip's ends.
  for (const px of [x + w * 0.04, x + w * 0.94]) {
    ctx.strokeStyle = '#1c0d1a';
    ctx.lineWidth = Math.max(2, w * 0.004);
    ctx.beginPath();
    ctx.moveTo(px, y + h);
    ctx.quadraticCurveTo(px + w * 0.008, y + h * 0.45, px - w * 0.004, y + h * 0.12);
    ctx.stroke();
    ctx.lineWidth = Math.max(1.5, w * 0.0025);
    for (let a = -0.9; a <= 0.9; a += 0.45) {
      ctx.beginPath();
      ctx.moveTo(px - w * 0.004, y + h * 0.12);
      ctx.quadraticCurveTo(
        px + Math.sin(a) * w * 0.03, y + h * 0.02,
        px + Math.sin(a) * w * 0.05, y + h * 0.12,
      );
      ctx.stroke();
    }
  }
  ctx.restore();
}

// A five-point star path centred at (cx, cy) with outer radius r.
export function starPath(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : r * 0.42;
    const px = cx + Math.cos(ang) * rad;
    const py = cy + Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

// The HEAT pill: a gold rounded pill holding the word HEAT and five
// stars (four filled, one outline). Returns the pill's drawn width so
// the caller can right-align it. The pill widens itself on tall covers
// because the caller passes the full width it may use.
export function drawHeatPill(ctx, x, y, h, maxW) {
  const label = 'HEAT';
  const starR = h * 0.26;
  const gap = h * 0.16;
  const fs = h * 0.42;
  ctx.font = `${fs}px Anton, sans-serif`;
  const labelW = ctx.measureText(label).width;
  const starsW = 5 * starR * 2 + 4 * gap;
  let pillW = labelW + gap * 2 + starsW + gap * 2;
  pillW = Math.min(pillW, maxW);
  const px = x + maxW - pillW;
  const grad = ctx.createLinearGradient(px, y, px + pillW, y);
  grad.addColorStop(0, '#f7c948');
  grad.addColorStop(1, '#f0a832');
  ctx.fillStyle = grad;
  roundRect(ctx, px, y, pillW, h, h / 2);
  ctx.fill();
  ctx.fillStyle = '#241016';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = `${fs}px Anton, sans-serif`;
  ctx.fillText(label, px + gap, y + h / 2 + h * 0.03);
  let sx = px + gap + labelW + gap;
  const cy = y + h / 2;
  for (let i = 0; i < 5; i++) {
    const cx = sx + starR;
    starPath(ctx, cx, cy, starR);
    if (i < 4) {
      ctx.fillStyle = '#241016';
      ctx.fill();
    } else {
      ctx.strokeStyle = 'rgba(36, 16, 22, 0.75)';
      ctx.lineWidth = Math.max(1.5, h * 0.05);
      ctx.stroke();
    }
    sx += starR * 2 + gap;
  }
  return pillW;
}

// The round EST. 2026 badge: gold ring, dark disc, two lines of text.
export function drawEstBadge(ctx, cx, cy, r) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#241016';
  ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.1);
  ctx.strokeStyle = '#f7c948';
  ctx.stroke();
  ctx.fillStyle = '#f7c948';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${r * 0.42}px Bebas Neue, sans-serif`;
  ctx.fillText('EST.', cx, cy - r * 0.22);
  ctx.font = `${r * 0.52}px Bebas Neue, sans-serif`;
  ctx.fillText('2026', cx, cy + r * 0.3);
  ctx.restore();
}

// The NOW SHOWING ribbon: a gold diagonal sash across the band's
// top-right corner, on the 45-degree chord from the band's top edge to
// its right edge, with the words set in dark Bebas along the sash. The
// sash is a band of constant width (not a triangle), so the words have
// the full chord to sit on and never straddle an edge: the font shrinks
// until the words fit the chord, and caps at a size that leaves a
// margin inside the band's width. If they cannot fit at the smallest
// readable size, the ribbon draws nothing instead of a bare triangle.
export function drawRibbon(ctx, bandX, bandY, bandW, bandH) {
  const run = bandH * 0.5;
  const x0 = bandX + bandW - run;
  const y0 = bandY;
  const x1 = bandX + bandW;
  const y1 = bandY + run;
  const chord = Math.hypot(x1 - x0, y1 - y0);
  const sashW = run * 0.55;
  const words = 'NOW SHOWING';
  let fs = Math.min(bandH * 0.26, sashW * 0.6);
  const minFs = 10;
  ctx.font = `${fs}px Bebas Neue, sans-serif`;
  while (fs > minFs && ctx.measureText(words).width > chord * 0.85) {
    fs -= 1;
    ctx.font = `${fs}px Bebas Neue, sans-serif`;
  }
  if (ctx.measureText(words).width > chord * 0.85) return;
  // The sash is a band of constant width along the chord, but
  // asymmetric: it reaches far toward the corner and only just past the
  // words on the badge side, so it never covers the EST. badge sitting
  // below it. The words sit on the chord itself.
  const towardCorner = (sashW * 0.6) / Math.SQRT2;
  const towardBadge = fs * 0.65 + 2;
  const bx = towardBadge / Math.SQRT2;
  ctx.save();
  ctx.fillStyle = '#f7c948';
  ctx.beginPath();
  ctx.moveTo(x0 + towardCorner, y0 - towardCorner);
  ctx.lineTo(x1 + towardCorner, y1 - towardCorner);
  ctx.lineTo(x1 - bx, y1 + bx);
  ctx.lineTo(x0 - bx, y0 + bx);
  ctx.closePath();
  ctx.fill();
  ctx.translate((x0 + x1) / 2, (y0 + y1) / 2);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = '#241016';
  ctx.font = `${fs}px Bebas Neue, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(words, 0, 0);
  ctx.restore();
}

// The FRESH INK starburst sticker: a pink spiked disc with two lines of
// white text, drawn at the top-left of the art area.
export function drawStarburst(ctx, cx, cy, r, top, bottom) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  const spikes = 14;
  for (let i = 0; i < spikes * 2; i++) {
    const ang = (i * Math.PI) / spikes - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.72;
    const px = Math.cos(ang) * rad;
    const py = Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = '#ff5d8f';
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${r * 0.34}px Anton, sans-serif`;
  ctx.fillText(top, 0, -r * 0.2);
  ctx.fillText(bottom, 0, r * 0.22);
  ctx.restore();
}
