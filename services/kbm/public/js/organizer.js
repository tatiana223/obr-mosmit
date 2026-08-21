const PLACES = [
  { value: '', label: '—' },
  { value: 'I', label: 'I место' },
  { value: 'II', label: 'II место' },
  { value: 'III', label: 'III место' },
  { value: 'Спецприз', label: 'Спецприз' },
];

const tabButtons = [...document.querySelectorAll('.organizer-tabs [data-tab]')];
const panels = [...document.querySelectorAll('.organizer-panel')];
const settingsForm = document.getElementById('settingsForm');
const settingsStatus = document.getElementById('settingsStatus');
const winnersBlocks = document.getElementById('winnersBlocks');
const winnersStatus = document.getElementById('winnersStatus');
const accessCodesBody = document.getElementById('accessCodesBody');
const accessStatus = document.getElementById('accessStatus');
const generateAllAccessBtn = document.getElementById('generateAllAccessBtn');
const copyAllAccessBtn = document.getElementById('copyAllAccessBtn');
const participantsBody = document.getElementById('participantsBody');
const countLabel = document.getElementById('countLabel');
const refreshTableBtn = document.getElementById('refreshTableBtn');
const tableStatus = document.getElementById('tableStatus');
const noticeOverlay = document.getElementById('noticeOverlay');
const noticeLead = document.getElementById('noticeLead');
const closeNoticeBtn = document.getElementById('closeNoticeBtn');
const closeNoticeActionBtn = document.getElementById('closeNoticeActionBtn');

let participants = [];
let submissionsByDeanery = {};
let accessItems = [];
let tableViewMode = 'deanery';
let winnersOnlyFilter = false;
let dirtyDeaneries = new Set();

function syncSaveButtons() {
  winnersBlocks.querySelectorAll('[data-save-deanery]').forEach((btn) => {
    const deanery = btn.dataset.saveDeanery || '';
    const dirty = dirtyDeaneries.has(deanery);
    btn.hidden = false;
    btn.disabled = !dirty;
    btn.setAttribute('aria-disabled', dirty ? 'false' : 'true');
    btn.classList.toggle('is-inactive', !dirty);
  });
}

function markDeaneryDirty(deanery) {
  const key = String(deanery || '').trim();
  if (!key) return;
  dirtyDeaneries.add(key);
  syncSaveButtons();
}

function showStatus(el, message, isError = false) {
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  el.classList.toggle('error', isError);
}

function openNoticeOverlay(message) {
  if (!noticeOverlay || !noticeLead) {
    window.alert(message);
    return;
  }
  noticeLead.textContent = message;
  noticeOverlay.classList.add('open');
  noticeOverlay.setAttribute('aria-hidden', 'false');
  closeNoticeActionBtn?.focus();
}

