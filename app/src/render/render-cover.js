// Draws a cover onto a canvas context.
//
// The frame is split in two: the mosaic region (the top 62%) holds the
// panels, and the title field (the bottom 38%) holds the title cluster —
// the script line, the giant chrome title, the tagline ribbon, the
// five-star review bar and the billing line — on a designed gradient with
// a palm, grid or skyline motif. Nothing is painted over a photo: the
// field is its own surface, so a title can never cover a face and a panel
// can never run under a letter. The seven-element poster finish is split
// between the two regions: callout tags on the panels, the seal and
// COMING SOON on the mosaic corners, the volume tag at the mosaic foot,
// and the review bar, billing and barcode inside the field.
//
// opts: { editor (draw the editor overlay), draft (fast photo pass),
// size (override the cover size, used by the export panel) }.
import { planCover, BORDER } from '../layouts/plan-cover.js';
import { drawPanelPhoto } from '../effects/poster-photo.js';
import { gradeById } from '../effects/grade-presets.js';
import { gradientFor } from '../lettering/title-styles.js';
import {
  drawBillingLine,
  drawBarcode,
  drawSeal,
  drawVolTag,
  drawComingSoon,
} from '../lettering/poster-finish.js';

// The title font per style: the chrome ramp carries the colour, the font
// carries the shape. Two heavy grotesques plus the inline display face
// for the pink-neon style.
const TITLE_FONTS = {
  'dusk-chrome': '"Archivo Black", sans-serif',
  'glacier-neon': '"Anton", sans-serif',
  'brass-gold': '"Archivo Black", sans-serif',
  'magma-edge': '"Anton", sans-serif',
  'steel-chrome': '"Anton", sans-serif',
  'pink-neon': '"Fascinate Inline", "Archivo Black", sans-serif',
};

// A small deterministic hash of a string, for the skyline motif, so the
// same title always draws the same skyline.
function hashString(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// One palm silhouette: a leaning trunk and six drooping fronds, drawn in
// near-black so it reads as a cut-out against the field gradient.
function drawPalm(ctx, x, baseY, height, lean, alpha) {
  ctx.save();
  ctx.strokeStyle = `rgba(0,0,0,${alpha})`;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(2, height * 0.028);
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.quadraticCurveTo(x + lean * 0.3, baseY - height * 0.6, x + lean, baseY - height);
  ctx.stroke();
  const crownX = x + lean;
  const crownY = baseY - height;
  ctx.lineWidth = Math.max(1.5, height * 0.02);
  const angles = [-2.79, -2.27, -1.75, -1.22, -0.7, -0.17];
  for (let i = 0; i < angles.length; i++) {
    const len = height * (0.34 + (i % 2) * 0.09);
    const tipX = crownX + Math.cos(angles[i]) * len;
    const tipY = crownY + Math.sin(angles[i]) * len * 0.75 + height * 0.14;
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(
      crownX + Math.cos(angles[i]) * len * 0.55,
      crownY + Math.sin(angles[i]) * len * 0.55 - height * 0.06,
      tipX,
      tipY,
    );
    ctx.stroke();
  }
  ctx.restore();
}

// The field's designed surface: a grade-tinted gradient, an accent rule
// along its top edge, and one of three motifs — palms at the edges, a
// retro perspective grid, or a skyline along the foot.
function drawTitleField(ctx, plan, doc) {
  const { x, y, w, h } = plan.titleField;
  const grade = gradeById(doc.grade);
  const [sr, sg, sb] = grade.shadow;
  const top = `rgb(${Math.round(sr * 0.75)},${Math.round(sg * 0.75)},${Math.round(sb * 0.75)})`;
  const gradient = ctx.createLinearGradient(0, y, 0, y + h);
  gradient.addColorStop(0, top);
  gradient.addColorStop(0.55, '#14101e');
  gradient.addColorStop(1, '#0a0810');
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, w, h);
  // The accent rule that separates the field from the mosaic.
  ctx.fillStyle = `rgba(${grade.mid[0]},${grade.mid[1]},${grade.mid[2]},0.9)`;
  ctx.fillRect(x, y, w, Math.max(2, h * 0.008));
  const motif = plan.titleFieldMotif;
  if (motif === 'palms') {
    drawPalm(ctx, x + w * 0.015, y + h * 0.98, h * 0.92, w * 0.03, 0.5);
    drawPalm(ctx, x + w * 0.985, y + h * 0.98, h * 0.8, -w * 0.025, 0.45);
  } else if (motif === 'grid') {
    ctx.save();
    ctx.strokeStyle = `rgba(${grade.mid[0]},${grade.mid[1]},${grade.mid[2]},0.16)`;
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
      const yy = y + (h * i) / 5;
      ctx.beginPath();
      ctx.moveTo(x, yy);
      ctx.lineTo(x + w, yy);
      ctx.stroke();
    }
    for (let i = -6; i <= 6; i++) {
      ctx.beginPath();
      ctx.moveTo(w / 2 + i * w * 0.02, y);
      ctx.lineTo(w / 2 + i * w * 0.13, y + h);
      ctx.stroke();
    }
    ctx.restore();
  } else {
    // Skyline: dark buildings along the foot, a few lit windows.
    const rng = mulberry32(hashString(plan.titleText || 'saltline'));
    let bx = x;
    while (bx < x + w) {
      const bw = w * (0.045 + rng() * 0.06);
      const bh = h * (0.22 + rng() * 0.42);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(bx, y + h - bh, bw, bh);
      if (rng() > 0.5) {
        ctx.fillStyle = `rgba(${grade.light[0]},${grade.light[1]},${grade.light[2]},0.5)`;
        ctx.fillRect(bx + bw * 0.3, y + h - bh * 0.7, Math.max(2, bw * 0.12), Math.max(2, bh * 0.08));
      }
      bx += bw + w * 0.012;
    }
  }
}

