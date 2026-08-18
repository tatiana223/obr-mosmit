const params = new URLSearchParams(window.location.search);
const diocese = params.get('diocese') || '';
const deanery = params.get('deanery') || '';

const pageLead = document.getElementById('pageLead');
const participantChecklist = document.getElementById('participantChecklist');
const selectAll = document.getElementById('selectAll');
const buildCertificatesBtn = document.getElementById('buildCertificatesBtn');
const pageStatus = document.getElementById('pageStatus');

function showStatus(message, isError = false) {
  pageStatus.textContent = message;
  pageStatus.classList.add('show');
  pageStatus.classList.toggle('error', isError);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function selectedIds() {
  return [...participantChecklist.querySelectorAll('input[type="checkbox"][data-id]:checked')].map(
    (input) => input.dataset.id
  );
}

function syncBuildButton() {
  const ids = selectedIds();
  buildCertificatesBtn.disabled = ids.length === 0;
  const boxes = [...participantChecklist.querySelectorAll('input[type="checkbox"][data-id]')];
  selectAll.checked = boxes.length > 0 && boxes.every((box) => box.checked);
  selectAll.indeterminate = boxes.some((box) => box.checked) && !selectAll.checked;
}

async function init() {
  if (!diocese || !deanery) {
    showStatus('Не указаны епархия и благочиние.', true);
    return;
  }

  pageLead.textContent = `Епархия: ${diocese}. Благочиние: ${deanery}.`;

  try {
    const participantsResponse = await fetch('/api/participants');
    const all = await participantsResponse.json();
    const list = (Array.isArray(all) ? all : []).filter(
      (item) => item.deanery === deanery && item.approved
    );

    if (!list.length) {
      showStatus('Нет одобренных участников для сертификатов.', true);
      return;
    }

    participantChecklist.innerHTML = list
      .map(
        (item, index) => {
          const rawPlace = String(item.place || '').trim();
          const isWinner =
            /спецприз/i.test(rawPlace) || /^(I|II|III)(\s*место)?$/i.test(rawPlace);
          const kind = isWinner ? 'диплом победителя' : 'диплом участника';
          const placePart = rawPlace ? ` · ${escapeHtml(rawPlace)}` : '';
          return `
      <li>
        <label>
          <span class="check-main">
            <strong>${index + 1}. ${escapeHtml(item.lastName)} ${escapeHtml(item.firstName)}</strong>
            <span>${placePart} · ${escapeHtml(kind)} · <span class="nomination-underline">${escapeHtml(item.nomination || '')}</span>${item.workTitle ? ` · ${escapeHtml(item.workTitle)}` : ''}</span>
          </span>
          <input type="checkbox" data-id="${escapeHtml(item.id)}" />
        </label>
      </li>`;
        }
      )
      .join('');
  } catch (error) {
    showStatus(error.message, true);
  }
}

selectAll.addEventListener('change', () => {
  const checked = selectAll.checked;
  participantChecklist.querySelectorAll('input[type="checkbox"][data-id]').forEach((box) => {
    box.checked = checked;
  });
  syncBuildButton();
});

participantChecklist.addEventListener('change', syncBuildButton);

buildCertificatesBtn.addEventListener('click', () => {
  const ids = selectedIds();
  if (!ids.length) {
    showStatus('Выберите хотя бы одного участника.', true);
    return;
  }
  const next = new URLSearchParams({
    diocese,
    deanery,
    ids: ids.join(','),
  });
  window.location.href = `${window.__KBM_BASE__ || ''}/certificates/preview?${next.toString()}`;
});

await init();