function closeNoticeOverlay() {
  noticeOverlay?.classList.remove('open');
  noticeOverlay?.setAttribute('aria-hidden', 'true');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function setTab(tab) {
  const next = ['settings', 'access', 'winners', 'table'].includes(tab) ? tab : 'settings';
  tabButtons.forEach((btn) => btn.classList.toggle('is-active', btn.dataset.tab === next));
  panels.forEach((panel) => {
    panel.hidden = panel.dataset.panel !== next;
  });
  const url = new URL(window.location.href);
  url.searchParams.set('tab', next);
  window.history.replaceState({}, '', url);
  if (next === 'winners' || next === 'table') {
    loadParticipants().catch((error) => showStatus(tableStatus, error.message, true));
  }
  if (next === 'access') {
    loadAccessCodes().catch((error) => showStatus(accessStatus, error.message, true));
  }
}

function formatAccessDate(value) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function renderAccessCodes() {
  if (!accessCodesBody) return;
  if (!accessItems.length) {
    accessCodesBody.innerHTML = '<tr><td colspan="4">Список благочиний пуст.</td></tr>';
    return;
  }
  accessCodesBody.innerHTML = accessItems
    .map((item) => {
      const code = item.code || '—';
      const codeCell = item.hasCode
        ? `<code class="access-code">${escapeHtml(code)}</code>`
        : '<span class="muted">не создан</span>';
      return `<tr data-deanery="${escapeHtml(item.deanery)}">
        <td><b>${escapeHtml(item.deanery)}</b></td>
        <td>${codeCell}</td>
        <td>${escapeHtml(formatAccessDate(item.updatedAt))}</td>
        <td class="row-actions">
          <button type="button" class="btn btn-ghost" data-generate-access="${escapeHtml(item.deanery)}">
            ${item.hasCode ? 'Обновить' : 'Сгенерировать'}
          </button>
          <button type="button" class="btn btn-ghost" data-copy-access="${escapeHtml(item.deanery)}" ${
            item.hasCode ? '' : 'disabled'
          }>
            Копировать
          </button>
          <a class="btn btn-ghost" href="mailto:?subject=${encodeURIComponent(
            `Код доступа — ${item.deanery}`
          )}&body=${encodeURIComponent(
            item.hasCode
              ? `Здравствуйте!\n\nКод доступа к форме заявки благочиния «${item.deanery}»:\n${item.code}\n\nОткройте форму и выберите это благочиние — система запросит код.\n`
              : ''
          )}" ${item.hasCode ? '' : 'aria-disabled="true" tabindex="-1" style="pointer-events:none;opacity:.45"'}>
            Написать
          </a>
        </td>
      </tr>`;
    })
    .join('');
}

async function loadAccessCodes() {
  const response = await fetch('/api/organizer/deanery-access');
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Не удалось загрузить коды доступа');
  accessItems = Array.isArray(data.items) ? data.items : [];
  renderAccessCodes();
}

async function copyText(text) {
  const value = String(text || '');
  if (!value) throw new Error('Нечего копировать');
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const area = document.createElement('textarea');
  area.value = value;
  document.body.appendChild(area);
  area.select();
  document.execCommand('copy');
  area.remove();
}

function buildAllCodesText(items = accessItems) {
  return items
    .filter((item) => item.hasCode && item.code)
    .map((item) => `${item.deanery}: ${item.code}`)
    .join('\n');
}

function fillSettingsForm(settings) {
  settingsForm.brand.value = settings.brand || '';
  settingsForm.contestNumber.value = settings.contestNumber || '';
  settingsForm.contestYear.value = settings.contestYear || '';
  settingsForm.subtitle.value = settings.subtitle || '';
  settingsForm.chips.value = (settings.chips || []).join('\n');
  settingsForm.addressButtonLabel.value = settings.addressButtonLabel || '';
  settingsForm.addressPhone.value = settings.addressPhone || '';
  settingsForm.addressText.value = settings.addressText || '';
}

async function loadSettings() {
  const response = await fetch('/api/settings');
  const settings = await response.json();
  if (!response.ok) throw new Error(settings.error || 'Не удалось загрузить настройки');
  fillSettingsForm(settings);
}

settingsForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = {
    brand: settingsForm.brand.value.trim(),
    contestNumber: settingsForm.contestNumber.value.trim(),
    contestYear: settingsForm.contestYear.value.trim(),
    subtitle: settingsForm.subtitle.value.trim(),
    chips: settingsForm.chips.value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean),
    addressButtonLabel: settingsForm.addressButtonLabel.value.trim(),
    addressPhone: settingsForm.addressPhone.value.trim(),
    addressText: settingsForm.addressText.value.trim(),
  };

  try {
    const response = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Не удалось сохранить');
    fillSettingsForm(result);
    showStatus(settingsStatus, 'Настройки сохранены и применены к форме благочинного.');
  } catch (error) {
    showStatus(settingsStatus, error.message, true);
  }
});

function placeOptions(selected) {
  return PLACES.map(
    (item) =>
      `<option value="${escapeHtml(item.value)}" ${item.value === selected ? 'selected' : ''}>${escapeHtml(item.label)}</option>`
  ).join('');
}

