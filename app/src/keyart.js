// keyart.js — the title band's extras, all drawn in canvas code:
// a seeded skyline strip, a star pill, the EST. 2026 badge, a corner
// sash (on the band, never over a photo) and a starburst sticker.
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

// FNV-1a over the title text: the skyline seed.
export function hashSeed(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  let state = seed;
  return function () {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let mix = Math.imul(state ^ (state >>> 15), 1 | state);
    mix = (mix + Math.imul(mix ^ (mix >>> 7), 61 | mix)) ^ mix;
    return ((mix ^ (mix >>> 14)) >>> 0) / 4294967296;
  };
}

// Starburst sticker: a spiked disc with two lines of text, stuck on
// the art area's top-left corner at a slight tilt.
export function drawStarburst(ctx, cx, cy, r, line1, line2) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.12);
  const points = 14;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const theta = (i * Math.PI) / points;
    const rr = i % 2 === 0 ? r : r * 0.78;
    const px = Math.cos(theta) * rr;
    const py = Math.sin(theta) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = "#ff5f7e";
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
    const theta = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    const px = cx + Math.cos(theta) * rr;
    const py = cy + Math.sin(theta) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Star pill: a rounded pill holding five stars, four lit — the cover's
// "heat" meter, drawn on the title band. The stars shrink to fit the
// pill instead of spilling past its right end on tall covers.
export function drawStarPill(ctx, x, y, w, h, lit = 4) {
  ctx.save();
  ctx.fillStyle = "#f5b942";
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = "#14060a";
  ctx.font = `700 ${Math.round(h * 0.52)}px "Bebas Neue", sans-serif`;
  ctx.textBaseline = "middle";
  ctx.fillText("HEAT", x + h * 0.45, y + h / 2 + h * 0.03);
  const wordW = ctx.measureText("HEAT").width;
  const space = w - h * 0.45 - wordW - h * 0.35 - h * 0.25;
  const radius = Math.max(h * 0.12, Math.min(h * 0.26, space / (5 * 2.3)));
  const pitch = radius * 2.3;
  const startX = x + h * 0.45 + wordW + h * 0.35;
  for (let i = 0; i < 5; i++) {
    drawStar(ctx, startX + i * pitch + radius, y + h / 2, radius, i < lit ? "#14060a" : "rgba(20,6,10,0.28)");
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

// Corner sash on the title band (never over a photo): a gold band on
// the diagonal across the band's top-right corner, dark words on it.
//
// The sash's centreline is the 45-degree chord from the band's top
// edge to its right edge, so the words sit inside the band instead of
// being clipped to a bare triangle (the v4 sash was centred on the
// corner point itself, and the band's clip ate the whole text). The
// font shrinks until NOW SHOWING fits the chord; if the words cannot
// fit even at the smallest readable size, it draws nothing — a stray
// triangle is worse than no sash.
export function drawCornerRibbon(ctx, x, y, w, h, text) {
  const run = h * 0.5; // run along the top + right edges from the corner
  const diag = run * Math.SQRT2; // the chord the words must fit
  let size = Math.round(h * 0.09);
  ctx.font = `700 ${size}px "Bebas Neue", sans-serif`;
  let textW = ctx.measureText(text).width;
  while (size > 10 && textW > diag - size) {
    size -= 1;
    ctx.font = `700 ${size}px "Bebas Neue", sans-serif`;
    textW = ctx.measureText(text).width;
  }
  if (size <= 10 || textW > diag - size) return false;
  const thick = size * 1.5;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  // The chord's midpoint: half a run in from the top-right corner.
  ctx.translate(x + w - run / 2, y + run / 2);
  ctx.rotate(Math.PI / 4);

  // Hard offset shadow, then the gold sash (longer than the chord,
  // so its ends are cut clean by the band's top and right edges),
  // then the words, then a dark rule along the lower edge.
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(-diag, -thick / 2 + 3, diag * 2, thick);
  ctx.fillStyle = "#f5b942";
  ctx.fillRect(-diag, -thick / 2, diag * 2, thick);

  ctx.fillStyle = "#14060a";
  ctx.font = `700 ${size}px "Bebas Neue", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 0, 1);

  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(-diag, thick / 2 - 2, diag * 2, 2);
  ctx.restore();
  return true;
}

// Skyline strip: seeded towers with lit windows, a pink rim glow along
// the rooflines and two palm silhouettes. Drawn at the top edge of the
// title band, under the title.
export function drawSkyline(ctx, x, y, w, h, seedText) {
  const rand = mulberry32(hashSeed(seedText));
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
  let towerX = x;
  while (towerX < x + w) {
    const towerW = w * (0.05 + rand() * 0.07);
    const towerH = h * (0.35 + rand() * 0.6);
    const top = y + h - towerH;
    ctx.fillStyle = "#0d0508";
    ctx.fillRect(towerX, top, towerW, towerH);
    // lit windows
    const columns = Math.max(1, Math.floor(towerW / (w * 0.012)));
    const rows = Math.max(1, Math.floor(towerH / (h * 0.22)));
    for (let c = 0; c < columns; c++) {
      for (let r = 0; r < rows; r++) {
        if (rand() < 0.42) {
          ctx.fillStyle = rand() < 0.7 ? "#ffcf7d" : "#ff8fb0";
          ctx.fillRect(
            towerX + (c + 0.25) * (towerW / columns),
            top + (r + 0.25) * (towerH / rows),
            Math.max(1, towerW / columns / 3),
            Math.max(1, towerH / rows / 3)
          );
        }
      }
    }
    // antenna on the tallest
    if (towerH > h * 0.8) {
      ctx.fillStyle = "#0d0508";
      ctx.fillRect(towerX + towerW / 2 - 1, top - h * 0.16, 2, h * 0.16);
      ctx.fillStyle = "#ff5f7e";
      ctx.beginPath();
      ctx.arc(towerX + towerW / 2, top - h * 0.16, Math.max(1.5, w * 0.002), 0, Math.PI * 2);
      ctx.fill();
    }
    towerX += towerW + w * 0.012;
  }
  // palm silhouettes
  for (const trunkX of [x + w * 0.08, x + w * 0.9]) {
    ctx.strokeStyle = "#0d0508";
    ctx.lineWidth = Math.max(2, w * 0.004);
    ctx.beginPath();
    ctx.moveTo(trunkX, y + h);
    ctx.quadraticCurveTo(trunkX + w * 0.01, y + h * 0.45, trunkX + w * 0.02, y + h * 0.2);
    ctx.stroke();
    ctx.lineWidth = Math.max(1.5, w * 0.003);
    for (let f = 0; f < 5; f++) {
      const a = Math.PI * (0.15 + f * 0.18);
      ctx.beginPath();
      ctx.moveTo(trunkX + w * 0.02, y + h * 0.2);
      ctx.quadraticCurveTo(
        trunkX + w * 0.02 + Math.cos(a) * w * 0.05,
        y + h * 0.2 - Math.sin(a) * h * 0.28,
        trunkX + w * 0.02 + Math.cos(a) * w * 0.075,
        y + h * 0.2 - Math.sin(a) * h * 0.12
      );
      ctx.stroke();
    }
  }
  ctx.restore();
}
