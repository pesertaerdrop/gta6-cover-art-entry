// render-cover.js — draws a whole cover onto a canvas from a document and a
// map of loaded photos. One function, renderCover, owns the full stack:
// paper backing, graded photos per panel, white panel borders, the giant
// chrome title with its overlapping neon script and tagline ribbon, then the
// seven poster-finish elements. The same renderer draws the editor preview,
// the shot scenes, and the exported PNGs, so what the maker sees is what
// the export contains.
import { planCover } from '../layouts/plan-cover.js';
import { gradeById, buildGradeLut } from '../effects/grade-presets.js';
import { applyLookToImageData, drawHalftone, drawPanelPhoto } from '../effects/poster-photo.js';
import { resolveTitleStyle, wrapTitleLines } from '../lettering/title-styles.js';
import {
  drawCalloutTag,
  drawSeal,
  drawVolTag,
  drawQuoteBar,
  drawBillingLine,
  drawBarcode,
  barcodeNumber,
  drawComingSoon,
  drawTaglineRibbon,
} from '../lettering/poster-finish.js';

const ACCENT_BY_GRADE = {
  sunset: '#e8531f',
  'neon-night': '#e84a7a',
  'golden-hour': '#e8a317',
  'tropic-teal': '#0f7a6e',
  heatwave: '#e8531f',
  'rose-dusk': '#e84a7a',
};

export function gradedPanelImage(image, rect, slot, look, lut, draft, extraBias) {
  const scale = Math.min(1, 900 / Math.max(rect.w, rect.h));
  const w = Math.max(2, Math.round(rect.w * scale));
  const h = Math.max(2, Math.round(rect.h * scale));
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  const octx = off.getContext('2d');
  const tmpRect = { x: 0, y: 0, w, h };
  drawPanelPhoto(octx, image, tmpRect, slot, draft, extraBias);
  const data = octx.getImageData(0, 0, w, h);
  applyLookToImageData(data, look, lut, draft);
  octx.putImageData(data, 0, 0);
  return off;
}

