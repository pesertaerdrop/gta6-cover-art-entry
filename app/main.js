// main.js — entry point of Sunset Strip Studio.
//
// Three modes, chosen by the URL:
//   ?shot=cover&w=1280&h=720&preset=boardwalk-dusk — one exported cover,
//     drawn full-window at the requested pixels (how the screenshots of
//     exported covers are taken)
//   ?shot=grid&w=1080&h=1080 — four covers in a 2x2 grid (the 4th shot)
//   anything else — the editor itself
// Fonts and photos load first in every mode, so a screenshot never
// catches the app half-dressed.

import { PHOTOS, presetById } from './src/library.js';
import { renderToCanvas } from './src/canvas.js';
import { bootEditor } from './src/editor.js';

async function loadLibrary() {
  const lib = [];
  for (const p of PHOTOS) {
    const img = new Image();
    img.src = p.src;
    await new Promise((res) => {
      img.onload = res;
      img.onerror = res;
    });
    lib.push({ ...p, img });
  }
  return lib;
}

async function loadFonts() {
  try {
    await Promise.all([
      document.fonts.load('100px Bungee'),
      document.fonts.load('100px Sacramento'),
      document.fonts.load('100px "Lilita One"'),
    ]);
  } catch (e) {
    // A missing font falls back to the system sans; the cover still draws.
  }
  await document.fonts.ready;
}

function stateFromParams(params) {
  const preset = presetById(params.get('preset') || 'boardwalk-dusk');
  return {
    layout: params.get('layout') || preset.layout,
    grade: params.get('grade') || preset.grade,
    tape: {
      on: params.get('tape') !== '0',
      strength: parseFloat(params.get('tapeStrength') || String(preset.tape.strength)) || 0,
    },
    title: params.get('title') || preset.title,
    subtitle: params.get('subtitle') || preset.subtitle,
    tagline: params.get('tagline') || preset.tagline,
    panels: preset.photos.map((id) => ({ photoId: id, zoom: 1, x: 0.5, y: 0.32 })),
    size: params.get('size') || 'wide',
  };
}

function fitInto(sw, sh, cw, ch) {
  const s = Math.min(cw / sw, ch / sh);
  const w = Math.round(sw * s);
  const h = Math.round(sh * s);
  return { w, h, x: Math.round((cw - w) / 2), y: Math.round((ch - h) / 2) };
}

async function main() {
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  await loadFonts();
  const library = await loadLibrary();

  if (shot === 'cover') {
    const w = parseInt(params.get('w') || '1280', 10);
    const h = parseInt(params.get('h') || '720', 10);
    const state = stateFromParams(params);
    const canvas = renderToCanvas(w, h, state, library);
    document.body.innerHTML = '';
    document.body.classList.add('shot');
    document.body.appendChild(canvas);
    document.title = 'ready';
    return;
  }

  if (shot === 'grid') {
    const w = parseInt(params.get('w') || '1080', 10);
    const h = parseInt(params.get('h') || '1080', 10);
    const cells = [
      { preset: 'boardwalk-dusk', layout: 'sun-disc', grade: 'golden', tape: '0.7', sw: 1920, sh: 1080 },
      { preset: 'golden-hour', layout: 'filmstrip', grade: 'golden', tape: '0.5', sw: 1080, sh: 1350 },
      { preset: 'neon-nights', layout: 'marquee', grade: 'neon', tape: '0.85', sw: 1080, sh: 1080 },
      { preset: 'boardwalk-dusk', layout: 'horizon', grade: 'palm', tape: '0.6', sw: 1920, sh: 1080 },
    ];
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#160a18';
    ctx.fillRect(0, 0, w, h);
    const gap = 16;
    const cw = Math.round((w - gap * 3) / 2);
    const ch = Math.round((h - gap * 3) / 2);
    cells.forEach((cell, i) => {
      const p = new URLSearchParams();
      p.set('preset', cell.preset);
      p.set('layout', cell.layout);
      p.set('grade', cell.grade);
      p.set('tapeStrength', cell.tape);
      const state = stateFromParams(p);
      const cover = renderToCanvas(cell.sw, cell.sh, state, library);
      const cx = gap + (i % 2) * (cw + gap);
      const cy = gap + Math.floor(i / 2) * (ch + gap);
      const fit = fitInto(cell.sw, cell.sh, cw, ch);
      ctx.drawImage(cover, cx + fit.x, cy + fit.y, fit.w, fit.h);
    });
    document.body.innerHTML = '';
    document.body.classList.add('shot');
    document.body.appendChild(canvas);
    document.title = 'ready';
    return;
  }

  bootEditor(library);
  document.title = 'ready';
}

main();