function groupByDeanery(list) {
  const map = new Map();
  for (const item of list) {
    const key = String(item.deanery || '').trim() || 'Без благочиния';
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'ru'));
}

function groupByNomination(list) {
  const map = new Map();
  for (const item of list) {
    const key = String(item.nomination || '').trim() || 'Без номинации';
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'ru'));
}

function compareParticipants(a, b, secondaryKey = '') {
  if (secondaryKey) {
    const bySecondary = String(a[secondaryKey] || '').localeCompare(
      String(b[secondaryKey] || ''),
      'ru'
    );
    if (bySecondary) return bySecondary;
  }
  return (
    String(a.lastName || '').localeCompare(String(b.lastName || ''), 'ru') ||
    String(a.firstName || '').localeCompare(String(b.firstName || ''), 'ru')
  );
}

function formatRepresentative(p) {
  const phone = String(p.representativePhone || '').trim();
  const name = String(p.representativeName || '').trim();
  if (phone && name) return `${phone} (${name})`;
  if (phone) return phone;
  if (name) return `(${name})`;
  return '—';
}

function formatPlaceLabel(place) {
  const value = String(place || '').trim();
  if (!value) return '—';
  const known = PLACES.find((item) => item.value === value);
  return known ? known.label : value;
}

function hasWinnerPlace(participant) {
  return Boolean(String(participant?.place || '').trim());
}

function participantRowHtml(p, index) {
  return `
      <tr>
        <td>${index}</td>
        <td>${escapeHtml(formatPlaceLabel(p.place))}</td>
        <td>${escapeHtml(p.diocese || '—')}</td>
        <td>${escapeHtml(p.deanery || '—')}</td>
        <td>${escapeHtml(p.lastName || '—')}</td>
        <td>${escapeHtml(p.firstName || '—')}</td>
        <td>${escapeHtml(String(p.age ?? '—'))}</td>
        <td>${escapeHtml(p.workTitle || '—')}</td>
        <td>${escapeHtml(formatAddress(p))}</td>
        <td><span class="nomination-underline">${escapeHtml(p.nomination || '—')}</span></td>
        <td>${escapeHtml(p.institutionName || '—')}</td>
        <td>${escapeHtml(p.teacherName || '—')}</td>
        <td>${escapeHtml(p.teacherPhone || '—')}</td>
        <td>${escapeHtml(formatRepresentative(p))}</td>
      </tr>`;
}

function syncBlockApproveAll(block) {
  const master = block.querySelector('[data-approve-all]');
  if (!master) return;
  const boxes = [...block.querySelectorAll('input[data-award="approved"]')];
  master.checked = boxes.length > 0 && boxes.every((box) => box.checked);
  master.indeterminate = boxes.some((box) => box.checked) && !master.checked;
}

function renderParticipantCard(item, index) {
  const ageLabel =
    item.age != null && item.age !== '' ? `${escapeHtml(String(item.age))} лет` : '—';
  const fullName = `${escapeHtml(item.lastName || '')} ${escapeHtml(item.firstName || '')}`.trim();
  const workTitle = escapeHtml(item.workTitle || '—');
  const nomination = escapeHtml(item.nomination || '—');
  const fromExcel = Boolean(item.importedFromExcel);
  const cardClass = fromExcel ? ' class="imported-from-excel"' : '';
  return `
    <li data-id="${escapeHtml(item.id)}"${cardClass}>
      <div class="participant-info">
        <span class="participant-line" title="${fullName} (${ageLabel}) ${workTitle} / ${nomination}">${index + 1}. <strong class="participant-name">${fullName}</strong> (${ageLabel}) ${workTitle} / <span class="nomination-underline">${nomination}</span></span>
      </div>
      <label class="organizer-approved" aria-label="Одобрено">
        <input type="checkbox" data-award="approved" ${item.approved ? 'checked' : ''} />
      </label>
      <label class="organizer-place-field">
        <select data-award="place" aria-label="Место">${placeOptions(item.place || '')}</select>
      </label>
      <button
        type="button"
        class="organizer-delete-btn"
        data-delete-participant="${escapeHtml(item.id)}"
        aria-label="Удалить участника"
        title="Удалить"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            fill="currentColor"
            d="M9 3h6a1 1 0 0 1 1 1v1h4v2h-1v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7H4V5h4V4a1 1 0 0 1 1-1zm1 2v0h4V5h-4zm-2 4v10h2V9H8zm4 0v10h2V9h-2zm4 0v10h2V9h-2z"
          />
        </svg>
      </button>
    </li>`;
}

