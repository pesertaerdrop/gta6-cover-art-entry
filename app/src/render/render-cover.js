// Draws a whole cover onto a canvas from a document and a map of loaded
// photos. One function, renderCover, owns the full stack: white panel
// borders, treated photos, the title band, the giant chrome title with
// its neon script, the tagline ribbon, the script line, and the seven
// poster-finish elements. Editor overlays (selection outline, crosshair,
// zoom badge) come from opts.editor.
//
// The title band is the fix for the giant title: after the panels are
// painted and before the title is drawn, a solid dark strip is painted
// across the title band (plan.titleBand, y 0.60h–0.84h) with thin accent
// rules top and bottom. The title, its script line and its ribbon all
// live inside that band, so no panel photo can ever touch a letter and
// the title reads as a clean billboard at any size, down to 300 px.
import { planCover } from '../layouts/plan-cover.js';
import { drawPanelPhoto } from '../effects/poster-photo.js';
import { gradientFor } from '../lettering/title-styles.js';
import { drawPosterFinish } from '../lettering/poster-finish.js';

export const ACCENT_BY_GRADE = {
  sunset: '#ff6b35',
  'neon-night': '#7fe7ff',
  'golden-hour': '#ffd166',
  'tropic-teal': '#7fe7c8',
  'ember-blaze': '#f05a28',
  'rose-dusk': '#ff7ae0',
};

export function accentForGrade(grade) {
  return ACCENT_BY_GRADE[grade] || ACCENT_BY_GRADE.sunset;
}

// Paint the title band: a solid dark strip across the title's clear zone,
// with thin accent rules top and bottom, so the title sits on a clean
// billboard instead of over busy photos.
export function drawTitleBand(ctx, plan, doc) {
  const band = plan.titleBand;
  if (!band) return;
  const accent = accentForGrade(doc.grade);
  ctx.save();
  ctx.fillStyle = 'rgba(10,8,14,0.94)';
  ctx.fillRect(band.x, band.y, band.w, band.h);
  ctx.fillStyle = accent;
  ctx.fillRect(band.x, band.y, band.w, 2);
  ctx.fillRect(band.x, band.y + band.h - 2, band.w, 2);
  ctx.restore();
}

// Fit the title text to the title rectangle, shrinking the font until it
// fits, then draw it with its chrome gradient, stroke and shadow, with the
// neon script overlapping the caps.
export function drawTitle(ctx, plan, doc) {
  const { titleRect, titleStyle, titleSize, titleLift, titleText } = plan;
  if (!titleText) return;
  let size = titleSize;
  ctx.save();
  ctx.font = `${size}px Anton, 'Archivo Black', sans-serif`;
  while (size > 24 && ctx.measureText(titleText).width > titleRect.w) {
    size *= 0.94;
    ctx.font = `${size}px Anton, 'Archivo Black', sans-serif`;
  }
  const x = titleRect.x + titleRect.w / 2;
  const y = titleRect.y + titleRect.h / 2 - titleLift;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = titleStyle.shadow;
  ctx.shadowBlur = size * 0.22;
  ctx.shadowOffsetY = size * 0.03;
  ctx.lineWidth = Math.max(2, size * 0.08);
  ctx.strokeStyle = titleStyle.stroke;
  ctx.lineJoin = 'round';
  ctx.fillStyle = gradientFor(ctx, titleStyle, { x: titleRect.x, y: y - size / 2, w: titleRect.w, h: size });
  ctx.strokeText(titleText, x, y);
  ctx.fillText(titleText, x, y);
  ctx.restore();
  // The neon script, overlapping the caps.
  const script = doc.script || plan.caption.script;
  if (script) {
    ctx.save();
    ctx.translate(x, y - size * 0.55);
    ctx.rotate(-0.03);
    ctx.font = `${Math.round(size * 0.42)}px 'Mr Dafoe', cursive`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(255,255,255,0.7)';
    ctx.shadowBlur = size * 0.1;
    ctx.fillStyle = '#fff';
    ctx.fillText(script, 0, 0);
    ctx.restore();
  }
}

// The tagline ribbon: a coloured band with side triangles, centred under
// the title.
export function drawTaglineRibbon(ctx, plan, doc) {
  const tagline = doc.tagline || plan.caption.tagline;
  if (!tagline) return;
  const { w, h } = plan;
  const accent = accentForGrade(doc.grade);
  const bandH = Math.round(h * 0.032);
  const bandY = plan.titleRect.y + plan.titleRect.h * 0.8;
  const bandX = 0.12 * w;
  const bandW = 0.76 * w;
  ctx.save();
  ctx.font = `700 ${Math.round(bandH * 0.62)}px Oswald, sans-serif`;
  const textW = ctx.measureText(tagline).width + 28;
  const cx = w / 2;
  const x0 = cx - textW / 2;
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.moveTo(x0 - bandH * 0.5, bandY);
  ctx.lineTo(x0, bandY);
  ctx.lineTo(x0, bandY + bandH);
  ctx.lineTo(x0 - bandH * 0.5, bandY + bandH);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x0 + textW + bandH * 0.5, bandY);
  ctx.lineTo(x0 + textW, bandY);
  ctx.lineTo(x0 + textW, bandY + bandH);
  ctx.lineTo(x0 + textW + bandH * 0.5, bandY + bandH);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(x0, bandY, textW, bandH);
  ctx.fillStyle = '#111';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(tagline, cx, bandY + bandH / 2 + 0.5);
  ctx.restore();
}

function drawEditorOverlays(ctx, plan, doc) {
  const accent = accentForGrade(doc.grade);
  plan.panels.forEach((panel, i) => {
    const { x, y, w, h } = panel.rect;
    // Numbered badge on every panel.
    ctx.save();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(x + 16, y + h - 16, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '700 13px Oswald, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(i + 1), x + 16, y + h - 15.5);
    ctx.restore();
    if (i !== doc.selected) return;
    // Selected panel: accent outline, crosshair, zoom badge.
    ctx.save();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y + 6);
    ctx.lineTo(x + w / 2, y + h - 6);
    ctx.moveTo(x + 6, y + h / 2);
    ctx.lineTo(x + w - 6, y + h / 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1;
    ctx.stroke();
    const zoomText = `${Math.round((panel.zoom || 1) * 100)}%`;
    ctx.font = '700 13px Oswald, sans-serif';
    const zw = ctx.measureText(zoomText).width + 14;
    ctx.fillStyle = accent;
    ctx.fillRect(x + w - zw - 8, y + 8, zw, 22);
    ctx.fillStyle = '#111';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(zoomText, x + w - zw - 1, y + 19.5);
    ctx.restore();
  });
}

export function renderCover(ctx, doc, images, opts = {}) {
  const plan = planCover(doc, opts.size);
  ctx.save();
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, plan.w, plan.h);
  for (const panel of plan.panels) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(panel.rect.x, panel.rect.y, panel.rect.w, panel.rect.h);
    const img = images.get ? images.get(panel.photo) : images[panel.photo];
    if (img) {
      drawPanelPhoto(ctx, img, panel.inner, panel, doc.look, doc.grade);
    } else {
      ctx.fillStyle = '#222';
      ctx.fillRect(panel.inner.x, panel.inner.y, panel.inner.w, panel.inner.h);
    }
  }
  drawTitleBand(ctx, plan, doc);
  drawTitle(ctx, plan, doc);
  drawTaglineRibbon(ctx, plan, doc);
  drawPosterFinish(ctx, plan, doc);
  if (opts.editor) drawEditorOverlays(ctx, plan, doc);
  ctx.restore();
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