export function renderCover(canvas, doc, images, options = {}) {
  const draft = options.draft === true;
  const plan = planCover(doc);
  const { size } = plan;
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext('2d');
  const W = size.width;
  const H = size.height;
  const look = doc.look;
  const grade = gradeById(doc.grade);
  const lut = buildGradeLut(grade, look.grade);
  const accent = ACCENT_BY_GRADE[doc.grade] ?? '#e8531f';

  ctx.fillStyle = '#f6efe4';
  ctx.fillRect(0, 0, W, H);

  for (const panel of plan.panels) {
    const { rect } = panel;
    const image = images.get(panel.slot.photo);
    ctx.save();
    if (panel.tilt) {
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate((panel.tilt * Math.PI) / 180);
      ctx.translate(-(rect.x + rect.w / 2), -(rect.y + rect.h / 2));
    }
    ctx.fillStyle = '#fff';
    ctx.fillRect(rect.x - 5, rect.y - 5, rect.w + 10, rect.h + 10);
    if (image) {
      // Panels low on the cover get extra face bias so the title band
      // never covers a marked face.
      const lowPanelBias = panel.rect.y > H * 0.45 ? 0.08 : 0;
      const graded = gradedPanelImage(image, rect, panel.slot, look, lut, draft, lowPanelBias);
      ctx.drawImage(graded, rect.x, rect.y, rect.w, rect.h);
    } else {
      ctx.fillStyle = '#d8cbb2';
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }
    drawHalftone(ctx, rect, look.halftone, draft);
    ctx.strokeStyle = 'rgba(20, 18, 16, 0.25)';
    ctx.lineWidth = 2;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
    // Tags sit at the panel bottom, except when the panel ends inside the
    // title band: then they move to the panel top so the title never covers
    // them.
    const fracBottom = (rect.y + rect.h) / H;
    const tagPlacement = fracBottom > 0.52 && fracBottom < 0.86 ? 'top' : 'bottom';
    if (panel.slot.tagOn) drawCalloutTag(ctx, rect, panel.slot.tag, accent, tagPlacement, H);
  }

  // Soft scrim behind the title so the chrome reads over bright photos.
  const scrim = ctx.createLinearGradient(0, H * 0.52, 0, H);
  scrim.addColorStop(0, 'rgba(0,0,0,0)');
  scrim.addColorStop(1, 'rgba(0,0,0,0.42)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, H * 0.52, W, H * 0.48);

  drawTitleBlock(ctx, doc, W, H);
  drawFinishLayer(ctx, doc, W, H, accent);
  return plan;
}

export function drawTitleBlock(ctx, doc, W, H) {
  const style = resolveTitleStyle(doc);
  const look = doc.look;
  const lines = wrapTitleLines(doc.title, 12);
  let fontSize = Math.round(H * 0.135 * (look.titleSize / 100));
  const maxW = W * 0.68;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  for (let attempt = 0; attempt < 8; attempt += 1) {
    ctx.font = `${fontSize}px ${style.font}, sans-serif`;
    const widest = Math.max(...lines.map((line) => ctx.measureText(line).width));
    if (widest <= maxW || fontSize <= 24) break;
    fontSize = Math.round(fontSize * (maxW / widest) * 0.97);
  }
  const lineH = fontSize * 0.92;
  const titleBottom = H * 0.74 + look.titleLift;
  const titleTop = titleBottom - lineH * lines.length;
  const gradient = ctx.createLinearGradient(0, titleTop, 0, titleBottom + fontSize * 0.2);
  for (const [at, color] of style.stops) gradient.addColorStop(at, color);
  const x = W * 0.045;
  ctx.save();
  ctx.shadowColor = style.shadow;
  ctx.shadowBlur = Math.round(fontSize * 0.18);
  ctx.shadowOffsetY = Math.round(fontSize * 0.04);
  ctx.font = `${fontSize}px ${style.font}, sans-serif`;
  ctx.fillStyle = gradient;
  ctx.strokeStyle = style.stroke;
  ctx.lineWidth = Math.max(2, Math.round(fontSize * 0.045));
  lines.forEach((line, i) => {
    const y = titleBottom - (lines.length - 1 - i) * lineH;
    ctx.strokeText(line, x, y);
    ctx.fillText(line, x, y);
  });
  ctx.restore();

  // Neon script overlapping the caps.
  const scriptSize = Math.round(H * 0.068);
  ctx.save();
  ctx.font = `${scriptSize}px "Mr Dafoe", cursive`;
  ctx.fillStyle = '#ff5fa2';
  ctx.shadowColor = '#e84a7a';
  ctx.shadowBlur = Math.round(scriptSize * 0.4);
  ctx.textAlign = 'left';
  ctx.fillText(doc.script, x + W * 0.1, titleBottom + scriptSize * 0.8);
  ctx.restore();

  // Tagline ribbon with side triangles.
  const ribbonFont = Math.round(H * 0.024);
  ctx.font = `700 ${ribbonFont}px Oswald, sans-serif`;
  const ribbonTextW = ctx.measureText(doc.tagline.toUpperCase()).width;
  const ribbonWidth = Math.min(W * 0.66, ribbonTextW + W * 0.08);
  drawTaglineRibbon(ctx, x, titleBottom + scriptSize * 1.05, ribbonWidth, doc.tagline, ribbonFont);
}

export function drawFinishLayer(ctx, doc, W, H, accent) {
  // Volume or part tag, top left.
  drawVolTag(ctx, Math.round(W * 0.03), Math.round(H * 0.025), doc.vol, Math.round(H * 0.02));
  // Seal, top right.
  const sealR = Math.round(H * 0.055);
  drawSeal(ctx, W - sealR - Math.round(W * 0.03), sealR + Math.round(H * 0.025), sealR, doc.sealText);
  // Generated barcode, top right under the seal.
  const barW = Math.round(W * 0.13);
  const barH = Math.round(H * 0.045);
  drawBarcode(ctx, W - barW - Math.round(W * 0.03), sealR * 2 + Math.round(H * 0.04), barW, barH, barcodeNumber(doc.title.length * 7919 + doc.panels.length * 131));
  // Billing: a single centred line tucked under the top row, between the
  // volume tag on the left and the seal on the right, leaving the bottom
  // band open for the callout tags. The box spans 0.10W to 0.82W, so it
  // ends before the barcode (which begins at 0.84W) and clears the volume
  // tag on the other side, with enough width for the line to fit whole.
  drawBillingLine(ctx, W * 0.10, H * 0.082, W * 0.72, doc.billing, Math.round(H * 0.014));
  // Coming soon, centred above the quote bar.
  if (doc.comingSoon) drawComingSoon(ctx, 0, H * 0.858, W, Math.round(H * 0.02));
  // Five-star review-quote bar along the bottom edge.
  drawQuoteBar(ctx, 0, H - Math.round(H * 0.052), W, doc.quote, doc.outlet, Math.round(H * 0.019));
}

export function exportCoverPng(doc, images, sizeKey) {
  const sized = { ...doc, size: sizeKey };
  const canvas = document.createElement('canvas');
  renderCover(canvas, sized, images, { draft: false });
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}
