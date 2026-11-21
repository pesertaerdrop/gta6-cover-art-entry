// The photo tray: the 17 sample photos as a grid, an Add photos button
// (file picker, drag-and-drop onto the dropzone, and paste from the
// clipboard), and the count line. Tapping a sample fills the selected
// panel with it; uploaded photos join the grid and stay on this machine.
import { SAMPLE_PHOTOS } from '../photos/sample-photos.js';

export function renderPhotoTray(studio) {
  const host = document.getElementById('photoTray');
  if (!host) return;
  host.innerHTML = '';
  const selected = studio.doc.panels[studio.doc.selected];
  const all = [
    ...SAMPLE_PHOTOS.map((photo) => ({ src: photo.src, label: photo.scene, sample: true })),
    ...[...studio.uploaded.keys()].map((key) => ({ src: key, label: 'Uploaded', sample: false })),
  ];
  for (const item of all) {
    const figure = document.createElement('figure');
    if (selected && selected.photo === item.src) figure.className = 'picked';
    const img = document.createElement('img');
    img.src = item.sample ? `./${item.src}` : item.src;
    img.alt = item.label;
    img.loading = 'lazy';
    const caption = document.createElement('figcaption');
    caption.textContent = item.label;
    figure.appendChild(img);
    figure.appendChild(caption);
    figure.addEventListener('click', () => {
      const slot = studio.selectedSlot();
      if (!slot) return;
      slot.photo = item.src;
      studio.commit('set photo');
    });
    host.appendChild(figure);
  }
  const count = document.getElementById('photoCount');
  if (count) {
    count.textContent = studio.uploaded.size > 0
      ? `${SAMPLE_PHOTOS.length} samples + ${studio.uploaded.size} uploaded`
      : `${SAMPLE_PHOTOS.length} samples`;
  }
}

export function setupPhotoInput(studio) {
  const addBtn = document.getElementById('addPhotosBtn');
  const input = document.getElementById('fileInput');
  const dropzone = document.getElementById('dropzone');
  if (addBtn && input) {
    addBtn.addEventListener('click', () => input.click());
    input.addEventListener('change', () => {
      if (input.files && input.files.length) studio.addUploadedFiles(input.files);
      input.value = '';
    });
  }
  if (dropzone) {
    dropzone.addEventListener('dragover', (event) => {
      event.preventDefault();
      dropzone.classList.add('over');
    });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('over'));
    dropzone.addEventListener('drop', (event) => {
      event.preventDefault();
      dropzone.classList.remove('over');
      if (event.dataTransfer.files.length) studio.addUploadedFiles(event.dataTransfer.files);
    });
  }
  document.addEventListener('paste', (event) => {
    const files = [...(event.clipboardData?.files || [])].filter((file) => file.type.startsWith('image/'));
    if (files.length) studio.addUploadedFiles(files);
  });
}
