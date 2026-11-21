// The cover renderer: turns a document and its loaded photos into the
// finished poster on a canvas. The cover is two bands — the panel band on
// top (62%) and the title field below (38%) — and every cover carries the
// same seven finish systems: callout tags on the panels, the gold seal,
// the volume tag, COMING SOON, the review-quote bar, the billing block
// and the barcode. The renderer never fetches anything: photos come in
// as the loaded `images` map, fonts are the local files under app/fonts.
// A missing photo draws a dark placeholder instead of throwing, so a
// half-loaded document still renders.
import { planCover, BORDER } from '../layouts/plan-cover.js';
import { drawPanelPhoto } from '../effects/poster-photo.js';
import { gradientFor } from '../lettering/title-styles.js';
import { drawBillingBlock, drawBarcode, drawSeal, drawVolTag, drawComingSoon } from '../lettering/poster-finish.js';

const GOLD = '#e8a317';
const PAPER = '#f6efe4';
const INK = '#141210';

function imgOf(images, src) {
  if (!images) return null;
  if (typeof images.get === 'function') return images.get(src) || null;
  return images[src] || null;
}

function shade(rgb, factor) {
  const mix = (v) => Math.max(0, Math.min(255, Math.round(v * factor)));
  return `rgb(${mix(rgb[0])}, ${mix(rgb[1])}, ${mix(rgb[2])})`;
}

// The callout tag chip on a panel: a black chip with a gold leading edge.
// tagDy drops the chip lower when it would collide with the COMING SOON
// flag (the top-left panel's chip sits below the flag, not under it).
function tagChip(ctx, rect, text, tagDy = 0) {
  const h = Math.max(20, Math.round(rect.h * 0.13));
  ctx.font = `700 ${Math.round(h * 0.52)}px Oswald, "Archivo Black", sans-serif`;
  const w = ctx.measureText(text).width + h * 0.9;
  const x = rect.x + 4;
  const y = rect.y + 4 + tagDy;
  ctx.fillStyle = 'rgba(12, 10, 10, 0.92)';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = GOLD;
  ctx.fillRect(x, y, Math.max(3, h * 0.14), h);
  ctx.fillStyle = PAPER;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + h * 0.42, y + h / 2 + 1);
}

