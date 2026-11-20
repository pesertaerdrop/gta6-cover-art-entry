// photo-tray.js — the photo tray: the 14 sample photos as a grid, an Add
// photos button (file picker, drag-and-drop onto the dropzone, and paste from
// the clipboard all work), and tap-to-fill: tapping a sample fills the
// selected panel with that photo. Uploaded photos stay in memory on this
// machine and are never sent anywhere.
import { SAMPLE_PHOTOS } from '../photos/sample-photos.js';

export function renderPhotoTray(studio) {
  const tray = document.getElementById('photoTray');
  tray.innerHTML = '';
  for (const photo of SAMPLE_PHOTOS) {
    const figure = document.createElement('figure');
    const img = document.createElement('img');
    img.src = `./${photo.file}`;
    img.alt = `${photo.cast}, ${photo.scene}`;
    img.loading = 'lazy';
    const caption = document.createElement('figcaption');
    caption.textContent = photo.cast.split(' ')[0];
    figure.appendChild(img);
    figure.appendChild(caption);
    figure.addEventListener('click', () => {
      const slot = studio.selectedSlot();
      if (!slot) return;
      slot.photo = photo.file;
      studio.commit('tray photo');
    });
    tray.appendChild(figure);
  }
  const count = document.getElementById('photoCount');
  if (count) count.textContent = `${SAMPLE_PHOTOS.length + studio.uploadedCount()} samples`;
}

export function setupPhotoInput(studio) {
  const input = document.getElementById('fileInput');
  const addBtn = document.getElementById('addPhotosBtn');
  const dropzone = document.getElementById('dropzone');
  addBtn.addEventListener('click', () => input.click());
  input.addEventListener('change', () => {
    studio.addUploadedFiles(input.files);
    input.value = '';
  });
  dropzone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropzone.classList.add('over');
  });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('over'));
  dropzone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropzone.classList.remove('over');
    studio.addUploadedFiles(event.dataTransfer.files);
  });
  document.addEventListener('paste', (event) => {
    const files = [...(event.clipboardData?.files ?? [])].filter((file) => file.type.startsWith('image/'));
    if (files.length > 0) studio.addUploadedFiles(files);
  });
}
