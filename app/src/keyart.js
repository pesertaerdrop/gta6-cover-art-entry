// keyart.js — the title band's extras, all drawn in canvas code:
// a seeded skyline strip, a star pill, the EST. 2026 badge, a corner
// ribbon (on the band, never over a photo) and a starburst sticker.
// The skyline is seeded from the title text, so the same cover always
// draws the same skyline — the build stays deterministic.

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function hashSeed(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Starburst sticker: a spiked disc with two lines of text, placed on
// the art area's top-left corner like a stuck-on sticker.
export function drawStarburst(ctx, cx, cy, r, line1, line2) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.12);
  ctx.fillStyle = "#ff5f7e";
  ctx.beginPath();
  const spikes = 14;
  for (let i = 0; i < spikes * 2; i++) {
    const ang = (i * Math.PI) / spikes;
    const rad = i % 2 === 0 ? r : r * 0.78;
    const px = Math.cos(ang) * rad;
    const py = Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#fff3e0";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${Math.round(r * 0.42)}px "Bebas Neue", sans-serif`;
  ctx.fillText(line1, 0, -r * 0.2);
  ctx.fillText(line2, 0, r * 0.26);
  ctx.restore();
}

function drawStar(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const px = cx + Math.cos(ang) * rad;
    const py = cy + Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Star pill: a rounded pill holding five stars, four lit — the cover's
// "heat" meter, drawn on the title band.
export function drawStarPill(ctx, x, y, w, h, lit = 4) {
  ctx.save();
  ctx.fillStyle = "#f5b942";
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = "#14060a";
  ctx.font = `700 ${Math.round(h * 0.52)}px "Bebas Neue", sans-serif`;
  ctx.textBaseline = "middle";
  ctx.fillText("HEAT", x + h * 0.45, y + h / 2 + h * 0.03);
  const labelW = ctx.measureText("HEAT").width;
  // Fit the five stars inside the pill: on tall narrow covers the pill
  // is short in width but tall, so the stars shrink instead of spilling
  // past the pill's right end.
  const room = w - h * 0.45 - labelW - h * 0.35 - h * 0.25;
  const starR = Math.max(h * 0.12, Math.min(h * 0.26, room / (5 * 2.3)));
  const step = starR * 2.3;
  const firstX = x + h * 0.45 + labelW + h * 0.35;
  for (let i = 0; i < 5; i++) {
    drawStar(ctx, firstX + i * step + starR, y + h / 2, starR, i < lit ? "#14060a" : "rgba(20,6,10,0.28)");
  }
  ctx.restore();
}

// Round "EST. 2026" badge, drawn on the title band's right end.
export function drawEstBadge(ctx, cx, cy, r) {
  ctx.save();
  ctx.fillStyle = "#f5b942";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#14060a";
  ctx.lineWidth = Math.max(1, r * 0.08);
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.78, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#14060a";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${Math.round(r * 0.52)}px "Bebas Neue", sans-serif`;
  ctx.fillText("EST.", cx, cy - r * 0.22);
  ctx.fillText("2026", cx, cy + r * 0.28);
  ctx.restore();
}

// Corner ribbon on the title band (never over a photo): a diagonal
// gold ribbon across the band's top-right corner.
export function drawCornerRibbon(ctx, x, y, w, h, text) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.translate(x + w, y);
  ctx.rotate(Math.PI / 4);
  const rw = Math.max(w, h) * 0.9;
  ctx.fillStyle = "#f5b942";
  ctx.fillRect(-rw / 2, -h * 0.28, rw, h * 0.56);
  ctx.fillStyle = "#14060a";
  ctx.font = `700 ${Math.round(h * 0.34)}px "Bebas Neue", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 0, h * 0.02);
  ctx.restore();
}

// Skyline strip: seeded towers with lit windows, a pink rim glow along
// the rooflines and two palm silhouettes. Drawn at the top edge of the
// title band, under the title.
export function drawSkyline(ctx, x, y, w, h, seedText) {
  const rnd = mulberry32(hashSeed(seedText));
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  // pink rim glow along the top
  const glow = ctx.createLinearGradient(0, y, 0, y + h * 0.35);
  glow.addColorStop(0, "rgba(255,110,140,0.55)");
  glow.addColorStop(1, "rgba(255,110,140,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(x, y, w, h * 0.35);
  // towers
  let tx = x;
  while (tx < x + w) {
    const tw = w * (0.05 + rnd() * 0.07);
    const th = h * (0.35 + rnd() * 0.6);
    const top = y + h - th;
    ctx.fillStyle = "#0d0508";
    ctx.fillRect(tx, top, tw, th);
    // lit windows
    const cols = Math.max(1, Math.floor(tw / (w * 0.012)));
    const rows = Math.max(1, Math.floor(th / (h * 0.22)));
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if (rnd() < 0.42) {
          ctx.fillStyle = rnd() < 0.7 ? "#ffcf7d" : "#ff8fb0";
          ctx.fillRect(
            tx + (c + 0.25) * (tw / cols),
            top + (r + 0.25) * (th / rows),
            Math.max(1, tw / cols / 3),
            Math.max(1, th / rows / 3)
          );
        }
      }
    }
    // antenna on the tallest
    if (th > h * 0.8) {
      ctx.fillStyle = "#0d0508";
      ctx.fillRect(tx + tw / 2 - 1, top - h * 0.16, 2, h * 0.16);
      ctx.fillStyle = "#ff5f7e";
      ctx.beginPath();
      ctx.arc(tx + tw / 2, top - h * 0.16, Math.max(1.5, w * 0.002), 0, Math.PI * 2);
      ctx.fill();
    }
    tx += tw + w * 0.012;
  }
  // palm silhouettes
  for (const px of [x + w * 0.08, x + w * 0.9]) {
    ctx.strokeStyle = "#0d0508";
    ctx.lineWidth = Math.max(2, w * 0.004);
    ctx.beginPath();
    ctx.moveTo(px, y + h);
    ctx.quadraticCurveTo(px + w * 0.01, y + h * 0.45, px + w * 0.02, y + h * 0.2);
    ctx.stroke();
    ctx.lineWidth = Math.max(1.5, w * 0.003);
    for (let f = 0; f < 5; f++) {
      const a = Math.PI * (0.15 + f * 0.18);
      ctx.beginPath();
      ctx.moveTo(px + w * 0.02, y + h * 0.2);
      ctx.quadraticCurveTo(
        px + w * 0.02 + Math.cos(a) * w * 0.05,
        y + h * 0.2 - Math.sin(a) * h * 0.28,
        px + w * 0.02 + Math.cos(a) * w * 0.075,
        y + h * 0.2 - Math.sin(a) * h * 0.12
      );
      ctx.stroke();
    }
  }
  ctx.restore();
}
