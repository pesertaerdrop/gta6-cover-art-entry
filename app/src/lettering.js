// lettering.js — the cover's words. Anton title, auto-fit to the band
// with a sunset gradient, a dark outline and a hard offset shadow;
// Kaushan Script neon subtitle overlapping the caps; Bebas Neue
// tagline on a black bar. One voice per line, no mixed emphasis.

// Fit the title in Anton so it spans the band without overflowing.
export function fitTitleFont(ctx, title, maxW, startSize) {
  let size = startSize;
  ctx.font = `${size}px Anton, sans-serif`;
  while (size > 12 && ctx.measureText(title).width > maxW) {
    size = Math.floor(size * 0.92);
    ctx.font = `${size}px Anton, sans-serif`;
  }
  return size;
}

export function drawCoverTitle(ctx, title, x, y, maxW, capH) {
  const size = fitTitleFont(ctx, title, maxW, capH);
  const grad = ctx.createLinearGradient(0, y - size * 0.72, 0, y + size * 0.28);
  grad.addColorStop(0, "#ffd76a");
  grad.addColorStop(0.45, "#ff9e3d");
  grad.addColorStop(0.75, "#ff5f7e");
  grad.addColorStop(1, "#ff3d7e");
  ctx.save();
  ctx.textBaseline = "alphabetic";
  ctx.font = `${size}px Anton, sans-serif`;
  // hard offset shadow, then outline, then the gradient fill
  ctx.fillStyle = "rgba(10,3,5,0.85)";
  ctx.fillText(title, x + size * 0.06, y + size * 0.06);
  ctx.lineWidth = Math.max(2, size * 0.06);
  ctx.strokeStyle = "#14060a";
  ctx.lineJoin = "round";
  ctx.strokeText(title, x, y);
  ctx.fillStyle = grad;
  ctx.fillText(title, x, y);
  ctx.restore();
  return size;
}

// Neon script subtitle: Kaushan Script in pink with a soft glow, drawn
// to sit just inside the title caps.
export function drawScriptSubtitle(ctx, subtitle, x, y, maxW, size) {
  ctx.save();
  ctx.font = `${size}px "Kaushan Script", cursive`;
  let s = size;
  while (s > 10 && ctx.measureText(subtitle).width > maxW) {
    s = Math.floor(s * 0.92);
    ctx.font = `${s}px "Kaushan Script", cursive`;
  }
  ctx.shadowColor = "#ff5f9e";
  ctx.shadowBlur = s * 0.45;
  ctx.fillStyle = "#ffd7e8";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(subtitle, x, y);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ff9ec4";
  ctx.fillText(subtitle, x, y);
  ctx.restore();
  return s;
}

// Tagline bar: a black strip with Bebas Neue caps, letter-spaced.
export function drawTaglineBar(ctx, tagline, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = "rgba(8,3,5,0.92)";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#ffe9c4";
  ctx.font = `700 ${Math.round(h * 0.58)}px "Bebas Neue", sans-serif`;
  ctx.textBaseline = "middle";
  const text = tagline.toUpperCase();
  const tw = ctx.measureText(text).width;
  const gap = Math.max(0, (w - tw) / Math.max(1, text.length));
  let cx = x + gap / 2;
  for (const ch of text) {
    ctx.fillText(ch, cx, y + h / 2 + h * 0.03);
    cx += ctx.measureText(ch).width + gap;
  }
  ctx.restore();
}
