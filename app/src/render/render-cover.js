// Rendering a cover.
//
// A cover is two parts: the panels across the top 62%, and the title
// field across the bottom 38% — a clean, dark space with the script,
// the giant chrome title, the ribbon, the review bar and the billing.
// The panels never cover the title and the title never covers a face:
// the title lives in its own field, and the callout tags sit inside
// their panels. The seal, the volume tag and COMING SOON ride on the
// panels; the barcode rides in the title field.
import { planCover, BORDER } from '../layouts/plan-cover.js';
import { gradeById } from '../effects/grade-presets.js';
import { drawPanelPhoto } from '../effects/poster-photo.js';
import { resolveTitleStyle, gradientFor } from '../lettering/title-styles.js';
import { drawBillingBlock, drawBarcode, drawSeal, drawVolTag, drawComingSoon } from '../lettering/poster-finish.js';

const GOLD = '#e8a317';
const PAPER = '#f6efe4';
const INK = '#141210';

// Find the loaded image for a source path.
function imgOf(images, src) {
  if (images instanceof Map) return images.get(src) || null;
  return images[src] || null;
}

// The callout tag chip: a black chip with a gold left edge, carrying
// the panel's tag in white. `dy` drops it below COMING SOON on the
// top-left panel.
function tagChip(ctx, rect, text, dy = 0) {
  const h = Math.max(20, rect.h * 0.09);
  ctx.font = `700 ${h * 0.52}px Oswald, sans-serif`;
  const w = ctx.measureText(text).width + h * 1.1;
  const x = rect.x + 4;
  const y = rect.y + 4 + dy;
  ctx.fillStyle = INK;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = GOLD;
  ctx.fillRect(x, y, 4, h);
  ctx.fillStyle = PAPER;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + 10, y + h / 2 + 1);
}

// One panel: its photo, a dark frame, and its tag.
function panel(ctx, p, doc, images, grade, dy) {
  const img = imgOf(images, p.photo);
  if (img) drawPanelPhoto(ctx, img, p.rect, p, doc.look, grade);
  else {
    ctx.fillStyle = '#2a2521';
    ctx.fillRect(p.rect.x, p.rect.y, p.rect.w, p.rect.h);
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.strokeRect(p.rect.x + 2, p.rect.y + 2, p.rect.w - 4, p.rect.h - 4);
  if (p.tagOn && p.tag) tagChip(ctx, p.rect, p.tag, dy);
}

// Palm silhouettes for the title field: a few leaning trunks with
// fronds, drawn faint so the title stays the star.
function palms(ctx, field, tone) {
  ctx.save();
  ctx.strokeStyle = tone;
  ctx.fillStyle = tone;
  ctx.lineWidth = Math.max(3, field.w * 0.004);
  const spots = [
    { x: field.w * 0.06, h: field.h * 0.85, lean: -0.25 },
    { x: field.w * 0.94, h: field.h * 0.8, lean: 0.25 },
    { x: field.w * 0.16, h: field.h * 0.6, lean: -0.15 },
  ];
  for (const spot of spots) {
    const baseX = spot.x;
    const baseY = field.y + field.h;
    const topX = baseX + spot.lean * field.h;
    const topY = field.y + field.h - spot.h;
    ctx.beginPath();
    ctx.moveTo(baseX, baseY);
    ctx.quadraticCurveTo(baseX + spot.lean * field.h * 0.5, baseY - spot.h * 0.6, topX, topY);
    ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const angle = -Math.PI * (0.15 + i * 0.14);
      const len = field.h * 0.28;
      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.quadraticCurveTo(
        topX + Math.cos(angle) * len * 0.6,
        topY + Math.sin(angle) * len * 0.6 - field.h * 0.05,
        topX + Math.cos(angle) * len,
        topY + Math.sin(angle) * len + field.h * 0.12,
      );
      ctx.stroke();
    }
  }
  ctx.restore();
}

// A retro grid floor: horizontal lines and verticals that converge
// toward a vanishing point, faint, for the grid motif.
function gridFloor(ctx, field, tone) {
  ctx.save();
  ctx.strokeStyle = tone;
  ctx.lineWidth = 1;
  const horizon = field.y + field.h * 0.3;
  for (let i = 0; i <= 6; i++) {
    const y = horizon + ((field.y + field.h - horizon) * i * i) / 36;
    ctx.beginPath();
    ctx.moveTo(field.x, y);
    ctx.lineTo(field.x + field.w, y);
    ctx.stroke();
  }
  const cx = field.x + field.w / 2;
  for (let i = -8; i <= 8; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + i * field.w * 0.02, horizon);
    ctx.lineTo(cx + i * field.w * 0.09, field.y + field.h);
    ctx.stroke();
  }
  ctx.restore();
}

// A city skyline silhouette along the bottom of the field.
function skyline(ctx, field, tone) {
  ctx.save();
  ctx.fillStyle = tone;
  const base = field.y + field.h;
  let x = field.x;
  let i = 0;
  while (x < field.x + field.w) {
    const bw = field.w * (0.03 + ((i * 37) % 5) * 0.012);
    const bh = field.h * (0.25 + ((i * 53) % 7) * 0.09);
    ctx.fillRect(x, base - bh, bw, bh);
    if (i % 3 === 0) ctx.fillRect(x + bw * 0.3, base - bh - field.h * 0.08, bw * 0.15, field.h * 0.08);
    x += bw + field.w * 0.008;
    i += 1;
  }
  ctx.restore();
}

