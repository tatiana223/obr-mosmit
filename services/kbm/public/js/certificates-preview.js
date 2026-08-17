const params = new URLSearchParams(window.location.search);
const diocese = params.get('diocese') || '';
const deanery = params.get('deanery') || '';
const ids = (params.get('ids') || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const previewLead = document.getElementById('previewLead');
const certificateGrid = document.getElementById('certificateGrid');
const printRoot = document.getElementById('printRoot');
const previewStatus = document.getElementById('previewStatus');
const printBtn = document.getElementById('printBtn');
const backToSelect = document.getElementById('backToSelect');
const previewOverlay = document.getElementById('previewOverlay');
const previewStage = document.getElementById('previewStage');
const previewTitle = document.getElementById('previewTitle');
const closePreviewBtn = document.getElementById('closePreviewBtn');

const MONTHS_RU = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

const CHAIRMAN_LINES = [
  'Председатель Межъепархиального отдела',
  'по координации духовно-просветительской',
  'образовательной деятельности',
  'Московской митрополии',
];

let certificates = [];

function showStatus(message, isError = false) {
  previewStatus.textContent = message;
  previewStatus.classList.add('show');
  previewStatus.classList.toggle('error', isError);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** Дата по DOCX: число / месяц / год — отдельные строки */
function formatDiplomaDateParts(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    return { day: '', month: '', year: '' };
  }
  return {
    day: String(date.getDate()),
    month: MONTHS_RU[date.getMonth()],
    year: String(date.getFullYear()),
  };
}

/** Сокращения: г. о. / м. о. / г. */
function abbreviatePlaceName(raw, { role = 'auto' } = {}) {
  let value = String(raw || '').replace(/\s+/g, ' ').trim();
  if (!value) return '';

  // Уже сокращённые и «ГО / МО»
  value = value
    .replace(/^(?:г|Г)\s*\.\s*о\s*\.\s*/u, 'г. о. ')
    .replace(/^(?:м|М)\s*\.\s*о\s*\.\s*/u, 'м. о. ')
    .replace(/^(?:го|ГО)\s+/u, 'г. о. ')
    .replace(/^(?:мо|МО)\s+/u, 'м. о. ')
    .replace(/^(?:г|Г)\s*\.\s*/u, 'г. ')
    .replace(/^(?:с|С)\s*\.\s*/u, 'с. ')
    .replace(/^(?:д|Д)\s*\.\s*/u, 'д. ')
    .replace(/^(?:пос|Пос)\s*\.\s*/u, 'пос. ');

  if (/^г\.\s*о\./i.test(value) || /^м\.\s*о\./i.test(value) || /^(?:г|с|д|пос)\./i.test(value)) {
    return value.replace(/\s+/g, ' ').trim();
  }

  // Без \b: в JS граница слова не работает для кириллицы
  if (/муниципальн[а-яё]*\s+округ/i.test(value)) {
    const name = value
      .replace(/муниципальн[а-яё]*\s+округ[а-яё]*/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return name ? `м. о. ${name}` : 'м. о.';
  }

  if (/городск[а-яё]*\s+округ/i.test(value)) {
    const name = value
      .replace(/городск[а-яё]*\s+округ[а-яё]*/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return name ? `г. о. ${name}` : 'г. о.';
  }

  if (/(?:^|[\s(])город(?:а|е|у)?(?=[\s),.]|$)/i.test(value)) {
    const name = value
      .replace(/(?:^|[\s(])город(?:а|е|у)?(?=[\s),.]|$)/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return name ? `г. ${name}` : value;
  }

  if (/(?:^|[\s(])село(?=[\s),.]|$)/i.test(value) || /(?:^|[\s(])села(?=[\s),.]|$)/i.test(value)) {
    const name = value
      .replace(/(?:^|[\s(])(?:село|села)(?=[\s),.]|$)/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return name ? `с. ${name}` : value;
  }

  if (/(?:^|[\s(])деревн(?:я|и)(?=[\s),.]|$)/i.test(value)) {
    const name = value
      .replace(/(?:^|[\s(])деревн(?:я|и)(?=[\s),.]|$)/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return name ? `д. ${name}` : value;
  }

  if (/(?:^|[\s(])пос[её]л(?:ок|ка)(?=[\s),.]|$)/i.test(value)) {
    const name = value
      .replace(/(?:^|[\s(])пос[её]л(?:ок|ка)(?=[\s),.]|$)/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return name ? `пос. ${name}` : value;
  }

  // Если тип не указан словами — по смыслу поля формы
  if (role === 'municipal') return `г. о. ${value}`;
  if (role === 'locality') return `г. ${value}`;
  return value;
}

/** (г. о. / м. о. / г. …), — Times New Roman 14 */
function localityText(participant) {
  const municipal = String(participant.municipalFormation || '').trim();
  const locality = String(participant.locality || '').trim();

  if (municipal) {
    const formatted = abbreviatePlaceName(municipal, { role: 'municipal' });
    return formatted ? `(${formatted}),` : '';
  }

  if (locality) {
    const formatted = abbreviatePlaceName(locality, { role: 'locality' });
    return formatted ? `(${formatted}),` : '';
  }

  return '';
}

/** занявшая I/II/III место / спецприз — Times New Roman 14 */
function placeText(place) {
  let raw = String(place || '').trim();
  if (!raw) return '';
  if (/спецприз/i.test(raw)) return 'получившая спецприз';
  raw = raw.replace(/^занявш[аяуи]+й?\s+/i, '');
  raw = raw.replace(/\s*место$/i, '');
  if (!raw) return '';
  return `занявшая ${raw} место`.replace(/\s+/g, ' ').trim();
}

/** Победитель: I / II / III / спецприз */
function isWinnerAward(place) {
  const raw = String(place || '').trim();
  if (!raw) return false;
  if (/спецприз/i.test(raw)) return true;
  const normalized = raw
    .replace(/^занявш[аяуи]+й?\s+/i, '')
    .replace(/\s*место$/i, '')
    .trim();
  return /^(I|II|III)$/i.test(normalized);
}

/** в номинации «...» — Times New Roman 14 */
function nominationText(nomination) {
  let value = String(nomination || '').trim();
  value = value.replace(/^[«"„]+/, '').replace(/[»"“]+$/, '');
  value = value.replace(/^в\s+номинации\s+/i, '');
  if (!value) return '';
  return `в номинации «${value}»`;
}

/** Художественная работа: «...» — Times New Roman 14 */
function workTitleText(workTitle) {
  let value = String(workTitle || '').trim();
  value = value.replace(/^[«"„]+/, '').replace(/[»"“]+$/, '').trim();
  value = value.replace(/^художественная\s+работа\s*:\s*/i, '').trim();
  if (!value) return '';
  return `Художественная работа: «${value}»`;
}

function certificateHtml(item, { compact = false } = {}) {
  const sizeClass = compact ? 'certificate is-compact' : 'certificate';
  const kindClass = item.isWinner ? 'is-winner' : 'is-participant';
  const subtitle = item.isWinner
    ? `ПОБЕДИТЕЛЯ РЕГИОНАЛЬНОГО ЭТАПА<br />
        МЕЖДУНАРОДНОГО КОНКУРСА<br />
        «КРАСОТА БОЖЬЕГО МИРА»`
    : `УЧАСТНИКА РЕГИОНАЛЬНОГО ЭТАПА<br />
        МЕЖДУНАРОДНОГО КОНКУРСА<br />
        «КРАСОТА БОЖЬЕГО МИРА»`;
  const placeBlock = item.isWinner
    ? `<div class="certificate-place">${escapeHtml(item.place)}</div>`
    : `<div class="certificate-place" aria-hidden="true"></div>`;

  return `
    <article class="${sizeClass} ${kindClass}" data-id="${escapeHtml(item.id)}">
      <div class="certificate-title">ДИПЛОМ</div>
      <div class="certificate-subtitle">${subtitle}</div>
      <div class="certificate-awarded">награждается</div>
      <div class="certificate-name">${escapeHtml(item.fullName)}</div>
      <div class="certificate-locality">${escapeHtml(item.locality)}</div>
      ${placeBlock}
      <div class="certificate-nomination">${escapeHtml(item.nomination)}</div>
      <div class="certificate-work">${escapeHtml(item.workTitle)}</div>
      <div class="certificate-chairman">${CHAIRMAN_LINES.map(escapeHtml).join('<br />')}</div>
      <div class="certificate-date">
        <span>${escapeHtml(item.date.day)}</span>
        <span>${escapeHtml(item.date.month)}</span>
        <span>${escapeHtml(item.date.year)}</span>
      </div>
    </article>
  `;
}

function openPreview(item) {
  previewTitle.textContent = item.fullName;
  previewStage.innerHTML = certificateHtml(item);
  previewOverlay.classList.add('open');
  previewOverlay.setAttribute('aria-hidden', 'false');
}

function closePreview() {
  previewOverlay.classList.remove('open');
  previewOverlay.setAttribute('aria-hidden', 'true');
  previewStage.innerHTML = '';
}

async function init() {
  backToSelect.href = `${window.__KBM_BASE__ || ''}/certificates.html?${new URLSearchParams({ diocese, deanery }).toString()}`;

  if (!diocese || !deanery || !ids.length) {
    showStatus('Не хватает данных для формирования сертификатов.', true);
    return;
  }

  try {
    const submissionResponse = await fetch(`/api/submissions/${encodeURIComponent(deanery)}`);
    const submission = submissionResponse.ok ? await submissionResponse.json() : {};

    const participantsResponse = await fetch('/api/participants');
    const all = await participantsResponse.json();
    const idSet = new Set(ids);
    const selected = (Array.isArray(all) ? all : []).filter(
      (item) => item.deanery === deanery && idSet.has(item.id) && item.approved
    );

    if (!selected.length) {
      throw new Error('Выбранные участники не найдены.');
    }

    const date = formatDiplomaDateParts(submission.reviewedAt || Date.now());
    certificates = selected.map((item) => {
      const isWinner = isWinnerAward(item.place || '');
      return {
        id: item.id,
        isWinner,
        fullName: `${item.lastName || ''} ${item.firstName || ''}`.trim().toLocaleUpperCase('ru-RU'),
        locality: localityText(item),
        place: isWinner ? placeText(item.place || '') : '',
        nomination: nominationText(item.nomination || ''),
        workTitle: workTitleText(item.workTitle || ''),
        date,
      };
    });

    const winnersCount = certificates.filter((item) => item.isWinner).length;
    const participantsCount = certificates.length - winnersCount;
    previewLead.textContent =
      `${diocese} · ${deanery} · дипломов: ${certificates.length}` +
      ` (победителей: ${winnersCount}, участников: ${participantsCount})`;
    certificateGrid.innerHTML = certificates
      .map(
        (item) => `
      <button type="button" class="certificate-thumb" data-id="${escapeHtml(item.id)}">
        ${certificateHtml(item, { compact: true })}
        <span class="certificate-thumb-label">${escapeHtml(item.fullName)} · ${
          item.isWinner ? 'победитель' : 'участник'
        }</span>
      </button>`
      )
      .join('');

    printRoot.innerHTML = certificates.map((item) => certificateHtml(item)).join('');
  } catch (error) {
    showStatus(error.message, true);
  }
}

certificateGrid.addEventListener('click', (event) => {
  const thumb = event.target.closest('.certificate-thumb[data-id]');
  if (!thumb) return;
  const item = certificates.find((entry) => entry.id === thumb.dataset.id);
  if (item) openPreview(item);
});

closePreviewBtn.addEventListener('click', closePreview);
previewOverlay.addEventListener('click', (event) => {
  if (event.target === previewOverlay) closePreview();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closePreview();
});

printBtn.addEventListener('click', () => {
  if (!certificates.length) {
    showStatus('Нет сертификатов для печати.', true);
    return;
  }
  window.print();
});

await init();