function renderWinners() {
  const groups = groupByDeanery(participants);

  if (!groups.length) {
    winnersBlocks.innerHTML = '<p class="organizer-empty">Участников пока нет.</p>';
    return;
  }

  winnersBlocks.innerHTML =
    groups
      .map(([deanery, list]) => {
        const submission = submissionsByDeanery[deanery] || {};
        const reviewCount =
          Math.max(0, Number(submission.reviewSubmitCount) || 0) ||
          (submission.submittedAt ? 1 : 0);
        const confirmCount =
          Math.max(0, Number(submission.certificatesConfirmCount) || 0) ||
          (submission.certificatesConfirmed ? 1 : 0);
        const submittedMs = submission.submittedAt ? Date.parse(submission.submittedAt) : 0;
        const confirmedMs = submission.certificatesConfirmedAt
          ? Date.parse(submission.certificatesConfirmedAt)
          : 0;
        const rejected = Boolean(submission.rejected);
        const rejectionKind = String(submission.rejectionKind || '').trim();
        const needsClarification = rejected && rejectionKind === 'partial';
        const rejectedFull = rejected && !needsClarification;
        const needsReview =
          !rejected &&
          Boolean(submission.submittedAt) &&
          (!submission.certificatesConfirmed || !confirmedMs || submittedMs > confirmedMs);
        const confirmed = !rejected && confirmCount > 0 && Boolean(submission.certificatesConfirmed);
        const reviewLabel =
          reviewCount >= 2 ? `Просим проверить заявку (${reviewCount})` : 'Просим проверить заявку';
        const confirmLabel =
          confirmCount >= 2
            ? `Подтверждение отправлено (${confirmCount})`
            : 'Подтверждение отправлено';
        const approveId = `approve-all-${deanery.replace(/[^\wа-яё-]+/gi, '-')}`;
        return `
      <section class="organizer-deanery-block" data-deanery="${escapeHtml(deanery)}">
        <div class="organizer-winners-head">
          <div class="organizer-deanery-title-cell">
            <h3 class="organizer-deanery-title">${escapeHtml(deanery)}</h3>
            ${needsReview ? `<span class="organizer-submitted-badge">${escapeHtml(reviewLabel)}</span>` : ''}
            ${rejectedFull ? `<span class="organizer-rejected-badge">Заявка отклонена</span>` : ''}
            ${needsClarification ? `<span class="organizer-clarification-badge">Требуется уточнение</span>` : ''}
            ${confirmed ? `<span class="organizer-confirmed-badge${needsReview ? ' is-stale' : ''}">${escapeHtml(confirmLabel)}</span>` : ''}
          </div>
          <label class="organizer-approved" for="${escapeHtml(approveId)}">
            <input type="checkbox" id="${escapeHtml(approveId)}" data-approve-all />
            <span>Одобрено</span>
          </label>
          <span class="organizer-place-head">Место</span>
          <span class="organizer-delete-head" aria-hidden="true"></span>
        </div>
        <ul class="organizer-winners">
          ${list.map((item, index) => renderParticipantCard(item, index)).join('')}
        </ul>
        <div class="organizer-confirm-actions">
          <div class="organizer-delete-all-slot">
            <button
              type="button"
              class="btn btn-danger btn-delete-all"
              data-delete-all-deanery="${escapeHtml(deanery)}"
            >
              Удалить всех участников
            </button>
          </div>
          <div class="organizer-save-slot">
            <button
              type="button"
              class="btn btn-primary organizer-save-btn is-inactive"
              data-save-deanery="${escapeHtml(deanery)}"
              disabled
            >
              Сохранить изменения
            </button>
          </div>
          <div class="organizer-confirm-spacer" aria-hidden="true"></div>
        </div>
      </section>`;
      })
      .join('');

  winnersBlocks.querySelectorAll('.organizer-deanery-block').forEach((block) => syncBlockApproveAll(block));
  dirtyDeaneries.clear();
  syncSaveButtons();
}