// The title field: gradient, motif, script, giant title, ribbon,
// review bar, billing and barcode.
function titleField(ctx, plan, doc) {
  const field = plan.field;
  const caption = plan.caption;
  const w = plan.w;
  const h = plan.h;
  const grad = ctx.createLinearGradient(0, field.y, 0, field.y + field.h);
  grad.addColorStop(0, '#17121e');
  grad.addColorStop(1, '#0c0a10');
  ctx.fillStyle = grad;
  ctx.fillRect(field.x, field.y, field.w, field.h);
  const motifTone = 'rgba(232, 163, 23, 0.14)';
  if (caption.field === 'palms') palms(ctx, field, motifTone);
  else if (caption.field === 'grid') gridFloor(ctx, field, motifTone);
  else skyline(ctx, field, motifTone);

  const style = resolveTitleStyle(doc.titleStyle, doc.grade);
  const look = doc.look;
  // Script line, in gold script above the title.
  const scriptSize = Math.max(18, h * 0.042);
  ctx.font = `${scriptSize}px "Mr Dafoe", cursive`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = GOLD;
  const scriptY = field.y + field.h * 0.16;
  ctx.fillText(caption.script, w / 2, scriptY);
  // The giant title, fitted to about 72% of the cover width.
  let titleSize = Math.round(h * 0.155 * (look.titleSize / 100));
  ctx.font = `${titleSize}px Anton, sans-serif`;
  while (titleSize > 20 && ctx.measureText(caption.title).width > w * 0.72) {
    titleSize = Math.round(titleSize * 0.94);
    ctx.font = `${titleSize}px Anton, sans-serif`;
  }
  const titleW = ctx.measureText(caption.title).width;
  const titleRect = { x: (w - titleW) / 2, y: field.y + field.h * 0.2, w: titleW, h: titleSize };
  const titleY = titleRect.y + titleSize * 0.86 + (look.titleLift || 0) * (h / 200);
  ctx.save();
  ctx.shadowColor = style.glow;
  ctx.shadowBlur = titleSize * 0.25;
  ctx.font = `${titleSize}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(3, titleSize * 0.07);
  ctx.strokeStyle = style.outline;
  ctx.strokeText(caption.title, w / 2, titleY);
  ctx.fillStyle = gradientFor(ctx, style, { x: titleRect.x, y: titleRect.y, w: titleRect.w, h: titleRect.h });
  ctx.fillText(caption.title, w / 2, titleY);
  ctx.restore();
  // The ribbon under the title.
  const ribbonH = Math.max(26, h * 0.042);
  const ribbonW = Math.min(w * 0.66, titleW + w * 0.1);
  const ribbonY = field.y + field.h * 0.62;
  ctx.fillStyle = GOLD;
  ctx.fillRect((w - ribbonW) / 2, ribbonY, ribbonW, ribbonH);
  ctx.font = `700 ${ribbonH * 0.48}px Oswald, sans-serif`;
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(caption.tagline, w / 2, ribbonY + ribbonH / 2 + 1);
  // The review bar: five stars, the quote, the outlet.
  const reviewSize = Math.max(13, h * 0.02);
  const reviewY = ribbonY + ribbonH + field.h * 0.09;
  ctx.font = `${reviewSize}px Oswald, sans-serif`;
  const stars = '★★★★★';
  const starsW = ctx.measureText(stars).width;
  const quoteText = ` "${caption.quote}" — ${caption.outlet}`;
  const quoteW = ctx.measureText(quoteText).width;
  const totalW = starsW + quoteW + 10;
  let rx = (w - totalW) / 2;
  ctx.fillStyle = GOLD;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(stars, rx, reviewY);
  ctx.fillStyle = PAPER;
  ctx.fillText(quoteText, rx + starsW + 10, reviewY);
  // The billing block along the bottom.
  const billH = Math.max(20, field.h * 0.11);
  drawBillingBlock(ctx, { x: w * 0.08, y: field.y + field.h - billH - field.h * 0.04, w: w * 0.84, h: billH }, caption.billing, billH);
  // The barcode, top right of the field.
  const code = caption.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const barW = Math.round(w * 0.085);
  const barH = Math.round(field.h * 0.2);
  drawBarcode(ctx, w - barW - w * 0.02, field.y + field.h * 0.03, barW, barH, code);
}

// Draw the whole cover into the context at the plan's size.
export function renderCover(ctx, doc, images, opts = {}) {
  const plan = planCover(doc, opts.size);
  const grade = gradeById(doc.grade);
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, plan.w, plan.h);
  // The top-left panel's tag drops below COMING SOON, unless the
  // scene gave the panel its own drop (to clear something in the photo).
  const topLeft = plan.panels.reduce((best, p) => (p.rect.x + p.rect.y < best.rect.x + best.rect.y ? p : best), plan.panels[0]);
  const soonH = Math.max(16, plan.w * 0.022) + 10;
  for (const p of plan.panels) {
    const dy = p.tagDy ? p.tagDy : (p === topLeft ? soonH : 0);
    panel(ctx, p, doc, images, grade, dy);
  }
  titleField(ctx, plan, doc);
  // The finish on the panels: COMING SOON, the seal, the volume tag.
  drawComingSoon(ctx, BORDER + 4, BORDER + 2, plan.w);
  const sealSize = Math.round(plan.w * 0.085);
  drawSeal(ctx, plan.w - sealSize - 10, 8, sealSize);
  const volH = Math.max(22, plan.h * 0.032);
  drawVolTag(ctx, BORDER + 4, plan.panelH - volH - 10, plan.caption.vol, volH);
}

// Render a cover to a fresh canvas at its export size and return it.
export function renderCoverToCanvas(doc, images, opts = {}) {
  const plan = planCover(doc, opts.size);
  const canvas = document.createElement('canvas');
  canvas.width = plan.w;
  canvas.height = plan.h;
  renderCover(canvas.getContext('2d'), doc, images, opts);
  return canvas;
}
