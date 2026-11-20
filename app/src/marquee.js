// marquee.js — the title block of Sunset Strip Studio.
//
// The band carries the lettering; the art area carries the photos; the
// two never overlap. What the band shows, top to bottom: a gold rule on
// its art-side edge, palm silhouettes at both ends, a big gradient
// title in Bungee, a neon script subtitle in Sacramento glowing pink
// beneath the caps, a sunset clock badge (a half-set sun, 7:47 PM) on
// the right, and a perforated ticket-stub bar along the bottom carrying
// the tagline. The sun disc and the filmstrip sprockets live in the art
// area and are drawn from canvas.js.

export function drawSunDisc(ctx, x, y, r) {
  const g = ctx.createRadialGradient(x, y, r * 0.1, x, y, r);
  g.addColorStop(0, '#ffe9a3');
  g.addColorStop(0.45, '#ffb347');
  g.addColorStop(0.8, '#ff5e7a');
  g.addColorStop(1, 'rgba(255, 94, 122, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Filmstrip sprocket holes: dark bands along the top and bottom of the
// strip with light punched holes.
export function drawSprockets(ctx, x, y, w, h) {
  const bandH = Math.max(10, h * 0.07);
  ctx.fillStyle = '#12060f';
  ctx.fillRect(x, y, w, bandH);
  ctx.fillRect(x, y + h - bandH, w, bandH);
  ctx.fillStyle = '#f7f1e3';
  const holeW = Math.max(8, w * 0.02);
  const holeH = bandH * 0.5;
  const step = w / 16;
  for (let i = 0; i < 16; i++) {
    const hx = x + step * i + (step - holeW) / 2;
    roundRectPath(ctx, hx, y + (bandH - holeH) / 2, holeW, holeH, 3);
    ctx.fill();
    roundRectPath(ctx, hx, y + h - bandH + (bandH - holeH) / 2, holeW, holeH, 3);
    ctx.fill();
  }
}

// A simple palm silhouette: a curved trunk and five drooping fronds.
function drawPalm(ctx, x, y, s, flip) {
  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);
  ctx.strokeStyle = '#0d0510';
  ctx.fillStyle = '#0d0510';
  ctx.lineWidth = Math.max(2, s * 0.05);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(s * 0.12, -s * 0.5, s * 0.06, -s * 0.9);
  ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI * (0.12 + i * 0.15);
    ctx.beginPath();
    ctx.moveTo(s * 0.06, -s * 0.9);
    ctx.quadraticCurveTo(
      s * 0.06 + Math.cos(a) * s * 0.45, -s * 0.9 + Math.sin(a) * s * 0.45,
      s * 0.06 + Math.cos(a) * s * 0.8, -s * 0.9 + Math.sin(a) * s * 0.8 + s * 0.28,
    );
    ctx.stroke();
  }
  ctx.restore();
}

// Shrink a font until the text fits maxW; returns the size used.
function fitFont(ctx, text, family, maxW, startPx) {
  let px = startPx;
  while (px > 12) {
    ctx.font = `${px}px ${family}`;
    if (ctx.measureText(text).width <= maxW) return px;
    px -= 2;
  }
  return px;
}

export function drawTitleBlock(ctx, W, H, bandY, bandH, state, layout) {
  // Band background: deep purple melting into near-black.
  const bg = ctx.createLinearGradient(0, bandY, 0, bandY + bandH);
  bg.addColorStop(0, '#2a0e22');
  bg.addColorStop(1, '#12060d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, bandY, W, bandH);
  // Gold rule on the art-side edge of the band.
  ctx.fillStyle = '#ffb347';
  const ruleY = layout.band === 'top' ? bandY + bandH - 3 : bandY;
  ctx.fillRect(0, ruleY, W, 3);

  // Palms at both ends, behind the lettering.
  drawPalm(ctx, W * 0.01, bandY + bandH, bandH * 0.95, false);
  drawPalm(ctx, W * 0.99, bandY + bandH, bandH * 0.95, true);

  // Big title: Bungee, gold-to-pink gradient, hard offset shadow.
  const title = (state.title || 'SUNSET STRIP').toUpperCase();
  const tPx = fitFont(ctx, title, 'Bungee', W * 0.56, Math.round(bandH * 0.42));
  const grad = ctx.createLinearGradient(0, bandY, 0, bandY + bandH * 0.62);
  grad.addColorStop(0, '#ffe9a3');
  grad.addColorStop(0.5, '#ffb347');
  grad.addColorStop(1, '#ff5e7a');
  ctx.font = `${tPx}px Bungee`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = Math.max(2, tPx * 0.06);
  ctx.fillStyle = grad;
  ctx.fillText(title, W * 0.03, bandY + bandH * 0.32);
  ctx.shadowColor = 'transparent';
  ctx.shadowOffsetY = 0;

  // Neon script subtitle, glowing pink beneath the caps.
  const sub = state.subtitle || '';
  if (sub) {
    const sPx = Math.round(bandH * 0.24);
    ctx.font = `${sPx}px Sacramento`;
    ctx.fillStyle = '#ff7ad9';
    ctx.shadowColor = '#ff2ea6';
    ctx.shadowBlur = Math.max(8, sPx * 0.4);
    ctx.fillText(sub, W * 0.035, bandY + bandH * 0.6);
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
  }

  // Sunset clock badge: a circle, a half-set sun, the golden-hour time.
  const badgeR = bandH * 0.19;
  const bx = W - W * 0.055;
  const by = bandY + bandH * 0.36;
  ctx.save();
  ctx.beginPath();
  ctx.arc(bx, by, badgeR, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = '#1c0b1a';
  ctx.fillRect(bx - badgeR, by - badgeR, badgeR * 2, badgeR * 2);
  const sg = ctx.createLinearGradient(0, by - badgeR, 0, by + badgeR);
  sg.addColorStop(0, '#ff9a3d');
  sg.addColorStop(1, '#ff5e7a');
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.arc(bx, by + badgeR * 0.15, badgeR * 0.45, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#12060d';
  ctx.fillRect(bx - badgeR, by + badgeR * 0.15, badgeR * 2, badgeR);
  ctx.restore();
  ctx.strokeStyle = '#ffb347';
  ctx.lineWidth = Math.max(2, badgeR * 0.08);
  ctx.beginPath();
  ctx.arc(bx, by, badgeR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#ffe9a3';
  ctx.font = `${Math.round(badgeR * 0.42)}px "Lilita One"`;
  ctx.textAlign = 'center';
  ctx.fillText('7:47', bx, by + badgeR * 0.74);
  ctx.textAlign = 'left';

  // Ticket-stub tagline bar along the bottom of the band: a black strip
  // with perforation notches punched along its top edge.
  const tagH = bandH * 0.2;
  const tagY = bandY + bandH - tagH;
  ctx.fillStyle = '#0a0409';
  ctx.fillRect(0, tagY, W, tagH);
  ctx.fillStyle = '#12060d';
  const notchR = Math.max(3, tagH * 0.28);
  for (let x = W * 0.02; x < W * 0.98; x += W * 0.05) {
    ctx.beginPath();
    ctx.arc(x, tagY, notchR, 0, Math.PI * 2);
    ctx.fill();
  }
  const tag = (state.tagline || '').toUpperCase();
  if (tag) {
    const tagPx = Math.round(tagH * 0.52);
    ctx.font = `${tagPx}px "Lilita One"`;
    const spaced = tag.split('').join('\u2009');
    const tw = ctx.measureText(spaced).width;
    ctx.fillStyle = '#f7f1e3';
    ctx.fillText(spaced, (W - tw) / 2, tagY + tagH / 2);
  }
}