function collectAwardsFromBlock(block) {
  return [...block.querySelectorAll('li[data-id]')].map((row) => {
    const placeSelect = row.querySelector('select[data-award="place"]');
    const approvedBox = row.querySelector('input[data-award="approved"]');
    return {
      id: row.dataset.id,
      place: placeSelect?.value || '',
      approved: Boolean(approvedBox?.checked),
    };
  });
}

async function saveAwardsForDeanery(deanery) {
  const key = String(deanery || '').trim();
  const block = [...winnersBlocks.querySelectorAll('.organizer-deanery-block')].find(
    (el) => el.dataset.deanery === key
  );
  if (!block) throw new Error('Блок благочиния не найден');

  const awards = collectAwardsFromBlock(block);
  if (!awards.length) {
    throw new Error('Нет участников для сохранения');
  }
  const response = await fetch('/api/organizer/awards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ awards }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Не удалось сохранить изменения');

  participants = Array.isArray(result.participants) ? result.participants : participants;
  submissionsByDeanery = result.submissions || submissionsByDeanery;
  renderWinners();
  renderTable();

  const rejected = Array.isArray(result.rejectedDeaneries) ? result.rejectedDeaneries : [];
  const clarification = Array.isArray(result.clarificationDeaneries)
    ? result.clarificationDeaneries
    : [];
  const confirmed = Array.isArray(result.confirmedDeaneries) ? result.confirmedDeaneries : [];
  if (rejected.includes(key)) {
    openNoticeOverlay(
      `Для «${key}» заявка отклонена. На форме благочинного: «Заявка отклонена. Свяжитесь с ответственным лицом».`
    );
    showStatus(winnersStatus, `«${key}»: заявка отклонена.`);
  } else if (clarification.includes(key)) {
    openNoticeOverlay(
      `Для «${key}» требуется уточнение. На форме благочинного: «Требуется уточнение информации по участникам. Свяжитесь с организатором».`
    );
    showStatus(winnersStatus, `«${key}»: требуется уточнение.`);
  } else if (confirmed.includes(key)) {
    openNoticeOverlay(
      `Для «${key}» подтверждение отправлено. На форме благочинного открыты сертификаты.`
    );
    showStatus(winnersStatus, `«${key}»: подтверждение отправлено.`);
  } else {
    showStatus(winnersStatus, `Изменения для «${key}» сохранены.`);
  }
  return result;
}

winnersBlocks.addEventListener('change', (event) => {
  const approveAllInput = event.target.closest('[data-approve-all]');
  if (approveAllInput) {
    const block = approveAllInput.closest('.organizer-deanery-block');
    if (!block) return;
    const checked = approveAllInput.checked;
    block.querySelectorAll('input[data-award="approved"]').forEach((box) => {
      box.checked = checked;
    });
    syncBlockApproveAll(block);
    markDeaneryDirty(block.dataset.deanery);
    showStatus(winnersStatus, 'Есть несохранённые изменения. Нажмите «Сохранить изменения».');
    return;
  }

  const control = event.target.closest('[data-award]');
  if (!control) return;
  const block = control.closest('.organizer-deanery-block');
  if (block) {
    syncBlockApproveAll(block);
    markDeaneryDirty(block.dataset.deanery);
  }
  showStatus(winnersStatus, 'Есть несохранённые изменения. Нажмите «Сохранить изменения».');
});

