const metaForm = document.getElementById('metaForm');
const metaStatus = document.getElementById('metaStatus');
const participantsBody = document.getElementById('participantsBody');
const countLabel = document.getElementById('countLabel');
const refreshBtn = document.getElementById('refreshBtn');

const TABLE_COLSPAN = 19;
let applicationMeta = {};

function showMetaStatus(message, isError = false) {
  metaStatus.textContent = message;
  metaStatus.classList.add('show');
  metaStatus.classList.toggle('error', isError);
}

function responsibleForParticipant(participant) {
  const submissions = applicationMeta.submissions || {};
  const byDeanery = submissions[participant.deanery]?.responsible;
  if (byDeanery?.fullName || byDeanery?.phone) return byDeanery;
  return applicationMeta.responsible || {};
}

async function loadMeta() {
  const response = await fetch('/api/application');
  const data = await response.json();
  applicationMeta = data || {};
  metaForm.fullName.value = data.responsible?.fullName || '';
  metaForm.phone.value = data.responsible?.phone || '';
}

function formatPhoneDisplay(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 11);
  if (!digits) return '—';
  let normalized = digits;
  if (normalized[0] === '8') normalized = `7${normalized.slice(1)}`;
  if (normalized[0] !== '7') normalized = `7${normalized}`;
  normalized = normalized.slice(0, 11);
  if (normalized.length < 11) return escapeHtml(String(value || '—'));
  return `+7(${normalized.slice(1, 4)})${normalized.slice(4, 7)}-${normalized.slice(7, 9)}-${normalized.slice(9, 11)}`;
}

function yesCell(value) {
  return value ? '<td class="yes">есть</td>' : '<td>нет</td>';
}

function formatAddress(participant) {
  const parts = [
    participant.federalDistrict,
    participant.rfSubject,
    participant.municipalFormation,
    participant.locality,
  ]
    .map((value) => String(value || '').trim())
    .filter(Boolean);
  return parts.length ? parts.join(', ') : '—';
}

async function loadParticipants() {
  const response = await fetch('/api/participants');
  const list = await response.json();
  countLabel.textContent = `${list.length} ${plural(list.length)}`;

  if (!list.length) {
    participantsBody.innerHTML = `<tr><td colspan="${TABLE_COLSPAN}">Пока нет участников. Заполните форму.</td></tr>`;
    return;
  }

  participantsBody.innerHTML = list
    .map((p, index) => {
      const responsible = responsibleForParticipant(p);
      return `
      <tr data-id="${p.id}">
        <td>${index + 1}</td>
        <td>${escapeHtml(p.diocese || '—')}</td>
        <td>${escapeHtml(p.deanery || '—')}</td>
        <td>${escapeHtml(p.lastName)}</td>
        <td>${escapeHtml(p.firstName)}</td>
        <td>${escapeHtml(String(p.age))}</td>
        <td>${escapeHtml(p.workTitle)}</td>
        <td>${escapeHtml(formatAddress(p))}</td>
        <td>${escapeHtml(p.nomination)}</td>
        <td>${escapeHtml(p.institutionName)}</td>
        <td>${escapeHtml(p.teacherName)}</td>
        <td>${formatPhoneDisplay(p.teacherPhone)}</td>
        <td>${formatPhoneDisplay(p.representativePhone)} (${escapeHtml(p.representativeName)})</td>
        ${yesCell(p.rightsConsent)}
        ${yesCell(p.personalDataConsent)}
        ${yesCell(p.idDocumentConfirm)}
        <td>${escapeHtml(responsible.fullName || '—')}</td>
        <td>${formatPhoneDisplay(responsible.phone)}</td>
        <td><button type="button" class="btn btn-danger" data-delete="${p.id}">Удалить</button></td>
      </tr>`;
    })
    .join('');
}

function plural(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'участник';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'участника';
  return 'участников';
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

metaForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = {
    responsible: {
      fullName: metaForm.fullName.value,
      phone: metaForm.phone.value,
    },
  };

  try {
    const response = await fetch('/api/application', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Не удалось сохранить');
    showMetaStatus('Шапка заявки сохранена');
    await loadMeta();
    await loadParticipants();
  } catch (error) {
    showMetaStatus(error.message, true);
  }
});

participantsBody.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-delete]');
  if (!button) return;
  const id = button.getAttribute('data-delete');
  if (!confirm('Удалить этого участника из заявки?')) return;
  await fetch(`/api/participants/${id}`, { method: 'DELETE' });
  await loadParticipants();
});

refreshBtn.addEventListener('click', async () => {
  await loadMeta();
  await loadParticipants();
});

await loadMeta();
await loadParticipants();
setInterval(async () => {
  await loadMeta();
  await loadParticipants();
}, 5000);