// One panel: white frame, graded photo, tag chip, and a gold corner tick
// when the user marked a face in it.
function panel(ctx, p, doc, images, grade, tagDy) {
  const r = p.rect;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  const inner = { x: r.x + BORDER, y: r.y + BORDER, w: r.w - BORDER * 2, h: r.h - BORDER * 2 };
  const img = imgOf(images, p.photo);
  if (img) {
    drawPanelPhoto(ctx, img, inner, p, doc.look, grade);
  } else {
    ctx.fillStyle = '#241d22';
    ctx.fillRect(inner.x, inner.y, inner.w, inner.h);
  }
  if (p.tagOn && p.tag) tagChip(ctx, inner, p.tag.toUpperCase(), tagDy);
  if (p.faceMarked) {
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.arc(r.x + r.w - 14, r.y + 14, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Palm silhouettes for the 'palms' title field: trunks and fronds drawn
// as curves in a tone just lighter than the field behind them.
function palms(ctx, field, tone) {
  ctx.save();
  ctx.strokeStyle = tone;
  ctx.fillStyle = tone;
  ctx.lineWidth = Math.max(3, field.h * 0.02);
  const tree = (bx, by, s, lean) => {
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx + lean * s, by - s * 0.55, bx + lean * 1.4 * s, by - s);
    ctx.stroke();
    const tx = bx + lean * 1.4 * s;
    const ty = by - s;
    for (let i = 0; i < 6; i++) {
      const ang = Math.PI * (0.08 + i * 0.17);
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.quadraticCurveTo(tx + Math.cos(ang) * s * 0.5, ty - Math.sin(ang) * s * 0.42, tx + Math.cos(ang) * s * 0.85, ty + s * 0.12);
      ctx.stroke();
    }
  };
  tree(field.x + field.w * 0.03, field.y + field.h, field.h * 0.5, 0.5);
  tree(field.x + field.w * 0.97, field.y + field.h, field.h * 0.42, -0.5);
  ctx.restore();
}

// A retro perspective grid floor for the 'grid' title field.
function gridFloor(ctx, field, tone) {
  ctx.save();
  ctx.strokeStyle = tone;
  ctx.lineWidth = Math.max(1, field.h * 0.008);
  const vx = field.x + field.w / 2;
  const vy = field.y + field.h * 0.18;
  for (let i = -8; i <= 8; i++) {
    ctx.beginPath();
    ctx.moveTo(vx + i * field.w * 0.09, vy);
    ctx.lineTo(vx + i * field.w * 0.22, field.y + field.h);
    ctx.stroke();
  }
  for (let i = 0; i < 6; i++) {
    const y = field.y + field.h * (0.18 + 0.82 * (i / 5) * (i / 5));
    ctx.beginPath();
    ctx.moveTo(field.x, y);
    ctx.lineTo(field.x + field.w, y);
    ctx.stroke();
  }
  ctx.restore();
}

// A skyline silhouette for the 'skyline' title field, with a few lit
// windows in gold.
function skyline(ctx, field, tone) {
  ctx.save();
  ctx.fillStyle = tone;
  let x = field.x;
  let seed = 1234567;
  while (x < field.x + field.w) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    const bw = field.w * (0.04 + (seed % 40) / 1000);
    const bh = field.h * (0.25 + (seed % 55) / 100);
    ctx.fillRect(x, field.y + field.h - bh, bw, bh);
    if ((seed >> 3) % 3 === 0) {
      ctx.fillStyle = 'rgba(232, 163, 23, 0.5)';
      ctx.fillRect(x + bw * 0.3, field.y + field.h - bh * 0.7, bw * 0.16, bh * 0.12);
      ctx.fillStyle = tone;
    }
    x += bw + field.w * 0.008;
  }
  ctx.restore();
}

// The title field: gradient ground, motif, script line, giant chrome
// title, gold ribbon, five-star review bar, billing, barcode. The script
// line is centred in the space left of the barcode, so a long script
// never runs underneath it.
function titleField(ctx, plan, doc) {
  const f = plan.field;
  const cap = plan.caption;
  const grade = plan.grade;
  const bg = ctx.createLinearGradient(0, f.y, 0, f.y + f.h);
  bg.addColorStop(0, shade(grade.shadow, 0.9));
  bg.addColorStop(1, '#0a080a');
  ctx.fillStyle = bg;
  ctx.fillRect(f.x, f.y, f.w, f.h);
  if (cap.field === 'grid') gridFloor(ctx, f, 'rgba(140, 190, 255, 0.10)');
  else if (cap.field === 'skyline') skyline(ctx, f, 'rgba(255, 255, 255, 0.06)');
  else palms(ctx, f, 'rgba(255, 255, 255, 0.055)');
  ctx.fillStyle = GOLD;
  ctx.fillRect(f.x, f.y, f.w, Math.max(3, f.h * 0.012));
  // Barcode, top-right of the field; the script centres left of it.
  const bcW = Math.min(150, f.w * 0.11);
  const bcX = f.x + f.w - bcW - f.w * 0.02;
  drawBarcode(ctx, bcX, f.y + f.h * 0.06, bcW, f.h * 0.17, cap.id);
  const scriptCentre = f.x + (bcX - f.x) / 2;
  // Script line in Mr Dafoe, above the title.
  const style = plan.style;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const scriptSize = Math.round(f.h * 0.15);
  ctx.font = `${scriptSize}px "Mr Dafoe", cursive`;
  ctx.fillStyle = style.mid;
  ctx.fillText(cap.script, scriptCentre, f.y + f.h * 0.15);
  // The giant title: fit to 86% of the field width, lifted by the slider.
  const lift = (doc.look.titleLift || 0) * (f.h / 220);
  let size = Math.round(f.h * 0.44 * ((doc.look.titleSize || 100) / 100));
  const face = (s) => `${s}px Anton, "Archivo Black", sans-serif`;
  ctx.font = face(size);
  while (size > 20 && ctx.measureText(cap.title).width > f.w * 0.86) {
    size = Math.floor(size * 0.94);
    ctx.font = face(size);
  }
  const titleY = f.y + f.h * 0.42 + lift;
  ctx.save();
  ctx.shadowColor = style.glow;
  ctx.shadowBlur = Math.round(size * 0.22);
  ctx.lineWidth = Math.max(2, size * 0.045);
  ctx.strokeStyle = style.edge;
  ctx.strokeText(cap.title, f.x + f.w / 2, titleY);
  ctx.fillStyle = gradientFor(ctx, style, { y: titleY - size * 0.5, h: size });
  ctx.fillText(cap.title, f.x + f.w / 2, titleY);
  ctx.restore();
  // Gold ribbon with the tagline.
  const ribbonH = Math.round(f.h * 0.115);
  const ribbonY = f.y + f.h * 0.60;
  const ribbonW = f.w * 0.72;
  ctx.fillStyle = GOLD;
  ctx.fillRect(f.x + (f.w - ribbonW) / 2, ribbonY, ribbonW, ribbonH);
  ctx.fillStyle = INK;
  ctx.font = `700 ${Math.round(ribbonH * 0.52)}px Oswald, "Archivo Black", sans-serif`;
  ctx.fillText(cap.tagline.toUpperCase(), f.x + f.w / 2, ribbonY + ribbonH / 2 + 1);
  // Five stars, the quote and its outlet, centred as one line.
  const reviewY = f.y + f.h * 0.77;
  const stars = '\u2605\u2605\u2605\u2605\u2605 ';
  const rest = `"${cap.quote}" \u2014 ${cap.outlet}`;
  ctx.font = `600 ${Math.round(f.h * 0.065)}px Oswald, sans-serif`;
  const starsW = ctx.measureText(stars).width;
  const restW = ctx.measureText(rest).width;
  const startX = f.x + f.w / 2 - (starsW + restW) / 2;
  ctx.textAlign = 'left';
  ctx.fillStyle = GOLD;
  ctx.fillText(stars, startX, reviewY);
  ctx.fillStyle = PAPER;
  ctx.fillText(rest, startX + starsW, reviewY);
  ctx.textAlign = 'center';
  // Billing, one line, shrink-to-fit.
  drawBillingBlock(ctx, { x: f.x + f.w * 0.06, y: f.y + f.h * 0.86, w: f.w * 0.88, h: f.h * 0.11 }, cap.billing);
}

// Render a document onto a context. opts: { scale } renders at a
// different pixel size than the plan's own (the preview does this).
export function renderCover(ctx, doc, images, opts = {}) {
  const plan = planCover(doc, opts.size);
  const scale = opts.scale || 1;
  ctx.save();
  if (scale !== 1) ctx.scale(scale, scale);
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, plan.w, plan.h);
  // The top-left panel's tag drops below the COMING SOON flag.
  const flagDrop = Math.round(plan.w * 0.028);
  for (const p of plan.panels) {
    const topLeft = p.rect.x < 20 && p.rect.y < 20;
    panel(ctx, p, doc, images, plan.grade, topLeft ? flagDrop : 0);
  }
  drawComingSoon(ctx, plan.panelArea.x + 12, plan.panelArea.y + 10, plan.w);
  const volH = Math.round(plan.w * 0.024);
  drawVolTag(ctx, plan.panelArea.x + 12, plan.panelArea.y + plan.panelArea.h - volH - 10, plan.caption.vol, volH);
  const sealSize = Math.round(plan.w * 0.078);
  drawSeal(ctx, plan.w - sealSize - 12, plan.panelArea.y + 8, sealSize);
  titleField(ctx, plan, doc);
  ctx.restore();
  return plan;
}

// Render a document to a fresh canvas at the plan's size (or at
// opts.width/opts.height) and return the canvas.
export function renderCoverToCanvas(doc, images, opts = {}) {
  const plan = planCover(doc, opts.size);
  const w = opts.width || plan.w;
  const h = opts.height || plan.h;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  renderCover(ctx, doc, images, { ...opts, scale: w / plan.w });
  return canvas;
}