// The chrome title, centred in the title rect, shrunk until it fits the
// cover width. The script line sits just above the caps, overlapping them
// slightly, the way a poster script does.
function drawTitle(ctx, plan, doc) {
  const style = plan.titleStyle;
  const titleText = (plan.titleText || '').toUpperCase();
  if (!titleText) return;
  const centerX = plan.w / 2;
  const centerY = plan.titleRect.y + plan.titleRect.h / 2 + plan.titleLift;
  const font = TITLE_FONTS[style.id] || '"Anton", sans-serif';
  let size = plan.titleSize;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${size}px ${font}`;
  let width = ctx.measureText(titleText).width;
  while (width > plan.w * 0.92 && size > 40) {
    size *= 0.95;
    ctx.font = `${size}px ${font}`;
    width = ctx.measureText(titleText).width;
  }
  // Chrome caps with a glow, then a crisp stroke on top.
  ctx.save();
  ctx.font = `${size}px ${font}`;
  ctx.shadowColor = style.shadow;
  ctx.shadowBlur = size * 0.16;
  ctx.fillStyle = gradientFor(ctx, style, { x: 0, y: centerY - size / 2, w: plan.w, h: size });
  ctx.fillText(titleText, centerX, centerY);
  ctx.shadowBlur = 0;
  ctx.lineWidth = Math.max(2, size * 0.028);
  ctx.strokeStyle = style.stroke;
  ctx.strokeText(titleText, centerX, centerY);
  ctx.restore();
  // Script line, overlapping the caps, drawn last so it sits on top of
  // the title's glow, with a dark outline so it reads on any field.
  const script = doc.script || plan.caption.script;
  if (script) {
    const scriptSize = size * 0.42;
    ctx.save();
    ctx.translate(centerX, centerY - size * 0.55);
    ctx.rotate(-0.05);
    ctx.font = `${scriptSize}px "Mr Dafoe", cursive`;
    ctx.fillStyle = style.stops[1][1];
    ctx.lineWidth = Math.max(2, scriptSize * 0.1);
    ctx.strokeStyle = 'rgba(10,8,16,0.85)';
    ctx.lineJoin = 'round';
    ctx.strokeText(script, 0, 0);
    ctx.shadowColor = style.shadow;
    ctx.shadowBlur = size * 0.08;
    ctx.fillText(script, 0, 0);
    ctx.restore();
  }
}

// The tagline ribbon: a gold band with dark text, shrunk to fit.
function drawRibbon(ctx, plan, doc) {
  const r = plan.ribbonRect;
  const tagline = (doc.tagline || plan.caption.tagline || '').toUpperCase();
  if (!tagline) return;
  ctx.fillStyle = '#f5c542';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = '#1a0b2e';
  ctx.fillRect(r.x, r.y, r.w, Math.max(1, r.h * 0.06));
  ctx.fillRect(r.x, r.y + r.h - Math.max(1, r.h * 0.06), r.w, Math.max(1, r.h * 0.06));
  let fontSize = r.h * 0.55;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${fontSize}px "Oswald", sans-serif`;
  let width = ctx.measureText(tagline).width;
  while (width > r.w - 16 && fontSize > 8) {
    fontSize *= 0.92;
    ctx.font = `bold ${fontSize}px "Oswald", sans-serif`;
    width = ctx.measureText(tagline).width;
  }
  ctx.fillStyle = '#1a0b2e';
  ctx.fillText(tagline, r.x + r.w / 2, r.y + r.h / 2);
}

