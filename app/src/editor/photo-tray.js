// The photo tray.
//
// The seventeen sample photos as a grid, an Add photos button (file
// picker, drag-and-drop onto the dropzone, and paste from the clipboard),
// and the count line. Tapping a sample fills the selected panel with it;
// uploaded photos join the grid under their upload: key and stay on this
// machine — nothing is ever sent anywhere.
import { SAMPLE_PHOTOS } from '../photos/sample-photos.js';

// The tray's items: the samples first, then the uploads, each with the
// source to show and the label under it.
function trayItems(studio) {
  const samples = SAMPLE_PHOTOS.map((photo) => ({ src: photo.src, label: photo.scene, sample: true }));
  const uploads = [...studio.uploaded.keys()].map((key) => ({ src: key, label: 'Uploaded', sample: false }));
  return [...samples, ...uploads];
}

export function renderPhotoTray(studio) {
  const host = document.getElementById('photoTray');
  if (!host) return;
  host.innerHTML = '';
  const selected = studio.doc.panels[studio.doc.selected];
  for (const item of trayItems(studio)) {
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

// Wire the three ways in: the Add photos button opens the file picker,
// the dropzone takes dragged files, and pasting an image anywhere adds it.
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
