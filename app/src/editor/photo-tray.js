// The photo tray: the grid of sample photos on the left rail, plus the
// inputs that bring the user's own photos in (Add photos button, file
// input, drag-and-drop onto the tray, paste from the clipboard). Clicking
// a photo places it into the selected panel; a user's photo is read on
// their own machine and never leaves it.
import { SAMPLE_PHOTOS, labelOf } from '../photos/sample-photos.js';

export function renderPhotoTray(studio) {
  const host = document.getElementById('photoTray');
  if (!host) return;
  host.innerHTML = '';
  const count = document.getElementById('photoCount');
  if (count) count.textContent = `${SAMPLE_PHOTOS.length} samples`;
  for (const photo of SAMPLE_PHOTOS) {
    const figure = document.createElement('figure');
    const img = document.createElement('img');
    img.src = photo.src;
    img.alt = photo.label;
    img.draggable = true;
    img.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', photo.src));
    const cap = document.createElement('figcaption');
    cap.textContent = photo.label;
    figure.append(img, cap);
    const picked = studio.doc.panels[studio.doc.selected];
    if (picked && picked.photo === photo.src) figure.classList.add('picked');
    figure.addEventListener('click', () => studio.commit(() => {
      studio.doc.panels[studio.doc.selected].photo = photo.src;
    }));
    host.appendChild(figure);
  }
  const add = document.createElement('button');
  add.type = 'button';
  add.className = 'add';
  add.textContent = '+';
  add.title = 'Add photos';
  add.addEventListener('click', () => document.getElementById('fileInput').click());
  host.appendChild(add);
}

// Wire the file input, the dropzone and paste for the user's own photos.
export function setupPhotoInput(studio) {
  const input = document.getElementById('fileInput');
  const dropzone = document.getElementById('dropzone');
  const addBtn = document.getElementById('addPhotosBtn');

  const takeFiles = (files) => {
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      const reader = new FileReader();
      reader.onload = () => {
        const src = String(reader.result);
        const img = new Image();
        img.onload = () => {
          studio.images.set(src, img);
          studio.commit(() => {
            studio.doc.panels[studio.doc.selected].photo = src;
          });
          studio.redraw();
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    }
  };

  if (input) input.addEventListener('change', () => takeFiles(input.files || []));
  if (addBtn) addBtn.addEventListener('click', () => input.click());
  if (dropzone) {
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('over');
    });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('over'));
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('over');
      takeFiles(e.dataTransfer.files || []);
    });
  }
  document.addEventListener('paste', (e) => {
    const files = [...(e.clipboardData?.files || [])].filter((f) => f.type.startsWith('image/'));
    if (files.length) takeFiles(files);
  });
}