winnersBlocks.addEventListener('click', async (event) => {
  const saveBtn = event.target.closest('[data-save-deanery]');
  if (saveBtn) {
    const deanery = saveBtn.dataset.saveDeanery;
    if (!deanery || saveBtn.disabled) return;
    saveBtn.disabled = true;
    saveBtn.classList.add('is-inactive');
    try {
      await saveAwardsForDeanery(deanery);
    } catch (error) {
      showStatus(winnersStatus, error.message, true);
      markDeaneryDirty(deanery);
    }
    return;
  }

  const deleteAllBtn = event.target.closest('[data-delete-all-deanery]');
  if (deleteAllBtn) {
    const deanery = String(deleteAllBtn.dataset.deleteAllDeanery || '').trim();
    if (!deanery) return;
    const count = participants.filter((item) => String(item.deanery || '').trim() === deanery)
      .length;
    if (!count) return;
    const warning =
      count === 1
        ? `Удалить единственного участника благочиния «${deanery}»? Это действие нельзя отменить.`
        : `Удалить всех участников благочиния «${deanery}» (${count})?\n\nБудут удалены все карточки этой заявки. Это действие нельзя отменить.`;
    if (!confirm(warning)) return;

    deleteAllBtn.disabled = true;
    try {
      const response = await fetch(
        `/api/organizer/participants?deanery=${encodeURIComponent(deanery)}`,
        { method: 'DELETE' }
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Не удалось удалить участников');
      await loadParticipants();
      const deletedCount = Number(result.deletedCount) || count;
      const message =
        deletedCount === 1
          ? `Участник благочиния «${deanery}» удалён.`
          : `Удалены все участники благочиния «${deanery}» (${deletedCount}).`;
      showStatus(winnersStatus, message);
      openNoticeOverlay(
        `${message} Отметки отправки и подтверждения для пустого благочиния сняты.`
      );
    } catch (error) {
      showStatus(winnersStatus, error.message, true);
      openNoticeOverlay(error.message);
      deleteAllBtn.disabled = false;
      await loadParticipants();
    }
    return;
  }

  const deleteBtn = event.target.closest('[data-delete-participant]');
  if (deleteBtn) {
    const id = deleteBtn.dataset.deleteParticipant;
    if (!id) return;
    const removed = participants.find((item) => item.id === id);
    const fullName = removed
      ? `${removed.lastName || ''} ${removed.firstName || ''}`.trim()
      : '';
    const deanery = String(removed?.deanery || '').trim();
    if (!confirm(fullName ? `Удалить участника «${fullName}» из заявки?` : 'Удалить этого участника из заявки?')) {
      return;
    }
    deleteBtn.disabled = true;
    try {
      const response = await fetch(`/api/participants/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Не удалось удалить участника');
      await loadParticipants();
      const remainingInDeanery = deanery
        ? participants.filter((item) => String(item.deanery || '').trim() === deanery).length
        : -1;
      const base = fullName ? `Участник «${fullName}» удалён из заявки.` : 'Участник удалён из заявки.';
      const extra =
        remainingInDeanery === 0
          ? ' В благочинии не осталось участников — отметки отправки и подтверждения сняты.'
          : '';
      showStatus(winnersStatus, base);
      openNoticeOverlay(`${base}${extra}`);
    } catch (error) {
      showStatus(winnersStatus, error.message, true);
      openNoticeOverlay(error.message);
      deleteBtn.disabled = false;
      await loadParticipants();
    }
    return;
  }
});

function formatAddress(participant) {
  return [participant.federalDistrict, participant.rfSubject, participant.municipalFormation, participant.locality]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join(', ') || '—';
}

function plural(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'участник';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'участника';
  return 'участников';
}

function renderTable() {
  const visible = winnersOnlyFilter ? participants.filter(hasWinnerPlace) : participants;
  countLabel.textContent = winnersOnlyFilter
    ? `${visible.length} ${plural(visible.length)} (победители)`
    : `${participants.length} ${plural(participants.length)}`;

  document.querySelectorAll('[data-table-view]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.tableView === tableViewMode);
  });
  document.querySelectorAll('[data-table-filter="winners"]').forEach((btn) => {
    btn.classList.toggle('is-active', winnersOnlyFilter);
    btn.setAttribute('aria-pressed', winnersOnlyFilter ? 'true' : 'false');
  });

  if (!participants.length) {
    participantsBody.innerHTML = '<tr><td colspan="14">Пока нет участников.</td></tr>';
    return;
  }

  if (!visible.length) {
    participantsBody.innerHTML =
      '<tr><td colspan="14">Нет участников с присвоенным местом.</td></tr>';
    return;
  }

  const groups =
    tableViewMode === 'nomination'
      ? groupByNomination(visible)
      : groupByDeanery(visible);
  const groupTitle =
    tableViewMode === 'nomination' ? 'Номинация' : 'Благочиние';

  const secondaryKey = tableViewMode === 'nomination' ? 'deanery' : 'nomination';
  let rowIndex = 0;
  participantsBody.innerHTML = groups
    .map(([groupName, list]) => {
      const sorted = [...list].sort((a, b) => compareParticipants(a, b, secondaryKey));
      const header = `
      <tr class="table-group-row">
        <td colspan="14">${escapeHtml(groupTitle)}: ${escapeHtml(groupName)} · ${sorted.length}</td>
      </tr>`;
      const rows = sorted
        .map((p) => {
          rowIndex += 1;
          return participantRowHtml(p, rowIndex);
        })
        .join('');
      return header + rows;
    })
    .join('');
}

async function loadParticipants() {
  const [participantsResponse, applicationResponse] = await Promise.all([
    fetch('/api/participants'),
    fetch('/api/application'),
  ]);
  const list = await participantsResponse.json();
  if (!participantsResponse.ok) throw new Error(list.error || 'Не удалось загрузить участников');
  participants = Array.isArray(list) ? list : [];

  if (applicationResponse.ok) {
    const application = await applicationResponse.json();
    submissionsByDeanery = application.submissions || {};
  } else {
    submissionsByDeanery = {};
  }

  renderWinners();
  renderTable();
}

tabButtons.forEach((btn) => {
  btn.addEventListener('click', () => setTab(btn.dataset.tab));
});

refreshTableBtn?.addEventListener('click', async () => {
  try {
    await loadParticipants();
    showStatus(tableStatus, 'Таблица обновлена.');
  } catch (error) {
    showStatus(tableStatus, error.message, true);
  }
});

generateAllAccessBtn?.addEventListener('click', async () => {
  if (
    !confirm(
      'Сгенерировать новые коды для всех благочиний? Старые коды перестанут действовать.'
    )
  ) {
    return;
  }
  generateAllAccessBtn.disabled = true;
  try {
    const response = await fetch('/api/organizer/deanery-access/generate-all', { method: 'POST' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Не удалось сгенерировать коды');
    accessItems = Array.isArray(data.items)
      ? data.items.map((item) => ({
          deanery: item.deanery,
          hasCode: Boolean(item.code),
          code: item.code || '',
          updatedAt: item.updatedAt || null,
          generatedAt: item.generatedAt || null,
        }))
      : [];
    renderAccessCodes();
    showStatus(accessStatus, `Сгенерированы коды для ${accessItems.length} благочиний.`);
  } catch (error) {
    showStatus(accessStatus, error.message, true);
  } finally {
    generateAllAccessBtn.disabled = false;
  }
});

copyAllAccessBtn?.addEventListener('click', async () => {
  try {
    const text = buildAllCodesText();
    if (!text) throw new Error('Сначала сгенерируйте коды.');
    await copyText(text);
    showStatus(accessStatus, 'Все коды скопированы в буфер обмена.');
  } catch (error) {
    showStatus(accessStatus, error.message, true);
  }
});

accessCodesBody?.addEventListener('click', async (event) => {
  const generateBtn = event.target.closest('[data-generate-access]');
  if (generateBtn) {
    const deanery = generateBtn.dataset.generateAccess;
    if (!deanery) return;
    if (
      generateBtn.textContent.includes('Обновить') &&
      !confirm(`Обновить код для «${deanery}»? Старый код перестанет действовать.`)
    ) {
      return;
    }
    generateBtn.disabled = true;
    try {
      const response = await fetch('/api/organizer/deanery-access/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deanery }),
      });
      const item = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(item.error || 'Не удалось сгенерировать код');
      accessItems = accessItems.map((row) =>
        row.deanery === deanery
          ? {
              deanery,
              hasCode: true,
              code: item.code || '',
              updatedAt: item.updatedAt || null,
              generatedAt: item.generatedAt || null,
            }
          : row
      );
      if (!accessItems.some((row) => row.deanery === deanery)) {
        accessItems.push({
          deanery,
          hasCode: true,
          code: item.code || '',
          updatedAt: item.updatedAt || null,
          generatedAt: item.generatedAt || null,
        });
      }
      renderAccessCodes();
      showStatus(accessStatus, `Код для «${deanery}»: ${item.code}`);
    } catch (error) {
      showStatus(accessStatus, error.message, true);
    } finally {
      generateBtn.disabled = false;
    }
    return;
  }

  const copyBtn = event.target.closest('[data-copy-access]');
  if (copyBtn) {
    const deanery = copyBtn.dataset.copyAccess;
    const item = accessItems.find((row) => row.deanery === deanery);
    try {
      if (!item?.code) throw new Error('Сначала сгенерируйте код.');
      await copyText(`${item.deanery}: ${item.code}`);
      showStatus(accessStatus, `Код «${deanery}» скопирован.`);
    } catch (error) {
      showStatus(accessStatus, error.message, true);
    }
  }
});

document.querySelectorAll('[data-table-view]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const next = btn.dataset.tableView === 'nomination' ? 'nomination' : 'deanery';
    if (tableViewMode === next) return;
    tableViewMode = next;
    renderTable();
  });
});

document.querySelectorAll('[data-table-filter="winners"]').forEach((btn) => {
  btn.addEventListener('click', () => {
    winnersOnlyFilter = !winnersOnlyFilter;
    renderTable();
  });
});

closeNoticeBtn?.addEventListener('click', closeNoticeOverlay);
closeNoticeActionBtn?.addEventListener('click', closeNoticeOverlay);
noticeOverlay?.addEventListener('click', (event) => {
  if (event.target === noticeOverlay) closeNoticeOverlay();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && noticeOverlay?.classList.contains('open')) {
    closeNoticeOverlay();
  }
});

const initialTab = new URLSearchParams(window.location.search).get('tab') || 'settings';
setTab(initialTab);
loadSettings().catch((error) => showStatus(settingsStatus, error.message, true));
if (initialTab === 'winners' || initialTab === 'table') {
  loadParticipants().catch((error) => showStatus(tableStatus, error.message, true));
}
if (initialTab === 'access') {
  loadAccessCodes().catch((error) => showStatus(accessStatus, error.message, true));
}

function setupEmbedHeightReporter() {
  const params = new URLSearchParams(window.location.search);
  if (!params.has('embed') || window.parent === window) return;

  document.documentElement.classList.add('is-embedded');

  const postHeight = () => {
    const height = Math.ceil(
      Math.max(
        document.documentElement.scrollHeight,
        document.body?.scrollHeight || 0,
        document.querySelector('.shell')?.scrollHeight || 0
      )
    );
    window.parent.postMessage(
      { type: 'kbm-organizer-height', height },
      window.location.origin
    );
  };

  const observer = new ResizeObserver(() => {
    requestAnimationFrame(postHeight);
  });
  observer.observe(document.documentElement);
  if (document.body) observer.observe(document.body);
  const shell = document.querySelector('.shell');
  if (shell) observer.observe(shell);

  window.addEventListener('load', postHeight);
  postHeight();
}

setupEmbedHeightReporter();