// The five-star review bar: gold stars, the quote in white, the outlet
// in gold, all on one centred line, shrunk to fit.
function drawReviewBar(ctx, plan, doc) {
  const q = plan.quoteRect;
  const quote = doc.quote || plan.caption.quote;
  const outlet = doc.outlet || plan.caption.outlet;
  if (!quote) return;
  let fontSize = q.h * 0.62;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const parts = [
    { text: '★★★★★ ', color: '#f5c542' },
    { text: `"${quote}" `, color: '#ffffff' },
    { text: `— ${outlet}`, color: '#f5c542' },
  ];
  const measure = (size) => {
    ctx.font = `bold ${size}px "Oswald", sans-serif`;
    return parts.reduce((sum, part) => sum + ctx.measureText(part.text).width, 0);
  };
  let total = measure(fontSize);
  while (total > q.w && fontSize > 8) {
    fontSize *= 0.92;
    total = measure(fontSize);
  }
  ctx.font = `bold ${fontSize}px "Oswald", sans-serif`;
  let x = q.x + (q.w - total) / 2;
  const y = q.y + q.h / 2;
  for (const part of parts) {
    ctx.fillStyle = part.color;
    ctx.fillText(part.text, x, y);
    x += ctx.measureText(part.text).width;
  }
}

export function renderCover(ctx, doc, images, opts = {}) {
  const plan = planCover(doc, opts.size);
  ctx.fillStyle = '#0a0810';
  ctx.fillRect(0, 0, plan.w, plan.h);
  drawTitleField(ctx, plan, doc);

  // Panels: the photo, a white border, the callout tag, and (in the
  // editor) the numbered badge, selection outline, crosshair and zoom
  // badge. The hero panel's tag drops below COMING SOON so the two never
  // collide.
  for (let i = 0; i < plan.panels.length; i++) {
    const panel = plan.panels[i];
    const img = images.get ? images.get(panel.photo) : images[panel.photo];
    if (img) {
      drawPanelPhoto(ctx, img, panel.inner, panel, doc.look, doc.grade);
    } else {
      ctx.fillStyle = '#1c1626';
      ctx.fillRect(panel.inner.x, panel.inner.y, panel.inner.w, panel.inner.h);
    }
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = BORDER;
    ctx.strokeRect(panel.rect.x + BORDER / 2, panel.rect.y + BORDER / 2, panel.rect.w - BORDER, panel.rect.h - BORDER);
    if (panel.tagOn && panel.tag) {
      const tagSize = Math.max(11, plan.w * 0.014);
      ctx.font = `bold ${tagSize}px "Oswald", sans-serif`;
      const pad = tagSize * 0.55;
      const textW = ctx.measureText(panel.tag.toUpperCase()).width;
      const tagW = textW + pad * 2;
      const tagH = tagSize * 1.7;
      const tx = panel.rect.x + 8;
      const ty = i === 0 ? panel.rect.y + 38 : panel.rect.y + 8;
      ctx.fillStyle = 'rgba(10,8,16,0.85)';
      ctx.fillRect(tx, ty, tagW, tagH);
      ctx.fillStyle = '#f5c542';
      ctx.fillRect(tx, ty, Math.max(3, tagSize * 0.25), tagH);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(panel.tag.toUpperCase(), tx + pad + Math.max(3, tagSize * 0.25), ty + tagH / 2);
    }
    if (opts.editor) {
      const badgeR = Math.max(11, plan.w * 0.012);
      const bx = panel.rect.x + panel.rect.w - badgeR - 6;
      const by = panel.rect.y + 6;
      ctx.fillStyle = i === doc.selected ? '#f5c542' : 'rgba(10,8,16,0.8)';
      ctx.beginPath();
      ctx.arc(bx + badgeR, by + badgeR, badgeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = i === doc.selected ? '#1a0b2e' : '#ffffff';
      ctx.font = `bold ${badgeR}px "Oswald", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), bx + badgeR, by + badgeR + 1);
      if (i === doc.selected) {
        ctx.strokeStyle = '#f5c542';
        ctx.lineWidth = 3;
        ctx.strokeRect(panel.rect.x + 1.5, panel.rect.y + 1.5, panel.rect.w - 3, panel.rect.h - 3);
        const cx = panel.rect.x + panel.rect.w / 2;
        const cy = panel.rect.y + panel.rect.h / 2;
        ctx.beginPath();
        ctx.moveTo(cx - 12, cy);
        ctx.lineTo(cx + 12, cy);
        ctx.moveTo(cx, cy - 12);
        ctx.lineTo(cx, cy + 12);
        ctx.stroke();
        const zoomText = `${Math.round((panel.zoom || 1) * 100)}%`;
        ctx.font = `bold ${Math.max(11, plan.w * 0.012)}px "Oswald", sans-serif`;
        const zw = ctx.measureText(zoomText).width + 12;
        ctx.fillStyle = '#f5c542';
        ctx.fillRect(cx - zw / 2, panel.rect.y + panel.rect.h - 24, zw, 20);
        ctx.fillStyle = '#1a0b2e';
        ctx.textAlign = 'center';
        ctx.fillText(zoomText, cx, panel.rect.y + panel.rect.h - 14);
      }
      if (panel.faceMarked) {
        ctx.fillStyle = '#7fe7ff';
        ctx.font = `bold ${Math.max(11, plan.w * 0.013)}px "Oswald", sans-serif`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText('FACE ✓', panel.rect.x + panel.rect.w - 8, panel.rect.y + panel.rect.h - 12);
      }
    }
  }

  // Finish elements on the mosaic corners: COMING SOON top-left, the
  // seal top-right, the volume tag at the mosaic foot.
  drawComingSoon(ctx, 12, 12, plan.w);
  const sealSize = plan.w * 0.07;
  drawSeal(ctx, plan.w - sealSize - 12, 12, sealSize);
  drawVolTag(ctx, 12, plan.titleField.y - 40, doc.vol || plan.caption.vol);

  // The title cluster inside the field.
  drawTitle(ctx, plan, doc);
  drawRibbon(ctx, plan, doc);
  drawReviewBar(ctx, plan, doc);
  drawBillingLine(ctx, plan.billingRect, doc.billing || plan.caption.billing);
  const barcodeW = plan.w * 0.12;
  drawBarcode(
    ctx,
    plan.w - barcodeW - plan.w * 0.02,
    plan.titleField.y + plan.titleField.h * 0.06,
    barcodeW,
    plan.titleField.h * 0.16,
    plan.titleText || 'SALTLINE',
  );
  return plan;
}

// Render a document to a fresh canvas at its cover size and return it.
// opts.size overrides the cover size (the export panel renders at the
// export pixels this way).
export function renderCoverToCanvas(doc, images, opts = {}) {
  const plan = planCover(doc, opts.size);
  const canvas = document.createElement('canvas');
  canvas.width = plan.w;
  canvas.height = plan.h;
  const ctx = canvas.getContext('2d');
  renderCover(ctx, doc, images, opts);
  return canvas;
}
