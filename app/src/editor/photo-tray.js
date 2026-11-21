// The photo tray: the sample photos and the user's own.
//
// The tray shows the seventeen sample photos with their captions; the
// one the selected panel uses wears the orange outline. Clicking a
// photo puts it in the selected panel. The "+" tile, the dropzone and
// paste all add the user's own photos: they are read on this machine
// and never leave it, and they join the tray beside the samples.
import { SAMPLE_PHOTOS, isSamplePhoto } from '../photos/sample-photos.js';

export function renderPhotoTray(studio) {
  const tray = document.getElementById('photo-tray');
  if (!tray) return;
  const selected = studio.doc.panels[studio.doc.selected];
  const pickedSrc = selected ? selected.photo : '';
  if (!tray.dataset.built) {
    tray.dataset.built = '1';
    const buildFigure = (src, label) => {
      const figure = document.createElement('figure');
      figure.dataset.src = src;
      const img = document.createElement('img');
      img.src = src;
      img.alt = label;
      img.loading = 'lazy';
      const caption = document.createElement('figcaption');
      caption.textContent = label;
      figure.append(img, caption);
      figure.addEventListener('click', () => {
        const panel = studio.doc.panels[studio.doc.selected];
        if (!panel) return;
        panel.photo = src;
        const found = SAMPLE_PHOTOS.find((photo) => photo.src === src);
        if (found) panel.tag = found.tag;
        studio.commit();
        studio.render();
      });
      return figure;
    };
    for (const photo of SAMPLE_PHOTOS) tray.appendChild(buildFigure(photo.src, photo.label));
    const add = document.createElement('button');
    add.className = 'add';
    add.type = 'button';
    add.textContent = '+';
    add.title = 'Add your photos';
    add.addEventListener('click', () => {
      const input = document.getElementById('photo-input');
      if (input) input.click();
    });
    tray.appendChild(add);
    const count = document.getElementById('photo-count');
    if (count) count.textContent = String(SAMPLE_PHOTOS.length);
  }
  for (const figure of tray.querySelectorAll('figure')) {
    figure.classList.toggle('picked', figure.dataset.src === pickedSrc);
  }
}

// Wire the file input, the dropzone and paste for the user's photos.
export function setupPhotoInput(studio) {
  const input = document.getElementById('photo-input');
  const dropzone = document.getElementById('dropzone');
  const addButton = document.getElementById('add-photos');
  if (addButton && input) addButton.addEventListener('click', () => input.click());
  const addFiles = (files) => {
    const tray = document.getElementById('photo-tray');
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      const reader = new FileReader();
      reader.onload = () => {
        const src = String(reader.result);
        const img = new Image();
        img.onload = () => {
          studio.images.set(src, img);
          studio.userPhotos.push({ src, label: file.name.replace(/\.[^.]+$/, '') });
          if (tray) {
            const figure = document.createElement('figure');
            figure.dataset.src = src;
            const thumb = document.createElement('img');
            thumb.src = src;
            thumb.alt = file.name;
            const caption = document.createElement('figcaption');
            caption.textContent = file.name.replace(/\.[^.]+$/, '');
            figure.append(thumb, caption);
            figure.addEventListener('click', () => {
              const panel = studio.doc.panels[studio.doc.selected];
              if (!panel) return;
              panel.photo = src;
              studio.commit();
              studio.render();
            });
            const add = tray.querySelector('.add');
            if (add) tray.insertBefore(figure, add);
            else tray.appendChild(figure);
          }
          const panel = studio.doc.panels[studio.doc.selected];
          if (panel && !isSamplePhoto(panel.photo)) {
            studio.render();
          }
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    }
  };
  if (input) input.addEventListener('change', () => { addFiles([...input.files]); input.value = ''; });
  if (dropzone) {
    dropzone.addEventListener('dragover', (event) => { event.preventDefault(); dropzone.classList.add('over'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('over'));
    dropzone.addEventListener('drop', (event) => {
      event.preventDefault();
      dropzone.classList.remove('over');
      addFiles([...event.dataTransfer.files]);
    });
  }
  document.addEventListener('paste', (event) => {
    const files = [...(event.clipboardData?.files || [])];
    if (files.length > 0) addFiles(files);
  });
}
