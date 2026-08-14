document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.querySelector('[data-image-input]');
  const preview = document.querySelector('[data-image-preview]');
  const dropzone = document.querySelector('[data-dropzone]');

  const showImage = file => {
    if (!file || !file.type.startsWith('image/')) return;
    preview.src = URL.createObjectURL(file);
    preview.hidden = false;
    dropzone.classList.add('has-image');
  };

  fileInput?.addEventListener('change', event => showImage(event.target.files[0]));
  dropzone?.addEventListener('dragover', event => {
    event.preventDefault();
    dropzone.classList.add('is-dragging');
  });
  dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('is-dragging'));
  dropzone?.addEventListener('drop', event => {
    event.preventDefault();
    dropzone.classList.remove('is-dragging');
    if (!event.dataTransfer.files.length) return;
    fileInput.files = event.dataTransfer.files;
    showImage(event.dataTransfer.files[0]);
  });

  document.querySelectorAll('[data-count]').forEach(field => {
    const counter = document.querySelector(`[data-counter="${field.id}"]`);
    const update = () => counter.textContent = `${field.value.length} / ${field.maxLength}`;
    field.addEventListener('input', update);
    update();
  });

  const title = document.querySelector('#title');
  const slug = document.querySelector('#slug');
  let slugEdited = Boolean(slug?.value);
  slug?.addEventListener('input', () => slugEdited = true);
  title?.addEventListener('input', () => {
    if (!slug || slugEdited) return;
    slug.placeholder = title.value ? 'Адрес сформируется после сохранения' : 'Создаётся автоматически';
  });
});
