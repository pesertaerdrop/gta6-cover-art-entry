// lettering.js — the cover's words.
//
// Anton title, auto-fit to the band with a sunset gradient, a dark
// outline and a hard offset shadow; Kaushan Script neon subtitle
// tucked under the caps; Bebas Neue tagline on a black bar. One voice
// per line, no mixed emphasis.

// Shrink the title in Anton until it fits maxW, starting at startSize.
export function fitTitleFont(ctx, title, maxW, startSize) {
  let size = startSize;
  ctx.font = `${size}px Anton, sans-serif`;
  while (size > 12 && ctx.measureText(title).width > maxW) {
    size = Math.floor(size * 0.92);
    ctx.font = `${size}px Anton, sans-serif`;
  }
  return size;
}

// The big title: a sunset gradient over a dark outline, with a hard
// offset shadow behind it. The gradient runs top to bottom of the caps.
export function drawCoverTitle(ctx, title, x, baselineY, maxW, capH) {
  const fontSize = fitTitleFont(ctx, title, maxW, capH);
  const gradient = ctx.createLinearGradient(0, baselineY - fontSize * 0.72, 0, baselineY + fontSize * 0.28);
  gradient.addColorStop(0, "#ffd76a");
  gradient.addColorStop(0.45, "#ff9e3d");
  gradient.addColorStop(0.75, "#ff5f7e");
  gradient.addColorStop(1, "#ff3d7e");
  ctx.save();
  ctx.textBaseline = "alphabetic";
  ctx.font = `${fontSize}px Anton, sans-serif`;
  // hard offset shadow, then outline, then the gradient fill
  ctx.fillStyle = "rgba(10,3,5,0.85)";
  ctx.fillText(title, x + fontSize * 0.06, baselineY + fontSize * 0.06);
  ctx.lineWidth = Math.max(2, fontSize * 0.06);
  ctx.strokeStyle = "#14060a";
  ctx.lineJoin = "round";
  ctx.strokeText(title, x, baselineY);
  ctx.fillStyle = gradient;
  ctx.fillText(title, x, baselineY);
  ctx.restore();
  return fontSize;
}

// Neon script subtitle: Kaushan Script in pink with a soft glow, drawn
// to sit just under the title caps. Drawn twice — a pale pass with
// the glow, then a pink pass without it — so the glow never muddies
// the letterforms.
export function drawScriptSubtitle(ctx, subtitle, x, baselineY, maxW, size) {
  ctx.save();
  let s = size;
  ctx.font = `${s}px "Kaushan Script", cursive`;
  while (s > 10 && ctx.measureText(subtitle).width > maxW) {
    s = Math.floor(s * 0.92);
    ctx.font = `${s}px "Kaushan Script", cursive`;
  }
  ctx.shadowColor = "#ff5f9e";
  ctx.shadowBlur = s * 0.45;
  ctx.fillStyle = "#ffd7e8";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(subtitle, x, baselineY);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ff9ec4";
  ctx.fillText(subtitle, x, baselineY);
  ctx.restore();
  return s;
}

// Tagline bar: a black strip with Bebas Neue caps, letter-spaced so
// the words spread evenly across the cover width.
export function drawTaglineBar(ctx, tagline, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = "rgba(8,3,5,0.92)";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#ffe9c4";
  ctx.font = `700 ${Math.round(h * 0.58)}px "Bebas Neue", sans-serif`;
  ctx.textBaseline = "middle";
  const words = tagline.toUpperCase();
  const plainWidth = ctx.measureText(words).width;
  const spacing = Math.max(0, (w - plainWidth) / Math.max(1, words.length));
  let cursorX = x + spacing / 2;
  for (const ch of words) {
    ctx.fillText(ch, cursorX, y + h / 2 + h * 0.03);
    cursorX += ctx.measureText(ch).width + spacing;
  }
  ctx.restore();
}
