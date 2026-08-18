const COMPETITION_YEAR = 2026;
const MIN_AGE = 9;
const MAX_AGE = 17;
const CULTURE_TYPE = 'Учреждение культуры';
const EGRUL_TYPES = new Set(['Образовательная организация', CULTURE_TYPE]);
const SUNDAY_SCHOOL_TYPE = 'Воскресная школа';
const USES_EGRUL_TYPES = new Set([...EGRUL_TYPES, SUNDAY_SCHOOL_TYPE]);

function usesEgrul(type = institutionType?.value) {
  return USES_EGRUL_TYPES.has(String(type || '').trim());
}

/** Для учреждений культуры ЕГРЮЛ подсказка, но своё название / правка разрешены. */
function requiresEgrulPick(type = institutionType?.value) {
  const value = String(type || '').trim();
  return usesEgrul(value) && value !== CULTURE_TYPE;
}

function softenCapsPhrase(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[А-ЯЁA-Z]{2,}(?:-[А-ЯЁA-Z]+)*/g, (word) => {
      if (/^(РПЦ|ИНН|ОГРН)$/i.test(word)) return word.toUpperCase();
      return word.charAt(0) + word.slice(1).toLowerCase();
    });
}

/** Строчные служебные слова в названии храма, если не в начале фразы */
function normalizeChurchDisplayCase(text) {
  let value = String(text || '').replace(/\s+/g, ' ').trim();
  if (!value) return value;

  // Без \b: в JS граница слова не работает для кириллицы
  value = value
    .replace(/(^|[\s(])[Гг]\.\s*/g, '$1г. ')
    .replace(/(^|[\s(])[Сс]\.\s*/g, '$1с. ')
    .replace(/(^|[\s(])[Дд]\.\s*/g, '$1д. ')
    .replace(/(^|[\s(])[Пп]ос\.\s*/g, '$1пос. ');

  const lowerMidWord = (pattern) => {
    value = value.replace(new RegExp(`([\\s(])(${pattern})(?=[\\s.,;:»")\\]]|$)`, 'gi'), (_m, sep, word) => {
      return `${sep}${String(word).toLocaleLowerCase('ru-RU')}`;
    });
  };

  lowerMidWord('храм(?:а|у|ом|е)?');
  lowerMidWord('собор(?:а|у|ом|е)?');
  lowerMidWord('кафедральн[а-яё]+');
  lowerMidWord('епархи[яиею]|епархий|епархией');

  return value.replace(/\s+/g, ' ').trim();
}

/** Часть названия храма/прихода из полного наименования ЕГРЮЛ */
function extractChurchNamePart(egrulName) {
  let text = String(egrulName || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';

  const quoted = text.match(/[«"]([^»"]+)[»"]/);
  if (quoted?.[1]) text = quoted[1].trim();

  text = text
    .replace(/^местная\s+религиозная\s+организация\s*/i, '')
    .replace(/^религиозная\s+организация\s*/i, '')
    .replace(/^православн(?:ый|ого)\s+приход\s+/i, '')
    .replace(/^приход\s+/i, '')
    .replace(/\s*[-–—]?\s*русской\s+православной\s+церкви.*$/i, '')
    .replace(/\s*\([^)]*патриархат[^)]*\)\s*$/i, '')
    .replace(/\bсела\b/gi, 'с.')
    .replace(/\bсело\b/gi, 'с.')
    .replace(/\bгорода\b/gi, 'г.')
    .replace(/\bгород\b/gi, 'г.')
    .replace(/\bдеревни\b/gi, 'д.')
    .replace(/\bдеревня\b/gi, 'д.')
    .replace(/\bпос[её]лка\b/gi, 'пос.')
    .replace(/\bпос[её]лок\b/gi, 'пос.')
    .replace(/\bгородского\s+округа\b/gi, 'округа')
    .replace(/\bрайона\b/gi, 'округа')
    .replace(/\bмосковской\s+области\b/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/^[\s.,;/-]+|[\s.,;/-]+$/g, '')
    .trim();

  return normalizeChurchDisplayCase(softenCapsPhrase(text));
}

function formatSundaySchoolInstitutionName(egrulName) {
  const part = extractChurchNamePart(egrulName);
  if (!part) return SUNDAY_SCHOOL_TYPE;
  if (new RegExp(`^${SUNDAY_SCHOOL_TYPE}(?:\\s|$)`, 'i').test(part)) {
    return normalizeChurchDisplayCase(part);
  }
  return normalizeChurchDisplayCase(`${SUNDAY_SCHOOL_TYPE} ${part}`);
}
const DEFAULT_FEDERAL_DISTRICT = 'Центральный федеральный округ';
const DEFAULT_RF_SUBJECT = 'Московская область';

const deanerySelect = document.getElementById('deanery');
const dioceseSelect = document.getElementById('diocese');
const birthYearSelect = document.getElementById('birthYear');
const institutionType = document.getElementById('institutionType');
const institutionName = document.getElementById('institutionName');
const institutionNameLabel = document.getElementById('institutionNameLabel');
const institutionNameNote = document.getElementById('institutionNameNote');
const institutionSuggest = document.getElementById('institutionSuggest');
const openOverlayBtn = document.getElementById('openOverlayBtn');
const downloadCsvBtn = document.getElementById('downloadCsvBtn');
const submitReviewBtn = document.getElementById('submitReviewBtn');
const getCertificateBtn = document.getElementById('getCertificateBtn');
const cancelOverlayBtn = document.getElementById('cancelOverlayBtn');
const overlay = document.getElementById('overlay');
const responsibleOverlay = document.getElementById('responsibleOverlay');
const responsibleForm = document.getElementById('responsibleForm');
const responsibleFullNameInput = document.getElementById('responsibleFullName');
const responsiblePhoneInput = document.getElementById('responsiblePhone');
const responsibleStatus = document.getElementById('responsibleStatus');
const closeResponsibleBtn = document.getElementById('closeResponsibleBtn');
const cancelResponsibleBtn = document.getElementById('cancelResponsibleBtn');
const deaneryAccessOverlay = document.getElementById('deaneryAccessOverlay');
const deaneryAccessForm = document.getElementById('deaneryAccessForm');
const deaneryAccessLead = document.getElementById('deaneryAccessLead');
const deaneryAccessCodeInput = document.getElementById('deaneryAccessCode');
const deaneryAccessStatus = document.getElementById('deaneryAccessStatus');
const closeDeaneryAccessBtn = document.getElementById('closeDeaneryAccessBtn');
const cancelDeaneryAccessBtn = document.getElementById('cancelDeaneryAccessBtn');
const addressChipBtn = document.getElementById('addressChipBtn');
const addressOverlay = document.getElementById('addressOverlay');
const closeAddressBtn = document.getElementById('closeAddressBtn');
const closeAddressActionBtn = document.getElementById('closeAddressActionBtn');
const confirmOverlay = document.getElementById('confirmOverlay');
const confirmTitle = document.getElementById('confirmTitle');
const confirmLead = document.getElementById('confirmLead');
const confirmOkBtn = document.getElementById('confirmOkBtn');
const confirmCancelBtn = document.getElementById('confirmCancelBtn');
const confirmCancelActionBtn = document.getElementById('confirmCancelActionBtn');
let confirmResolver = null;
const noticeOverlay = document.getElementById('noticeOverlay');
const noticeLead = document.getElementById('noticeLead');
const closeNoticeBtn = document.getElementById('closeNoticeBtn');
const closeNoticeActionBtn = document.getElementById('closeNoticeActionBtn');
const workForm = document.getElementById('workForm');
const doneCard = document.getElementById('doneCard');
const overlayLead = document.getElementById('overlayLead');
const preHint = document.getElementById('preHint');
const formStatus = document.getElementById('formStatus');
const nextParticipantBtn = document.getElementById('nextParticipantBtn');
const finishBtn = document.getElementById('finishBtn');
const doneText = document.getElementById('doneText');
const nominationSelect = document.getElementById('nomination');
const deaneryParticipants = document.getElementById('deaneryParticipants');
const deaneryParticipantsTitle = document.getElementById('deaneryParticipantsTitle');
const deaneryParticipantsList = document.getElementById('deaneryParticipantsList');
const quotaNote = document.getElementById('quotaNote');
const QUOTA_RULES = [
  {
    key: 'icon',
    min: 1,
    match: (p) => p.nomination === '«Православная икона»',
  },
  {
    key: 'porcelain',
    min: 3,
    match: (p) => p.nomination === '«Роспись по фарфору»',
  },
  {
    key: 'main-young',
    min: 10,
    match: (p) => p.nomination === '«Основная тематика»' && Number(p.age) >= 9 && Number(p.age) <= 12,
  },
  {
    key: 'main-old',
    min: 10,
    match: (p) => p.nomination === '«Основная тематика»' && Number(p.age) >= 13 && Number(p.age) <= 17,
  },
];
const overlayTitle = document.getElementById('overlayTitle');
const saveParticipantBtn = document.getElementById('saveParticipantBtn');
const teacherPhoneInput = document.getElementById('teacherPhone');
const representativePhoneInput = document.getElementById('representativePhone');
const PHONE_PATTERN = /^\+7\(\d{3}\)\d{3}-\d{2}-\d{2}$/;
const PHONE_MASK = '+7(___)___-__-__';

let participantIndex = 1;
let draft = { diocese: '', deanery: '' };
let editingId = null;
let egrulSelected = false;
let suggestItems = [];
let suggestTimer = null;
let activeSuggestIndex = -1;
let participantsCache = [];
let lastConfirmedDiocese = '';
let lastConfirmedDeanery = '';
let suppressDeaneryChange = false;
let suppressDioceseChange = false;
let pendingReviewContext = null;

for (let year = COMPETITION_YEAR - MIN_AGE; year >= COMPETITION_YEAR - MAX_AGE; year -= 1) {
  const age = COMPETITION_YEAR - year;
  const option = document.createElement('option');
  option.value = String(year);
  option.textContent = `${year} (${age} лет в ${COMPETITION_YEAR})`;
  birthYearSelect.appendChild(option);
}

function updateAgeFromBirthYear() {
  const birthYear = birthYearSelect.value;
  if (!birthYear) return null;
  return COMPETITION_YEAR - Number(birthYear);
}

function updateNominationOptions() {
  const age = updateAgeFromBirthYear();
  const under13 = age != null && age < 13;

  for (const option of nominationSelect.options) {
    const minAge = Number(option.dataset.minAge || 0);
    if (!minAge) continue;
    option.hidden = under13;
    option.disabled = under13;
  }

  if (under13) {
    nominationSelect.value = '«Основная тематика»';
    return;
  }

  nominationSelect.value = '';
}

function hideSuggest() {
  institutionSuggest.hidden = true;
  institutionSuggest.innerHTML = '';
  institutionSuggest.classList.remove('is-fixed');
  institutionSuggest.style.cssText = '';
  const wrap = institutionName?.closest('.suggest-wrap');
  if (wrap && institutionSuggest.parentElement !== wrap) {
    wrap.appendChild(institutionSuggest);
  }
  suggestItems = [];
  activeSuggestIndex = -1;
}

function positionInstitutionSuggest() {
  if (!institutionName || !institutionSuggest || institutionSuggest.hidden) return;
  const rect = institutionName.getBoundingClientRect();
  if (institutionSuggest.parentElement !== document.body) {
    document.body.appendChild(institutionSuggest);
  }
  institutionSuggest.classList.add('is-fixed');
  institutionSuggest.style.position = 'fixed';
  institutionSuggest.style.left = `${Math.round(rect.left)}px`;
  institutionSuggest.style.top = `${Math.round(rect.bottom + 4)}px`;
  institutionSuggest.style.width = `${Math.round(rect.width)}px`;
  institutionSuggest.style.right = 'auto';
  institutionSuggest.style.zIndex = '1000';
}

function renderSuggest(items) {
  suggestItems = items;
  activeSuggestIndex = -1;

  if (!items.length) {
    institutionSuggest.innerHTML =
      '<li class="suggest-empty" role="presentation">Ничего не найдено в ЕГРЮЛ</li>';
    institutionSuggest.hidden = false;
    positionInstitutionSuggest();
    return;
  }

  institutionSuggest.innerHTML = items
    .map((item, index) => {
      const placeParts = [item.region, item.locality].filter(Boolean);
      const place = placeParts.join(' · ');
      const meta = [place || 'Населённый пункт не указан', item.inn ? `ИНН ${item.inn}` : '']
        .filter(Boolean)
        .join(' · ');
      return `
      <li data-index="${index}" role="option">
        ${escapeHtml(item.name)}
        <span class="suggest-meta">${escapeHtml(meta)}</span>
      </li>`;
    })
    .join('');
  institutionSuggest.hidden = false;
  positionInstitutionSuggest();
}

function phoneDigits(value) {
  let digits = String(value || '').replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  if (digits[0] === '8') digits = `7${digits.slice(1)}`;
  if (digits[0] !== '7') digits = `7${digits}`;
  return digits.slice(0, 11);
}

function formatPhoneInput(value) {
  const digits = phoneDigits(value).slice(1); // 10 subscriber digits
  if (!digits.length) return '';
  let index = 0;
  return PHONE_MASK.replace(/_/g, () => (index < digits.length ? digits[index++] : '_'));
}

function formatPhoneMask(subscriberDigits) {
  const digits = String(subscriberDigits || '')
    .replace(/\D/g, '')
    .slice(0, 10);
  let index = 0;
  return PHONE_MASK.replace(/_/g, () => (index < digits.length ? digits[index++] : '_'));
}

function isPhoneComplete(value) {
  return PHONE_PATTERN.test(String(value || '').trim());
}

function looksLikePersonFio(value) {
  const text = String(value || '')
    .trim()
    .replace(/\s+/g, ' ');
  if (!text) return false;

  // Названия организаций/учреждений обычно содержат такие маркеры.
  if (
    /(?:школ|гимназ|лицей|детск|сад\b|доу\b|мбоу|гбоу|маоу|гаоу|фгбоу|ооо\b|ано\b|нко\b|учрежд|организац|храм|церков|приход|монастыр|дом\s+культур|дворец|центр|колледж|техникум|универс|академи|институт|студи|кружок|секци|библиотек|музей|театр|воскресн|прич[её]т|епарх|благочин|№|\d|["«»()])/i.test(
      text
    )
  ) {
    return false;
  }

  const words = text.split(' ');
  if (words.length < 2 || words.length > 4) return false;

  // Фамилия / имя / отчество или инициалы: Иванов Иван Иванович, Иванов И.И.
  const namePart = /^(?:[А-ЯЁа-яё]{2,}(?:-[А-ЯЁа-яё]{2,})?|[А-ЯЁа-яё]\.?)$/;
  if (!words.every((word) => namePart.test(word))) return false;

  return words.some((word) => /^[А-ЯЁа-яё]{2,}/.test(word));
}

function bindPhoneMask(input) {
  if (!input) return;

  let applying = false;

  const placeCaret = () => {
    const pos = input.value.indexOf('_');
    const caret = pos === -1 ? input.value.length : pos;
    requestAnimationFrame(() => {
      try {
        input.setSelectionRange(caret, caret);
      } catch {
        // ignore
      }
    });
  };

  const setFromSubscriberDigits = (subscriberDigits) => {
    applying = true;
    input.value = formatPhoneMask(subscriberDigits);
    applying = false;
    placeCaret();
  };

  input.addEventListener('focus', () => {
    const digits = phoneDigits(input.value).slice(1);
    setFromSubscriberDigits(digits);
  });

  input.addEventListener('beforeinput', (event) => {
    const type = event.inputType || '';

    if (type === 'insertText' || type === 'insertFromPaste' || type === 'insertCompositionText') {
      event.preventDefault();
      const incoming = String(event.data || '').replace(/\D/g, '');
      if (!incoming) return;
      const current = phoneDigits(input.value).slice(1);
      const next =
        type === 'insertFromPaste' ? incoming.slice(0, 10) : (current + incoming).slice(0, 10);
      setFromSubscriberDigits(next);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }

    if (type.startsWith('delete')) {
      event.preventDefault();
      const current = phoneDigits(input.value).slice(1);
      setFromSubscriberDigits(current.slice(0, -1));
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });

  // Fallback if beforeinput is unavailable or skipped
  input.addEventListener('input', () => {
    if (applying) return;
    setFromSubscriberDigits(phoneDigits(input.value).slice(1));
  });

  input.addEventListener('keydown', (event) => {
    if (event.key !== 'Backspace' && event.key !== 'Delete') return;
    if (event.defaultPrevented) return;
    event.preventDefault();
    const current = phoneDigits(input.value).slice(1);
    setFromSubscriberDigits(current.slice(0, -1));
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });

  input.addEventListener('blur', () => {
    if (!isPhoneComplete(input.value)) {
      input.value = '';
    } else {
      input.value = formatPhoneInput(input.value);
    }
  });
}

bindPhoneMask(teacherPhoneInput);
bindPhoneMask(representativePhoneInput);
bindPhoneMask(responsiblePhoneInput);

/** Слово: первая буква заглавная, остальные строчные; через дефис — каждое часть. */
function titleCaseRuWord(word) {
  return String(word || '')
    .split('-')
    .map((part) => {
      if (!part) return part;
      if (/^(г|с|д|п|пос)\.?$/i.test(part)) return part.toLocaleLowerCase('ru-RU');
      const first = part.charAt(0).toLocaleUpperCase('ru-RU');
      const rest = part.slice(1).toLocaleLowerCase('ru-RU');
      return `${first}${rest}`;
    })
    .join('-');
}

/**
 * ФИО и населённые пункты: каждое собственное имя с заглавной
 * (Старая Русса, Анна-Мария), остальные буквы слова — строчные.
 */
function capitalizeProperRu(value) {
  let text = String(value ?? '');
  const protectedParts = [];

  // г.о. / м.о. (и варианты с пробелами / регистром) — целиком строчными
  text = text.replace(/(^|[\s(])([ГгМм])\s*\.\s*[Оо]\s*\./g, (match, lead, letter) => {
    const prefix = letter.toLocaleLowerCase('ru-RU') === 'м' ? 'м.о.' : 'г.о.';
    const token = `\u0000${protectedParts.length}\u0000`;
    protectedParts.push(prefix);
    return `${lead}${token}`;
  });

  // Сокращения населённых пунктов — строчными
  text = text
    .replace(/(^|[\s(])[Гг]\.\s*/g, '$1г. ')
    .replace(/(^|[\s(])[Сс]\.\s*/g, '$1с. ')
    .replace(/(^|[\s(])[Дд]\.\s*/g, '$1д. ')
    .replace(/(^|[\s(])[Пп]ос\.\s*/g, '$1пос. ');

  // Каждое словесное/дефисное собственное имя
  text = text.replace(/[А-ЯЁа-яёA-Za-z]+(?:-[А-ЯЁа-яёA-Za-z]+)*/g, (word) => {
    if (/^(г|с|д|п|пос)\.?$/i.test(word)) {
      return word.toLocaleLowerCase('ru-RU');
    }
    return titleCaseRuWord(word);
  });

  protectedParts.forEach((prefix, index) => {
    text = text.replace(`\u0000${index}\u0000`, prefix);
  });

  return text;
}

function bindAutoCapitalize(input) {
  if (!input) return;
  input.addEventListener('input', () => {
    const prev = input.value;
    const next = capitalizeProperRu(prev);
    if (next === prev) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    input.value = next;
    if (typeof start === 'number' && typeof end === 'number') {
      try {
        input.setSelectionRange(start, end);
      } catch {
        // ignore
      }
    }
  });
}

function applyFieldCapitalize(input) {
  if (!input) return;
  const next = capitalizeProperRu(input.value);
  if (next !== input.value) input.value = next;
}

[
  document.getElementById('lastName'),
  document.getElementById('firstName'),
  document.getElementById('teacherName'),
  document.getElementById('representativeName'),
  document.getElementById('responsibleFullName'),
  workForm?.querySelector('[name="rfSubject"]'),
  // municipalFormation: format on blur/save only — live input mangles г.о./м.о. mid-typing
  workForm?.querySelector('[name="locality"]'),
].forEach(bindAutoCapitalize);

const MUNICIPAL_PREFIX_GO = 'г.о.';
const MUNICIPAL_PREFIX_MO = 'м.о.';
const MUNICIPAL_PREFIX_RE = /^(г\s*\.\s*о\s*\.|м\s*\.\s*о\s*\.)\s*/i;
const municipalFormationInput = workForm?.querySelector('[name="municipalFormation"]');
const municipalTypeGo = document.getElementById('municipalTypeGo');
const municipalTypeMo = document.getElementById('municipalTypeMo');

function normalizeMunicipalPrefix(raw) {
  const compact = String(raw || '')
    .replace(/\s+/g, '')
    .toLocaleLowerCase('ru-RU');
  if (compact === 'г.о.') return MUNICIPAL_PREFIX_GO;
  if (compact === 'м.о.') return MUNICIPAL_PREFIX_MO;
  return null;
}

function parseMunicipalFormationValue(value) {
  const text = String(value ?? '');
  const match = text.match(MUNICIPAL_PREFIX_RE);
  if (!match) return { prefix: null, rest: text };
  return {
    prefix: normalizeMunicipalPrefix(match[1]),
    rest: text.slice(match[0].length),
  };
}

function setMunicipalFormationValue(prefix, rest) {
  if (!municipalFormationInput) return;
  const name = String(rest ?? '');
  let next = '';
  if (prefix) {
    next = name.trimStart() ? `${prefix} ${name.trimStart()}` : `${prefix} `;
  } else {
    next = name;
  }
  municipalFormationInput.value = capitalizeProperRu(next);
}

function syncMunicipalTypeCheckboxesFromInput() {
  if (!municipalTypeGo || !municipalTypeMo || !municipalFormationInput) return;
  const { prefix } = parseMunicipalFormationValue(municipalFormationInput.value);
  municipalTypeGo.checked = prefix === MUNICIPAL_PREFIX_GO;
  municipalTypeMo.checked = prefix === MUNICIPAL_PREFIX_MO;
}

function onMunicipalTypeToggle(changed) {
  if (!municipalTypeGo || !municipalTypeMo || !municipalFormationInput) return;
  const { rest } = parseMunicipalFormationValue(municipalFormationInput.value);

  if (changed === municipalTypeGo && municipalTypeGo.checked) {
    municipalTypeMo.checked = false;
    setMunicipalFormationValue(MUNICIPAL_PREFIX_GO, rest);
  } else if (changed === municipalTypeMo && municipalTypeMo.checked) {
    municipalTypeGo.checked = false;
    setMunicipalFormationValue(MUNICIPAL_PREFIX_MO, rest);
  } else {
    setMunicipalFormationValue(null, rest);
  }

  syncMunicipalTypeCheckboxesFromInput();
  municipalFormationInput.dispatchEvent(new Event('input', { bubbles: true }));
  municipalFormationInput.focus();
  try {
    const len = municipalFormationInput.value.length;
    municipalFormationInput.setSelectionRange(len, len);
  } catch {
    // ignore
  }
}

if (municipalFormationInput) {
  municipalFormationInput.addEventListener('blur', () => {
    applyFieldCapitalize(municipalFormationInput);
    syncMunicipalTypeCheckboxesFromInput();
  });
}

if (municipalTypeGo && municipalTypeMo && municipalFormationInput) {
  municipalTypeGo.addEventListener('change', () => onMunicipalTypeToggle(municipalTypeGo));
  municipalTypeMo.addEventListener('change', () => onMunicipalTypeToggle(municipalTypeMo));
  municipalFormationInput.addEventListener('input', syncMunicipalTypeCheckboxesFromInput);
  syncMunicipalTypeCheckboxesFromInput();
}

function uniqueValues(values) {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    const normalized = String(value || '').trim();
    if (!normalized) continue;
    const key = normalized.toLocaleLowerCase('ru-RU');
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }
  return result;
}

function hideAllPriorSuggests() {
  document.querySelectorAll('.suggest-list[data-prior]').forEach((list) => {
    list.hidden = true;
    list.innerHTML = '';
  });
}

function setupPriorSuggest(input, listEl, getOptions) {
  if (!input || !listEl) return;
  listEl.dataset.prior = '1';
  let items = [];
  let activeIndex = -1;

  const hide = () => {
    listEl.hidden = true;
    listEl.innerHTML = '';
    items = [];
    activeIndex = -1;
  };

  const render = (options) => {
    items = options.slice(0, 8);
    activeIndex = -1;
    if (!items.length) {
      hide();
      return;
    }

    listEl.innerHTML = items
      .map(
        (item, index) => `
        <li data-index="${index}" role="option">
          ${escapeHtml(item.label)}
          ${item.meta ? `<span class="suggest-meta">${escapeHtml(item.meta)}</span>` : ''}
        </li>`
      )
      .join('');
    listEl.hidden = false;
  };

  const refresh = () => {
    if (editingId) {
      hide();
      return;
    }
    const options = getOptions(input.value.trim());
    render(options);
  };

  const apply = (item) => {
    if (item.apply) item.apply();
    else input.value = item.value;
    hide();
    input.dispatchEvent(new Event('input', { bubbles: true }));
  };

  input.addEventListener('input', () => {
    // phone mask may rewrite value in same tick; wait a frame
    requestAnimationFrame(refresh);
  });

  input.addEventListener('focus', () => {
    requestAnimationFrame(refresh);
  });

  input.addEventListener('blur', () => {
    setTimeout(hide, 150);
  });

  input.addEventListener('keydown', (event) => {
    if (listEl.hidden || !items.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      activeIndex = Math.min(activeIndex + 1, items.length - 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      apply(items[activeIndex]);
      return;
    } else if (event.key === 'Escape') {
      hide();
      return;
    } else {
      return;
    }
    [...listEl.children].forEach((li, index) => {
      li.classList.toggle('active', index === activeIndex);
    });
  });

  listEl.addEventListener('mousedown', (event) => {
    const li = event.target.closest('li[data-index]');
    if (!li) return;
    event.preventDefault();
    apply(items[Number(li.dataset.index)]);
  });
}

function matchesQuery(value, query) {
  if (!query) return true;
  return String(value || '')
    .toLocaleLowerCase('ru-RU')
    .includes(query.toLocaleLowerCase('ru-RU'));
}

function priorParticipantOptions(query) {
  const options = [];
  const seen = new Set();

  for (const person of participantsCache) {
    const lastName = person.lastName || '';
    const firstName = person.firstName || '';
    const key = `${lastName}|${firstName}`.toLocaleLowerCase('ru-RU');
    if (!lastName || seen.has(key)) continue;
    if (!matchesQuery(`${lastName} ${firstName}`, query) && !matchesQuery(lastName, query)) {
      continue;
    }
    seen.add(key);
    options.push({
      label: `${lastName} ${firstName}`.trim(),
      meta: [person.representativePhone, person.teacherPhone].filter(Boolean).join(' · '),
      value: lastName,
      apply: () => {
        document.getElementById('lastName').value = lastName;
        document.getElementById('firstName').value = firstName;
        if (person.representativeName) {
          document.getElementById('representativeName').value = person.representativeName;
        }
        if (person.representativePhone) {
          representativePhoneInput.value = formatPhoneInput(person.representativePhone);
        }
        if (person.teacherName) {
          document.getElementById('teacherName').value = person.teacherName;
        }
        if (person.teacherPhone) {
          teacherPhoneInput.value = formatPhoneInput(person.teacherPhone);
        }
        autofillPhonesByNames();
        autofillByIdentityMatch();
      },
    });
  }

  return options;
}

function findPhoneByPersonName(fieldName, fieldPhone, nameValue) {
  const query = String(nameValue || '').trim().toLocaleLowerCase('ru-RU');
  if (!query) return '';

  const match = participantsCache.find(
    (item) => String(item[fieldName] || '').trim().toLocaleLowerCase('ru-RU') === query && item[fieldPhone]
  );
  return match ? formatPhoneInput(match[fieldPhone]) : '';
}

function autofillPhonesByNames() {
  if (editingId) return;

  const teacherNameValue = document.getElementById('teacherName')?.value || '';
  const representativeNameValue = document.getElementById('representativeName')?.value || '';

  const teacherPhone = findPhoneByPersonName('teacherName', 'teacherPhone', teacherNameValue);
  if (teacherPhone) teacherPhoneInput.value = teacherPhone;

  const representativePhone = findPhoneByPersonName(
    'representativeName',
    'representativePhone',
    representativeNameValue
  );
  if (representativePhone) representativePhoneInput.value = representativePhone;
}

function priorValueOptions(field, query, { phone = false } = {}) {
  let source = participantsCache.map((item) => item[field]);

  if (field === 'firstName') {
    const lastName = document.getElementById('lastName')?.value.trim().toLocaleLowerCase('ru-RU');
    if (lastName) {
      const paired = participantsCache
        .filter((item) => (item.lastName || '').toLocaleLowerCase('ru-RU') === lastName)
        .map((item) => item.firstName);
      if (paired.some(Boolean)) source = paired;
    }
  }

  const values = uniqueValues(source);
  return values
    .filter((value) => matchesQuery(value, String(query || '').replace(/_/g, '')))
    .map((value) => {
      const display = phone ? formatPhoneInput(value) : value;
      if (!display || String(display).includes('_')) return null;

      let meta = '';
      if (field === 'teacherName') {
        meta = findPhoneByPersonName('teacherName', 'teacherPhone', value);
      } else if (field === 'representativeName') {
        meta = findPhoneByPersonName('representativeName', 'representativePhone', value);
      }

      return {
        label: display,
        meta,
        value: display,
        apply: () => {
          if (field === 'teacherPhone') teacherPhoneInput.value = display;
          else if (field === 'representativePhone') representativePhoneInput.value = display;
          else document.getElementById(field).value = display;

          if (field === 'teacherName' || field === 'representativeName') {
            autofillPhonesByNames();
          }
        },
      };
    })
    .filter(Boolean);
}

setupPriorSuggest(document.getElementById('lastName'), document.getElementById('lastNameSuggest'), (query) =>
  priorParticipantOptions(query)
);
setupPriorSuggest(document.getElementById('firstName'), document.getElementById('firstNameSuggest'), (query) =>
  priorValueOptions('firstName', query)
);
setupPriorSuggest(document.getElementById('teacherName'), document.getElementById('teacherNameSuggest'), (query) =>
  priorValueOptions('teacherName', query)
);
setupPriorSuggest(
  document.getElementById('representativeName'),
  document.getElementById('representativeNameSuggest'),
  (query) => priorValueOptions('representativeName', query)
);
setupPriorSuggest(teacherPhoneInput, document.getElementById('teacherPhoneSuggest'), (query) =>
  priorValueOptions('teacherPhone', query, { phone: true })
);
setupPriorSuggest(
  representativePhoneInput,
  document.getElementById('representativePhoneSuggest'),
  (query) => priorValueOptions('representativePhone', query, { phone: true })
);

const teacherNameInput = document.getElementById('teacherName');
const representativeNameInput = document.getElementById('representativeName');

teacherNameInput?.addEventListener('change', autofillPhonesByNames);
teacherNameInput?.addEventListener('blur', autofillPhonesByNames);
teacherNameInput?.addEventListener('input', () => {
  if (findPhoneByPersonName('teacherName', 'teacherPhone', teacherNameInput.value)) {
    autofillPhonesByNames();
  }
});
representativeNameInput?.addEventListener('change', autofillPhonesByNames);
representativeNameInput?.addEventListener('blur', autofillPhonesByNames);
representativeNameInput?.addEventListener('input', () => {
  if (
    findPhoneByPersonName('representativeName', 'representativePhone', representativeNameInput.value)
  ) {
    autofillPhonesByNames();
  }
});

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function normalizeDeanery(value) {
  return String(value ?? '').trim();
}

const SELECTION_STORAGE_KEY = 'kbm-form-selection';
const ACCESS_STORAGE_KEY = 'kbm-deanery-access-codes';

/** @type {Map<string, string>} */
const deaneryAccessCodes = new Map();
let pendingAccessDeanery = '';
/** @type {((ok: boolean) => void) | null} */
let accessResolver = null;

function readStoredAccessCodes() {
  try {
    const raw = sessionStorage.getItem(ACCESS_STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return;
    for (const [deanery, code] of Object.entries(data)) {
      const key = normalizeDeanery(deanery);
      const value = String(code || '').trim();
      if (key && value) deaneryAccessCodes.set(key, value);
    }
  } catch {
    // ignore
  }
}

function persistAccessCodes() {
  try {
    const payload = Object.fromEntries(deaneryAccessCodes.entries());
    sessionStorage.setItem(ACCESS_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

function getUnlockedCode(deanery) {
  const key = normalizeDeanery(deanery);
  return key ? deaneryAccessCodes.get(key) || '' : '';
}

function setUnlockedCode(deanery, code) {
  const key = normalizeDeanery(deanery);
  const value = String(code || '').trim();
  if (!key || !value) return;
  deaneryAccessCodes.set(key, value);
  persistAccessCodes();
}

function deaneryAuthHeaders(deanery = deanerySelect.value, { json = true } = {}) {
  const key = normalizeDeanery(deanery);
  const code = getUnlockedCode(key);
  const headers = {};
  // Fetch forbids non-ISO-8859-1 header values — encode Cyrillic deanery names.
  if (key) headers['X-Deanery'] = encodeURIComponent(key);
  if (code) headers['X-Deanery-Code'] = code;
  if (json) headers['Content-Type'] = 'application/json';
  return headers;
}

function showDeaneryAccessStatus(message, isError = false) {
  if (!deaneryAccessStatus) return;
  const text = String(message || '').trim();
  deaneryAccessStatus.textContent = text;
  deaneryAccessStatus.classList.toggle('show', Boolean(text));
  deaneryAccessStatus.classList.toggle('error', Boolean(text) && isError);
}

function openDeaneryAccessOverlay(deanery) {
  pendingAccessDeanery = normalizeDeanery(deanery);
  if (deaneryAccessLead) {
    deaneryAccessLead.textContent = pendingAccessDeanery
      ? `Введите код доступа для благочиния «${pendingAccessDeanery}», полученный от организатора.`
      : 'Введите код доступа, полученный от организатора.';
  }
  if (deaneryAccessCodeInput) {
    deaneryAccessCodeInput.value = '';
  }
  showDeaneryAccessStatus('');
  deaneryAccessOverlay?.classList.add('open');
  deaneryAccessOverlay?.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => deaneryAccessCodeInput?.focus());
}

function closeDeaneryAccessOverlay(result = false) {
  deaneryAccessOverlay?.classList.remove('open');
  deaneryAccessOverlay?.setAttribute('aria-hidden', 'true');
  pendingAccessDeanery = '';
  if (accessResolver) {
    const resolve = accessResolver;
    accessResolver = null;
    resolve(Boolean(result));
  }
}

async function isDeaneryAccessRequired(deanery) {
  const key = normalizeDeanery(deanery);
  if (!key) return false;
  const response = await fetch(`/api/deanery-access/status?deanery=${encodeURIComponent(key)}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Не удалось проверить доступ');
  return Boolean(data.required);
}

async function verifyDeaneryAccessCode(deanery, code) {
  const response = await fetch('/api/deanery-access/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deanery, code }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Неверный код доступа');
  return true;
}

/** Запрашивает код, если он нужен и ещё не введён в этой сессии. */
async function ensureDeaneryAccess(deanery) {
  const key = normalizeDeanery(deanery);
  if (!key) return true;
  if (getUnlockedCode(key)) return true;

  let required = false;
  try {
    required = await isDeaneryAccessRequired(key);
  } catch (error) {
    showStatus(error.message || 'Не удалось проверить доступ', true);
    return false;
  }
  if (!required) return true;

  return new Promise((resolve) => {
    if (accessResolver) {
      accessResolver(false);
      accessResolver = null;
    }
    accessResolver = resolve;
    openDeaneryAccessOverlay(key);
  });
}

function readStoredSelection() {
  try {
    const raw = localStorage.getItem(SELECTION_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return null;
    return {
      diocese: String(data.diocese || '').trim(),
      deanery: String(data.deanery || '').trim(),
    };
  } catch {
    return null;
  }
}

function persistSelection(diocese = dioceseSelect.value, deanery = deanerySelect.value) {
  const payload = {
    diocese: String(diocese || '').trim(),
    deanery: String(deanery || '').trim(),
  };
  try {
    if (!payload.diocese && !payload.deanery) {
      localStorage.removeItem(SELECTION_STORAGE_KEY);
      return;
    }
    localStorage.setItem(SELECTION_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota / private mode
  }
}

function restoreStoredSelection() {
  const stored = readStoredSelection();
  if (!stored) return;

  if (stored.diocese) {
    const hasDiocese = [...dioceseSelect.options].some((opt) => opt.value === stored.diocese);
    if (hasDiocese) {
      suppressDioceseChange = true;
      dioceseSelect.value = stored.diocese;
      suppressDioceseChange = false;
      draft.diocese = stored.diocese;
      lastConfirmedDiocese = stored.diocese;
    }
  }

  if (stored.deanery) {
    const hasDeanery = [...deanerySelect.options].some((opt) => opt.value === stored.deanery);
    if (hasDeanery) {
      suppressDeaneryChange = true;
      deanerySelect.value = stored.deanery;
      suppressDeaneryChange = false;
      draft.deanery = stored.deanery;
      lastConfirmedDeanery = stored.deanery;
    }
  }
}

function getParticipantsForDeanery(deanery) {
  const key = normalizeDeanery(deanery);
  if (!key) return [];
  return participantsCache.filter((item) => normalizeDeanery(item.deanery) === key);
}

function escapeCsv(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function buildDeaneryCsv(list, responsible = {}) {
  const headers = [
    '№',
    'Епархия',
    'Благочиние',
    'Фамилия',
    'Имя',
    'Возраст',
    'Название рисунка',
    'Адрес (округ, субъект, МО, населённый пункт)',
    'Номинация',
    'Название учреждения',
    'Тип учреждения',
    'Педагог (ФИО)',
    'Телефон преподавателя',
    'ФИО родителя / представителя',
    'Согласие о передаче прав',
    'Согласие на обработку перс. данных',
    'Документ, удостоверяющий личность',
    'Ответственное лицо (сан, ФИО)',
    'Телефон ответственного',
  ];

  const rows = list.map((p, i) => {
    const address = [p.federalDistrict, p.rfSubject, p.municipalFormation, p.locality]
      .map((value) => String(value || '').trim())
      .filter(Boolean)
      .join(', ');
    const repPhone = String(p.representativePhone || '').trim();
    const repName = String(p.representativeName || '').trim();
    const representative =
      repPhone && repName ? `${repPhone} (${repName})` : repPhone || (repName ? `(${repName})` : '');
    return [
      i + 1,
      p.diocese || '',
      p.deanery || '',
      p.lastName,
      p.firstName,
      p.age,
      p.workTitle,
      address,
      p.nomination,
      p.institutionName,
      p.institutionType,
      p.teacherName,
      p.teacherPhone,
      representative,
      p.rightsConsent ? 'есть' : 'нет',
      p.personalDataConsent ? 'есть' : 'нет',
      p.idDocumentConfirm ? 'есть' : 'нет',
      responsible.fullName || '',
      responsible.phone || '',
    ];
  });

  return `\uFEFF${[headers, ...rows].map((row) => row.map(escapeCsv).join(';')).join('\n')}`;
}

function syncParticipantIndex() {
  const count = getParticipantsForDeanery(deanerySelect.value).length;
  participantIndex = count + 1;
}

function renderQuotaCounter() {
  const deanery = deanerySelect.value;
  const list = getParticipantsForDeanery(deanery);

  for (const rule of QUOTA_RULES) {
    const item = document.querySelector(`[data-quota="${rule.key}"]`);
    if (!item) continue;
    const count = deanery ? list.filter(rule.match).length : 0;
    const countEl = item.querySelector('[data-count]');
    const barEl = item.querySelector('[data-bar]');
    const isComplete = count >= rule.min;
    if (countEl) countEl.textContent = String(count);
    if (barEl) {
      const ratio = Math.min(100, Math.round((count / rule.min) * 100));
      barEl.style.width = `${ratio}%`;
    }
    item.classList.toggle('is-done', isComplete);
    item.classList.toggle('is-low', !isComplete);
  }

  if (!deanery) {
    quotaNote.textContent = '';
    return;
  }

  const done = QUOTA_RULES.every((rule) => list.filter(rule.match).length >= rule.min);
  quotaNote.textContent = done
    ? `«${deanery}»: минимум выполнен`
    : `«${deanery}»: нужно добрать работы`;
}

function renderDeaneryParticipants() {
  const deanery = deanerySelect.value;
  const list = getParticipantsForDeanery(deanery);
  renderQuotaCounter();
  syncCertificateButton();

  if (downloadCsvBtn) {
    downloadCsvBtn.hidden = list.length === 0;
  }

  if (!deanery || !list.length) {
    deaneryParticipants.hidden = true;
    deaneryParticipantsList.innerHTML = '';
    if (deaneryParticipantsTitle) {
      deaneryParticipantsTitle.textContent = 'Заявленные участники';
    }
    return;
  }

  if (deaneryParticipantsTitle) {
    deaneryParticipantsTitle.textContent = `Заявленные участники (${list.length})`;
  }

  deaneryParticipantsList.innerHTML = list
    .map(
      (item, index) => `
      <li data-id="${escapeHtml(item.id)}">
        <div class="participant-info">
          <span class="participant-name">${index + 1}. ${escapeHtml(item.lastName)} ${escapeHtml(item.firstName)}</span>
          <span class="participant-meta">${escapeHtml(String(item.age ?? '—'))} лет · ${escapeHtml(item.workTitle)} · Номинация: <span class="nomination-underline">${escapeHtml(item.nomination)}</span></span>
        </div>
        <div class="participant-actions">
          <button type="button" class="btn-edit" data-edit="${escapeHtml(item.id)}">Исправить данные</button>
          <button
            type="button"
            class="participant-delete-btn"
            data-delete="${escapeHtml(item.id)}"
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
        </div>
      </li>`
    )
    .join('');
  deaneryParticipants.hidden = false;
}

function applySiteSettings(settings) {
  const brand = document.getElementById('heroBrand');
  const subtitle = document.getElementById('heroSubtitle');
  const chipsRoot = document.getElementById('heroChips');
  const addressBtn = document.getElementById('addressChipBtn');
  const addressTitle = document.getElementById('addressTitle');
  const addressText = document.getElementById('addressText');
  const addressPhoneLink = document.getElementById('addressPhoneLink');

  if (brand) brand.textContent = settings.brand || brand.textContent;
  if (subtitle) subtitle.textContent = settings.subtitle || subtitle.textContent;
  document.title = `Заявка участника — ${settings.brand || 'Красота Божьего мира'} ${settings.contestYear || ''}`.trim();

  if (chipsRoot && addressBtn) {
    const chipHtml = (settings.chips || [])
      .map((text) => `<span class="chip">${escapeHtml(text)}</span>`)
      .join('');
    chipsRoot.innerHTML = chipHtml;
    addressBtn.textContent = settings.addressButtonLabel || 'Адрес приема документов';
    chipsRoot.appendChild(addressBtn);
  } else if (addressBtn) {
    addressBtn.textContent = settings.addressButtonLabel || addressBtn.textContent;
  }

  if (addressTitle) {
    const title = settings.addressButtonLabel || addressTitle.textContent || 'Адрес приема документов';
    addressTitle.textContent = /:\s*$/.test(title) ? title : `${title}:`;
  }
  if (addressText) addressText.textContent = settings.addressText || addressText.textContent;
  if (addressPhoneLink) {
    const phone = settings.addressPhone || addressPhoneLink.textContent;
    addressPhoneLink.textContent = phone;
    addressPhoneLink.href = `tel:${String(phone).replace(/[^\d+]/g, '')}`;
  }
}

async function loadSiteSettings() {
  try {
    const response = await fetch('/api/settings');
    if (!response.ok) return;
    const settings = await response.json();
    applySiteSettings(settings);
  } catch {
    // оставляем значения по умолчанию из HTML
  }
}

async function syncCertificateButton() {
  if (!getCertificateBtn) return;
  const deanery = normalizeDeanery(deanerySelect.value);
  const acceptedBanner = document.getElementById('worksAcceptedBanner');
  const sentBanner = document.getElementById('dataSentBanner');
  const rejectedBanner = document.getElementById('worksRejectedBanner');
  const clarificationBanner = document.getElementById('worksClarificationBanner');
  const note = document.getElementById('certAccessNote');
  const hasParticipants =
    Boolean(deanery) &&
    participantsCache.some((item) => normalizeDeanery(item.deanery) === deanery);

  let confirmed = false;
  let submittedWaiting = false;
  let rejectedFull = false;
  let needsClarification = false;
  // Статус отклонения/подтверждения читаем даже если список участников ещё подгружается
  if (deanery) {
    try {
      const response = await fetch(`/api/submissions/${encodeURIComponent(deanery)}`);
      if (response.ok) {
        const submission = await response.json();
        const submittedMs = submission.submittedAt ? Date.parse(submission.submittedAt) : 0;
        const confirmedMs = submission.certificatesConfirmedAt
          ? Date.parse(submission.certificatesConfirmedAt)
          : 0;
        const rejected = Boolean(submission.rejected);
        const kind = String(submission.rejectionKind || '').trim();
        rejectedFull = rejected && kind !== 'partial';
        needsClarification = rejected && kind === 'partial';
        // После повторной отправки на проверку доступ снова закрывается,
        // пока организатор не отправит подтверждение заново.
        confirmed =
          !rejected &&
          hasParticipants &&
          Boolean(submission.certificatesConfirmed) &&
          Boolean(confirmedMs) &&
          (!submittedMs || confirmedMs >= submittedMs);
        submittedWaiting =
          !rejected && hasParticipants && Boolean(submittedMs) && !confirmed;
      }
    } catch {
      confirmed = false;
      submittedWaiting = false;
      rejectedFull = false;
      needsClarification = false;
    }
  }

  const blocked = rejectedFull || needsClarification;

  if (sentBanner) {
    sentBanner.hidden = !submittedWaiting;
  }
  if (rejectedBanner) {
    rejectedBanner.hidden = !rejectedFull;
  }
  if (clarificationBanner) {
    clarificationBanner.hidden = !needsClarification;
  }
  if (acceptedBanner) {
    acceptedBanner.hidden = !confirmed;
  }
  if (note) {
    // Пока благочиние не выбрано — подсказку не показываем
    note.hidden = !deanery || confirmed || blocked;
  }

  getCertificateBtn.disabled = !confirmed || blocked;
  getCertificateBtn.classList.toggle('is-muted', !confirmed || blocked);
  getCertificateBtn.removeAttribute('title');
}

async function refreshParticipantsCache() {
  const response = await fetch('/api/participants');
  const list = await response.json();
  participantsCache = Array.isArray(list) ? list : [];
  renderDeaneryParticipants();
  syncParticipantIndex();
  await syncCertificateButton();
}

function selectSuggest(item) {
  const type = institutionType.value;
  institutionName.value =
    type === SUNDAY_SCHOOL_TYPE
      ? formatSundaySchoolInstitutionName(item.name || item.shortName || '')
      : item.name;
  egrulSelected = true;
  hideSuggest();
}

/** Поиск ЕГРЮЛ только после второго слова (токены через пробел). */
function hasSecondSearchWord(value) {
  return String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length >= 2;
}

async function fetchEgrulSuggestions(
  query,
  { religiousOnly = false, locality = '', municipal = '', rfSubject = '' } = {}
) {
  const params = new URLSearchParams({ q: query });
  if (religiousOnly) params.set('filter', 'religious');
  if (locality) params.set('locality', locality);
  if (municipal) params.set('municipal', municipal);
  if (rfSubject) params.set('rfSubject', rfSubject);
  const response = await fetch(`/api/egrul-suggest?${params.toString()}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Ошибка поиска ЕГРЮЛ');
  }
  return Array.isArray(data) ? data : [];
}

function scheduleEgrulSearch() {
  clearTimeout(suggestTimer);
  const query = institutionName.value.trim();
  if (!usesEgrul() || !hasSecondSearchWord(query)) {
    hideSuggest();
    return;
  }

  const religiousOnly = institutionType.value === SUNDAY_SCHOOL_TYPE;
  const locality = String(workForm?.querySelector('[name="locality"]')?.value || '').trim();
  const municipal = String(
    workForm?.querySelector('[name="municipalFormation"]')?.value || ''
  ).trim();
  const rfSubject = String(workForm?.querySelector('[name="rfSubject"]')?.value || '').trim();

  suggestTimer = setTimeout(async () => {
    try {
      institutionSuggest.innerHTML =
        '<li class="suggest-empty" role="presentation">Ищем в ЕГРЮЛ…</li>';
      institutionSuggest.hidden = false;
      positionInstitutionSuggest();
      const items = await fetchEgrulSuggestions(query, {
        religiousOnly,
        locality: religiousOnly ? locality : '',
        municipal: religiousOnly ? municipal : '',
        rfSubject,
      });
      if (institutionName.value.trim() !== query) return;
      renderSuggest(items);
    } catch (error) {
      if (institutionName.value.trim() !== query) return;
      institutionSuggest.innerHTML = `<li class="suggest-empty" role="presentation">${escapeHtml(error.message || 'Ошибка поиска ЕГРЮЛ')}</li>`;
      institutionSuggest.hidden = false;
      positionInstitutionSuggest();
    }
  }, 350);
}

function updateInstitutionNameField({ clearValue = true } = {}) {
  const type = institutionType.value;
  const isSunday = type === SUNDAY_SCHOOL_TYPE;
  const isCulture = type === CULTURE_TYPE;
  const isIndependent = type === 'Самостоятельное участие';
  const isEgrul = usesEgrul(type);

  hideSuggest();
  if (clearValue) {
    institutionName.value = '';
    egrulSelected = false;
  }

  institutionNameLabel.textContent = isSunday
    ? 'Наименование религиозной организации'
    : 'Название учреждения';

  institutionNameNote.classList.toggle('is-hidden', !(isSunday || isCulture));
  if (isSunday) {
    institutionNameNote.textContent =
      'Выберите наименование из ЕГРЮЛ — в таблицу попадёт как «Воскресная школа …».';
  } else if (isCulture) {
    institutionNameNote.textContent =
      'Можно выбрать юрлицо из ЕГРЮЛ и дополнить название, либо ввести своё наименование вручную.';
  }

  institutionName.disabled = !type || isIndependent;
  institutionName.required = Boolean(type) && !isIndependent;
  institutionName.placeholder = !type
    ? 'Сначала выберите тип учреждения'
    : isCulture
      ? 'Своё название или выберите из ЕГРЮЛ и дополните'
      : isEgrul
        ? 'Начните вводить и выберите полное наименование из ЕГРЮЛ'
        : isIndependent
          ? 'Не заполняется'
          : '';
  institutionName.autocomplete = isEgrul ? 'off' : 'organization';
}

function setOverlayMode(isEdit) {
  overlayTitle.textContent = isEdit ? 'Исправление данных' : 'Данные по работе';
  saveParticipantBtn.textContent = isEdit ? 'Сохранить изменения' : 'Сохранить участника';
}

function formatWorkTitle(value, { keepTypingSpace = false } = {}) {
  let content = String(value ?? '')
    .replace(/^[«"„]+/, '')
    .replace(/[»"“]+$/, '');
  const typingSpace = keepTypingSpace && /\s$/.test(content);
  content = content.replace(/\s+/g, ' ').replace(/^\s+/, '');
  if (!typingSpace) content = content.trimEnd();
  if (!content.trim()) return '';

  const titled = `${content.charAt(0).toLocaleUpperCase('ru-RU')}${content.slice(1)}`;
  // Пробел перед » только на время набора следующего слова; в итоге его нет
  return `«${titled}${typingSpace ? ' ' : ''}»`;
}

function applyParticipantFields(participant, { mode = 'full' } = {}) {
  if (mode === 'full') {
    birthYearSelect.value = String(participant.birthYear || '');
    updateNominationOptions();
    nominationSelect.value = participant.nomination || '';
    workForm.lastName.value = capitalizeProperRu(participant.lastName || '');
    workForm.firstName.value = capitalizeProperRu(participant.firstName || '');
  }

  // identity-match: не подставляем название работы и номинацию
  if (mode !== 'identity-match') {
    workForm.workTitle.value = formatWorkTitle(participant.workTitle || '');
  }

  workForm.federalDistrict.value = participant.federalDistrict || DEFAULT_FEDERAL_DISTRICT;
  workForm.rfSubject.value = capitalizeProperRu(participant.rfSubject || DEFAULT_RF_SUBJECT);
  workForm.municipalFormation.value = capitalizeProperRu(participant.municipalFormation || '');
  syncMunicipalTypeCheckboxesFromInput();
  workForm.locality.value = capitalizeProperRu(participant.locality || '');
  institutionType.value = participant.institutionType || '';
  updateInstitutionNameField({ clearValue: false });
  institutionName.value = participant.institutionName || '';
  egrulSelected = usesEgrul(institutionType.value) && Boolean(institutionName.value);

  workForm.teacherName.value = capitalizeProperRu(participant.teacherName || '');
  teacherPhoneInput.value = formatPhoneInput(participant.teacherPhone || '');
  workForm.representativeName.value = capitalizeProperRu(participant.representativeName || '');
  representativePhoneInput.value = formatPhoneInput(participant.representativePhone || '');

  // При автозаполнении по ФИО+году галочки не проставляем
  if (mode !== 'identity-match') {
    workForm.rightsConsent.checked = Boolean(participant.rightsConsent);
    workForm.personalDataConsent.checked = Boolean(participant.personalDataConsent);
    workForm.idDocumentConfirm.checked = Boolean(participant.idDocumentConfirm);
  }
}

function isWorkTitleFilled(value = workForm.workTitle?.value) {
  return Boolean(
    String(value ?? '')
      .replace(/[«»"„“]/g, '')
      .trim()
  );
}

function isNominationFilled() {
  return Boolean(String(nominationSelect.value || '').trim());
}

function isAgeUnder13() {
  const age = updateAgeFromBirthYear();
  return age != null && age < 13;
}

let highlightAutofillManualFields = false;

function clearAutofillManualHighlights() {
  highlightAutofillManualFields = false;
  workForm.workTitle?.classList.remove('field-needs-input');
  nominationSelect?.classList.remove('field-needs-input');
}

function updateAutofillManualHighlights() {
  if (!highlightAutofillManualFields) {
    workForm.workTitle?.classList.remove('field-needs-input');
    nominationSelect?.classList.remove('field-needs-input');
    return;
  }

  workForm.workTitle?.classList.toggle('field-needs-input', !isWorkTitleFilled());

  // До 13 лет номинация ставится правилами и не подсвечивается
  const needNominationHighlight = !isAgeUnder13() && !isNominationFilled();
  nominationSelect?.classList.toggle('field-needs-input', needNominationHighlight);
}

function fillParticipantForm(participant) {
  editingId = participant.id;
  draft.diocese = participant.diocese || dioceseSelect.value;
  draft.deanery = participant.deanery || deanerySelect.value;
  clearAutofillManualHighlights();
  setOverlayMode(true);
  applyParticipantFields(participant, { mode: 'full' });
}

function findParticipantByIdentity() {
  const lastName = String(workForm.lastName?.value || '')
    .trim()
    .toLocaleLowerCase('ru-RU');
  const firstName = String(workForm.firstName?.value || '')
    .trim()
    .toLocaleLowerCase('ru-RU');
  const birthYear = String(birthYearSelect.value || '').trim();
  if (!lastName || !firstName || !birthYear) return null;

  return (
    participantsCache.find((person) => {
      if (editingId && person.id === editingId) return false;
      return (
        String(person.lastName || '')
          .trim()
          .toLocaleLowerCase('ru-RU') === lastName &&
        String(person.firstName || '')
          .trim()
          .toLocaleLowerCase('ru-RU') === firstName &&
        String(person.birthYear || '') === birthYear
      );
    }) || null
  );
}

let suppressIdentityAutofill = false;

function autofillByIdentityMatch() {
  if (suppressIdentityAutofill || editingId) return;
  const match = findParticipantByIdentity();
  if (!match) return;

  suppressIdentityAutofill = true;
  try {
    applyParticipantFields(match, { mode: 'identity-match' });
    // Номинацию не копируем; до 13 лет — «Основная тематика» по правилам
    updateNominationOptions();
    highlightAutofillManualFields = true;
    updateAutofillManualHighlights();
  } finally {
    suppressIdentityAutofill = false;
  }
}

function openNoticeOverlay(message) {
  if (!noticeOverlay || !noticeLead) return;
  noticeLead.textContent = message;
  noticeOverlay.classList.add('open');
  noticeOverlay.setAttribute('aria-hidden', 'false');
  closeNoticeActionBtn?.focus();
}

function closeNoticeOverlay() {
  noticeOverlay?.classList.remove('open');
  noticeOverlay?.setAttribute('aria-hidden', 'true');
}

function openOverlayForCreate() {
  editingId = null;
  setOverlayMode(false);
  draft.diocese = dioceseSelect.value;
  draft.deanery = deanerySelect.value;
  preHint.textContent = '';

  if (!draft.diocese) {
    openNoticeOverlay('Сначала выберите епархию');
    return;
  }

  if (!draft.deanery) {
    openNoticeOverlay('Сначала выберите благочиние');
    return;
  }

  clearStatus();
  resetWorkForm();
  workForm.style.display = 'block';
  doneCard.classList.remove('show');
  overlayLead.textContent = `Участник №${participantIndex} · ${draft.diocese} · ${draft.deanery}`;
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  birthYearSelect.focus();
}

function openOverlayForEdit(participant) {
  preHint.textContent = '';
  clearStatus();
  workForm.style.display = 'block';
  doneCard.classList.remove('show');
  fillParticipantForm(participant);
  overlayLead.textContent = `${participant.lastName} ${participant.firstName} · ${participant.diocese || draft.diocese} · ${participant.deanery}`;
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  workForm.lastName.focus();
}

function showStatus(message, isError = false) {
  formStatus.textContent = message;
  formStatus.classList.add('show');
  formStatus.classList.toggle('error', isError);
}

function clearStatus() {
  formStatus.classList.remove('show', 'error');
  formStatus.textContent = '';
}

function openOverlay() {
  openOverlayForCreate();
}

function closeOverlay() {
  hideSuggest();
  hideAllPriorSuggests();
  clearAutofillManualHighlights();
  editingId = null;
  setOverlayMode(false);
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
}

function showResponsibleStatus(message, isError = false) {
  if (!responsibleStatus) return;
  responsibleStatus.textContent = message;
  responsibleStatus.classList.add('show');
  responsibleStatus.classList.toggle('error', isError);
}

function clearResponsibleStatus() {
  if (!responsibleStatus) return;
  responsibleStatus.classList.remove('show', 'error');
  responsibleStatus.textContent = '';
}

async function openResponsibleOverlay(context) {
  pendingReviewContext = context;
  clearResponsibleStatus();
  responsibleForm.reset();
  responsiblePhoneInput.value = '';

  try {
    const response = await fetch('/api/application');
    if (response.ok) {
      const data = await response.json();
      const responsible = data.responsible || {};
      responsibleFullNameInput.value = responsible.fullName || '';
      if (isPhoneComplete(responsible.phone)) {
        responsiblePhoneInput.value = formatPhoneInput(responsible.phone);
      }
    }
  } catch {
    // ignore preload errors
  }

  responsibleOverlay.classList.add('open');
  responsibleOverlay.setAttribute('aria-hidden', 'false');
  responsibleFullNameInput.focus();
}

function closeResponsibleOverlay() {
  pendingReviewContext = null;
  clearResponsibleStatus();
  responsibleOverlay.classList.remove('open');
  responsibleOverlay.setAttribute('aria-hidden', 'true');
}

function resetWorkForm() {
  workForm.reset();
  editingId = null;
  clearAutofillManualHighlights();
  setOverlayMode(false);
  workForm.federalDistrict.value = DEFAULT_FEDERAL_DISTRICT;
  workForm.rfSubject.value = DEFAULT_RF_SUBJECT;
  updateNominationOptions();
  updateInstitutionNameField();
  workForm.style.display = 'block';
  doneCard.classList.remove('show');
}

birthYearSelect.addEventListener('change', () => {
  updateNominationOptions();
  autofillByIdentityMatch();
  updateAutofillManualHighlights();
});
institutionType.addEventListener('change', updateInstitutionNameField);

const workTitleInput = document.getElementById('workTitle');
workTitleInput?.addEventListener('input', () => {
  const prev = workTitleInput.value;
  const next = formatWorkTitle(prev, { keepTypingSpace: true });
  if (next !== prev) {
    const pos = workTitleInput.selectionStart;
    workTitleInput.value = next;
    // Курсор внутри кавычек: учитываем ведущую «
    if (typeof pos === 'number') {
      const adjusted = Math.min(
        Math.max(pos + (next.startsWith('«') && !prev.startsWith('«') ? 1 : 0), 1),
        next.length - 1
      );
      try {
        workTitleInput.setSelectionRange(adjusted, adjusted);
      } catch {
        // ignore
      }
    }
  }
  updateAutofillManualHighlights();
});
workTitleInput?.addEventListener('blur', () => {
  workTitleInput.value = formatWorkTitle(workTitleInput.value);
  updateAutofillManualHighlights();
});
nominationSelect?.addEventListener('change', updateAutofillManualHighlights);

const identityAutofillInputs = [
  document.getElementById('lastName'),
  document.getElementById('firstName'),
];
identityAutofillInputs.forEach((input) => {
  input?.addEventListener('change', autofillByIdentityMatch);
  input?.addEventListener('blur', autofillByIdentityMatch);
});

institutionName.addEventListener('input', () => {
  if (!usesEgrul()) return;
  egrulSelected = false;
  scheduleEgrulSearch();
});

institutionName.addEventListener('keydown', (event) => {
  if (institutionSuggest.hidden || !suggestItems.length) return;

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    activeSuggestIndex = Math.min(activeSuggestIndex + 1, suggestItems.length - 1);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    activeSuggestIndex = Math.max(activeSuggestIndex - 1, 0);
  } else if (event.key === 'Enter' && activeSuggestIndex >= 0) {
    event.preventDefault();
    selectSuggest(suggestItems[activeSuggestIndex]);
    return;
  } else if (event.key === 'Escape') {
    hideSuggest();
    return;
  } else {
    return;
  }

  [...institutionSuggest.children].forEach((li, index) => {
    li.classList.toggle('active', index === activeSuggestIndex);
  });
});

institutionSuggest.addEventListener('mousedown', (event) => {
  const item = event.target.closest('li[data-index]');
  if (!item) return;
  event.preventDefault();
  selectSuggest(suggestItems[Number(item.dataset.index)]);
});

institutionName.addEventListener('blur', () => {
  setTimeout(() => {
    if (!usesEgrul()) return;
    // Клик по выпадающему списку (он в body) не должен сбрасывать поле
    if (
      institutionSuggest.contains(document.activeElement) ||
      institutionSuggest.matches(':hover')
    ) {
      return;
    }
    // Не очищаем ввод при blur: ответ ЕГРЮЛ может прийти позже.
    // Без выбора из списка сохранение всё равно заблокировано.
    hideSuggest();
  }, 220);
});

window.addEventListener('resize', positionInstitutionSuggest);
document.addEventListener(
  'scroll',
  () => {
    if (!institutionSuggest.hidden) positionInstitutionSuggest();
  },
  true
);

openOverlayBtn.addEventListener('click', async () => {
  if (!normalizeDeanery(deanerySelect.value)) {
    showStatus('Сначала выберите благочиние.', true);
    return;
  }
  const unlocked = await ensureDeaneryAccess(deanerySelect.value);
  if (!unlocked) return;
  openOverlay();
});

downloadCsvBtn?.addEventListener('click', async () => {
  const diocese = dioceseSelect.value.trim();
  const deanery = normalizeDeanery(deanerySelect.value);
  if (!diocese) {
    showStatus('Сначала выберите епархию.', true);
    return;
  }
  if (!deanery) {
    showStatus('Сначала выберите благочиние.', true);
    return;
  }

  const list = getParticipantsForDeanery(deanery);
  if (!list.length) {
    showStatus('Нет участников выбранного благочиния для выгрузки.', true);
    return;
  }

  try {
    let responsible = {};
    try {
      const submissionResponse = await fetch(`/api/submissions/${encodeURIComponent(deanery)}`);
      if (submissionResponse.ok) {
        const submission = await submissionResponse.json();
        responsible = submission.responsible || {};
      }
    } catch {
      // выгрузка участников важнее блока ответственного
    }

    const csv = buildDeaneryCsv(list, responsible);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = deanery.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_').replace(/\s+/g, '-').slice(0, 60);
    link.href = url;
    link.download = `zayavka-kbm-2026-${safeName}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showStatus(`Скачан CSV по благочинию «${deanery}» (${list.length} участников).`);
  } catch (error) {
    showStatus(error.message, true);
  }
});

getCertificateBtn?.addEventListener('click', () => {
  const diocese = dioceseSelect.value.trim();
  const deanery = deanerySelect.value.trim();
  if (!diocese || !deanery) {
    showStatus('Сначала выберите епархию и благочиние.', true);
    return;
  }
  if (getCertificateBtn.disabled) {
    showStatus('Сертификаты будут доступны после проверки заявки организатором.', true);
    return;
  }
  const params = new URLSearchParams({ diocese, deanery });
  window.location.href = `${window.__KBM_BASE__ || ''}/certificates?${params.toString()}`;
});

submitReviewBtn?.addEventListener('click', () => {
  const diocese = dioceseSelect.value;
  const deanery = deanerySelect.value;
  if (!diocese) {
    showStatus('Сначала выберите епархию.', true);
    return;
  }
  if (!deanery) {
    showStatus('Сначала выберите благочиние.', true);
    return;
  }

  const list = getParticipantsForDeanery(deanery);
  if (list.length < 3) {
    showStatus('Для отправки на проверку нужно не менее трёх участников.', true);
    return;
  }

  const missingLabels = QUOTA_RULES.filter((rule) => list.filter(rule.match).length < rule.min).map(
    (rule) => {
      const titles = {
        icon: '«Православная икона»',
        porcelain: '«Роспись по фарфору»',
        'main-young': '«Основная тематика» 9–12 лет',
        'main-old': '«Основная тематика» 13–17 лет',
      };
      const count = list.filter(rule.match).length;
      return `${titles[rule.key]} — ${count} из ${rule.min}`;
    }
  );

  if (missingLabels.length) {
    const ok = window.confirm(
      `Минимум ещё не выполнен:\n• ${missingLabels.join('\n• ')}\n\nПродолжить и указать ответственное лицо?`
    );
    if (!ok) return;
  }

  openResponsibleOverlay({ diocese, deanery });
});

responsibleForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!pendingReviewContext) return;

  const fullName = responsibleFullNameInput.value.trim();
  const phone = formatPhoneInput(responsiblePhoneInput.value);

  if (!fullName) {
    showResponsibleStatus('Укажите сан, фамилию, имя и отчество.', true);
    return;
  }
  if (!isPhoneComplete(phone)) {
    showResponsibleStatus('Укажите телефон в формате +7(907)987-34-45.', true);
    return;
  }

  const { diocese, deanery } = pendingReviewContext;

  try {
    const appResponse = await fetch('/api/application', {
      method: 'PUT',
      headers: deaneryAuthHeaders(deanery),
      body: JSON.stringify({
        responsible: { fullName, phone },
      }),
    });
    const appResult = await appResponse.json();
    if (!appResponse.ok) {
      throw new Error(appResult.error || 'Не удалось сохранить данные ответственного лица');
    }

    const response = await fetch('/api/submit-review', {
      method: 'POST',
      headers: deaneryAuthHeaders(deanery),
      body: JSON.stringify({
        diocese,
        deanery,
        responsible: { fullName, phone },
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Не удалось отправить');

    closeResponsibleOverlay();

    const time = new Date(result.submission.submittedAt).toLocaleString('ru-RU');
    showStatus(
      `Данные «${diocese}», благочиние «${deanery}» отправлены на проверку (${result.submission.participantCount} участников, ${time}).`
    );
    quotaNote.textContent = result.submission.quotasComplete
      ? `«${deanery}»: отправлено на проверку`
      : `«${deanery}»: отправлено, минимум не закрыт`;
    syncCertificateButton();
  } catch (error) {
    showResponsibleStatus(error.message, true);
  }
});

function openAddressOverlay() {
  addressOverlay?.classList.add('open');
  addressOverlay?.setAttribute('aria-hidden', 'false');
}

function closeAddressOverlay() {
  addressOverlay?.classList.remove('open');
  addressOverlay?.setAttribute('aria-hidden', 'true');
}

function askConfirm({ title = 'Подтверждение', message = '', okText = 'Подтвердить' } = {}) {
  return new Promise((resolve) => {
    if (!confirmOverlay || !confirmLead || !confirmTitle || !confirmOkBtn) {
      resolve(window.confirm(message));
      return;
    }
    if (confirmResolver) {
      confirmResolver(false);
      confirmResolver = null;
    }
    confirmResolver = resolve;
    confirmTitle.textContent = title;
    confirmLead.style.whiteSpace = 'pre-line';
    confirmLead.textContent = message;
    confirmOkBtn.textContent = okText;
    confirmOverlay.classList.add('open');
    confirmOverlay.setAttribute('aria-hidden', 'false');
  });
}

function closeConfirmOverlay(result) {
  if (!confirmOverlay) return;
  confirmOverlay.classList.remove('open');
  confirmOverlay.setAttribute('aria-hidden', 'true');
  if (confirmResolver) {
    const resolve = confirmResolver;
    confirmResolver = null;
    resolve(Boolean(result));
  }
}

// Оверлей участника закрывается только «Сохранить» / «Отмена» (не по клику снаружи и не по Escape)
cancelOverlayBtn.addEventListener('click', closeOverlay);
closeResponsibleBtn?.addEventListener('click', closeResponsibleOverlay);
cancelResponsibleBtn?.addEventListener('click', closeResponsibleOverlay);
closeDeaneryAccessBtn?.addEventListener('click', () => closeDeaneryAccessOverlay(false));
cancelDeaneryAccessBtn?.addEventListener('click', () => closeDeaneryAccessOverlay(false));
addressChipBtn?.addEventListener('click', openAddressOverlay);
closeAddressBtn?.addEventListener('click', closeAddressOverlay);
closeAddressActionBtn?.addEventListener('click', closeAddressOverlay);
confirmOkBtn?.addEventListener('click', () => closeConfirmOverlay(true));
confirmCancelBtn?.addEventListener('click', () => closeConfirmOverlay(false));
confirmCancelActionBtn?.addEventListener('click', () => closeConfirmOverlay(false));
confirmOverlay?.addEventListener('click', (event) => {
  if (event.target === confirmOverlay) closeConfirmOverlay(false);
});
closeNoticeBtn?.addEventListener('click', closeNoticeOverlay);
closeNoticeActionBtn?.addEventListener('click', closeNoticeOverlay);
noticeOverlay?.addEventListener('click', (event) => {
  if (event.target === noticeOverlay) closeNoticeOverlay();
});

responsibleOverlay?.addEventListener('click', (event) => {
  if (event.target === responsibleOverlay) closeResponsibleOverlay();
});

deaneryAccessOverlay?.addEventListener('click', (event) => {
  if (event.target === deaneryAccessOverlay) closeDeaneryAccessOverlay(false);
});

deaneryAccessForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const deanery = pendingAccessDeanery || normalizeDeanery(deanerySelect.value);
  const code = String(deaneryAccessCodeInput?.value || '').trim();
  if (!deanery) {
    showDeaneryAccessStatus('Сначала выберите благочиние.', true);
    return;
  }
  if (!code) {
    showDeaneryAccessStatus('Введите код доступа.', true);
    return;
  }
  try {
    await verifyDeaneryAccessCode(deanery, code);
    setUnlockedCode(deanery, code);
    showDeaneryAccessStatus('Доступ открыт.');
    closeDeaneryAccessOverlay(true);
  } catch (error) {
    showDeaneryAccessStatus(error.message || 'Неверный код доступа.', true);
  }
});

addressOverlay?.addEventListener('click', (event) => {
  if (event.target === addressOverlay) closeAddressOverlay();
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  // Пока открыт оверлей участника — Escape ничего не делает
  if (overlay.classList.contains('open') && !confirmOverlay?.classList.contains('open') && !noticeOverlay?.classList.contains('open') && !deaneryAccessOverlay?.classList.contains('open')) {
    return;
  }
  if (noticeOverlay?.classList.contains('open')) {
    closeNoticeOverlay();
    return;
  }
  if (confirmOverlay?.classList.contains('open')) {
    closeConfirmOverlay(false);
    return;
  }
  if (deaneryAccessOverlay?.classList.contains('open')) {
    closeDeaneryAccessOverlay(false);
    return;
  }
  if (addressOverlay?.classList.contains('open')) {
    closeAddressOverlay();
    return;
  }
  if (responsibleOverlay?.classList.contains('open')) {
    closeResponsibleOverlay();
  }
});

function showOverlayFormError(message) {
  // Статус на фоне не видно — показываем поверх оверлея участника
  openNoticeOverlay(message);
  showStatus(message, true);
}

saveParticipantBtn?.addEventListener('click', () => {
  if (workForm.checkValidity()) return;
  const invalid = workForm.querySelector(':invalid');
  invalid?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  const label = invalid?.closest('label')?.childNodes?.[0]?.textContent?.trim();
  showOverlayFormError(
    label ? `Заполните поле: ${label.replace(/\s+/g, ' ')}` : 'Заполните все обязательные поля формы.'
  );
});

workForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const age = updateAgeFromBirthYear();
  if (!birthYearSelect.value || age == null || age < MIN_AGE || age > MAX_AGE) {
    showOverlayFormError('Участник должен быть в возрасте от 9 до 17 лет.');
    return;
  }

  const nomination = String(workForm.nomination.value || '');
  if (!nomination) {
    showOverlayFormError('Выберите номинацию.');
    nominationSelect?.focus();
    return;
  }
  if (
    age < 13 &&
    (nomination === '«Православная икона»' || nomination === '«Роспись по фарфору»')
  ) {
    showOverlayFormError(
      'Для возраста младше 13 лет доступна только номинация «Основная тематика».'
    );
    return;
  }

  if (!isWorkTitleFilled()) {
    showOverlayFormError('Укажите название работы.');
    workForm.workTitle?.focus();
    return;
  }

  const type = institutionType.value;
  let nameValue = institutionName.value.trim();

  if (requiresEgrulPick(type) && !egrulSelected) {
    showOverlayFormError('Выберите полное наименование из списка ЕГРЮЛ.');
    return;
  }

  if (type === SUNDAY_SCHOOL_TYPE && nameValue && !/^воскресная\s+школа\b/i.test(nameValue)) {
    nameValue = formatSundaySchoolInstitutionName(nameValue);
    institutionName.value = nameValue;
  }

  if (type !== 'Самостоятельное участие' && !nameValue) {
    showOverlayFormError('Заполните наименование учреждения.');
    return;
  }

  if (type !== 'Самостоятельное участие' && looksLikePersonFio(nameValue)) {
    showOverlayFormError(
      'В поле названия учреждения нельзя указывать ФИО. Укажите наименование организации или учреждения.'
    );
    institutionName.focus();
    return;
  }

  applyFieldCapitalize(municipalFormationInput);
  syncMunicipalTypeCheckboxesFromInput();

  const data = new FormData(workForm);
  const teacherPhone = String(teacherPhoneInput.value || '').trim();
  const representativePhone = String(representativePhoneInput.value || '').trim();

  if (!PHONE_PATTERN.test(teacherPhone) || !PHONE_PATTERN.test(representativePhone)) {
    showOverlayFormError('Телефоны укажите в формате +7(907)987-34-45');
    return;
  }

  const payload = {
    diocese: draft.diocese || dioceseSelect.value,
    deanery: draft.deanery,
    birthYear: Number(birthYearSelect.value),
    institutionType: type,
    lastName: data.get('lastName'),
    firstName: data.get('firstName'),
    workTitle: formatWorkTitle(data.get('workTitle')),
    federalDistrict: data.get('federalDistrict'),
    rfSubject: data.get('rfSubject'),
    municipalFormation: capitalizeProperRu(data.get('municipalFormation')),
    locality: data.get('locality'),
    nomination,
    institutionName: type === 'Самостоятельное участие' ? '' : nameValue,
    teacherName: data.get('teacherName'),
    teacherPhone,
    representativeName: data.get('representativeName'),
    representativePhone,
    rightsConsent: data.get('rightsConsent') === 'on',
    personalDataConsent: data.get('personalDataConsent') === 'on',
    idDocumentConfirm: data.get('idDocumentConfirm') === 'on',
  };

  try {
    const isEdit = Boolean(editingId);
    const response = await fetch(isEdit ? `/api/participants/${editingId}` : '/api/participants', {
      method: isEdit ? 'PUT' : 'POST',
      headers: deaneryAuthHeaders(payload.deanery),
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Не удалось сохранить');

    if (isEdit) {
      participantsCache = participantsCache.map((item) => (item.id === result.id ? result : item));
    } else {
      participantsCache.push(result);
    }

    const savedDeanery = draft.deanery;
    const savedDiocese = draft.diocese || dioceseSelect.value;
    const message = isEdit
      ? `Исправлены данные: ${result.lastName} ${result.firstName}`
      : `Сохранён участник №${getParticipantsForDeanery(savedDeanery).length}: ${result.lastName} ${result.firstName}`;

    closeOverlay();
    resetWorkForm();
    dioceseSelect.value = savedDiocese;
    deanerySelect.value = savedDeanery;
    lastConfirmedDiocese = savedDiocese;
    lastConfirmedDeanery = savedDeanery;
    draft.diocese = savedDiocese;
    draft.deanery = savedDeanery;
    renderDeaneryParticipants();
    syncParticipantIndex();
    showStatus(message);
  } catch (error) {
    showOverlayFormError(error.message || 'Не удалось сохранить');
  }
});

deaneryParticipantsList.addEventListener('click', async (event) => {
  const deleteBtn = event.target.closest('[data-delete]');
  if (deleteBtn) {
    const id = deleteBtn.dataset.delete;
    if (!id) return;
    if (!confirm('Удалить этого участника из заявки?')) return;
    deleteBtn.disabled = true;
    try {
      const response = await fetch(`/api/participants/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: deaneryAuthHeaders(deanerySelect.value, { json: false }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Не удалось удалить участника');
      participantsCache = participantsCache.filter((item) => item.id !== id);
      renderDeaneryParticipants();
      syncParticipantIndex();
      showStatus('Участник удалён.');
    } catch (error) {
      showStatus(error.message, true);
      deleteBtn.disabled = false;
      await refreshParticipantsCache();
    }
    return;
  }

  const button = event.target.closest('[data-edit]');
  if (!button) return;
  const participant = participantsCache.find((item) => item.id === button.dataset.edit);
  if (!participant) return;
  openOverlayForEdit(participant);
});

nextParticipantBtn.addEventListener('click', () => {
  resetWorkForm();
  closeOverlay();
  dioceseSelect.value = draft.diocese;
  deanerySelect.value = draft.deanery;
  lastConfirmedDiocese = draft.diocese;
  lastConfirmedDeanery = draft.deanery;
  renderDeaneryParticipants();
  syncParticipantIndex();
  preHint.textContent = `Епархия «${draft.diocese}», благочиние «${draft.deanery}» сохранены. Заполните данные участника №${participantIndex}.`;
  openOverlayBtn.focus();
});

finishBtn.addEventListener('click', () => {
  closeOverlay();
  resetWorkForm();
  dioceseSelect.value = draft.diocese;
  deanerySelect.value = draft.deanery;
  lastConfirmedDiocese = draft.diocese;
  lastConfirmedDeanery = draft.deanery;
  renderDeaneryParticipants();
  syncParticipantIndex();
  preHint.textContent = '';
});

dioceseSelect.addEventListener('change', () => {
  if (suppressDioceseChange) return;

  const nextValue = dioceseSelect.value;
  const previousValue = lastConfirmedDiocese;

  if (nextValue === previousValue) return;

  const hasParticipants = participantsCache.length > 0;
  if (previousValue && hasParticipants) {
    const confirmed = window.confirm(
      `Сменить епархию «${previousValue}»?\n\nТекущий выбор благочиния и список участников останутся в памяти.`
    );
    if (!confirmed) {
      suppressDioceseChange = true;
      dioceseSelect.value = previousValue;
      suppressDioceseChange = false;
      return;
    }
  }

  lastConfirmedDiocese = nextValue;
  draft.diocese = nextValue;
  persistSelection(nextValue, deanerySelect.value);
});

deanerySelect.addEventListener('change', async () => {
  if (suppressDeaneryChange) return;

  const nextValue = deanerySelect.value;
  const previousValue = lastConfirmedDeanery;

  if (nextValue === previousValue) {
    renderDeaneryParticipants();
    syncParticipantIndex();
    return;
  }

  if (previousValue) {
    // Пока ждём ответ — вернём предыдущее значение в поле
    suppressDeaneryChange = true;
    deanerySelect.value = previousValue;
    suppressDeaneryChange = false;

    const confirmed = await askConfirm({
      title: 'Сменить благочиние?',
      message: `Перейти с «${previousValue}» на «${nextValue || '—'}»?`,
      okText: 'Сменить',
    });

    if (!confirmed) return;

    suppressDeaneryChange = true;
    deanerySelect.value = nextValue;
    suppressDeaneryChange = false;
  }

  if (nextValue) {
    const unlocked = await ensureDeaneryAccess(nextValue);
    if (!unlocked) {
      suppressDeaneryChange = true;
      deanerySelect.value = previousValue || '';
      suppressDeaneryChange = false;
      return;
    }
  }

  lastConfirmedDeanery = nextValue;
  draft.deanery = nextValue;
  draft.diocese = dioceseSelect.value;
  lastConfirmedDiocese = dioceseSelect.value;
  persistSelection(draft.diocese, nextValue);
  preHint.textContent = '';
  renderDeaneryParticipants();
  syncParticipantIndex();
  await syncCertificateButton();
});

async function loadDeaneries() {
  const response = await fetch('/deaneries.json');
  const list = await response.json();
  if (!Array.isArray(list)) return;

  const placeholder = deanerySelect.querySelector('option[value=""]');
  deanerySelect.innerHTML = '';
  if (placeholder) {
    deanerySelect.appendChild(placeholder);
  } else {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Выберите благочиние';
    deanerySelect.appendChild(option);
  }

  for (const name of list) {
    const value = String(name || '').trim();
    if (!value) continue;
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    deanerySelect.appendChild(option);
  }
}

async function loadDioceses() {
  const response = await fetch('/dioceses.json');
  const list = await response.json();
  if (!Array.isArray(list)) return;

  const defaultDiocese = 'Коломенская епархия';
  const preferred = [defaultDiocese, 'Московская епархия'];
  const ordered = [
    ...preferred.filter((name) => list.includes(name)),
    ...list.filter((name) => !preferred.includes(name)),
  ];

  for (const name of ordered) {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    dioceseSelect.appendChild(option);
  }

  const stored = readStoredSelection();
  if (stored?.diocese || stored?.deanery) {
    restoreStoredSelection();
    if (stored.deanery) {
      const unlocked = await ensureDeaneryAccess(stored.deanery);
      if (!unlocked) {
        suppressDeaneryChange = true;
        deanerySelect.value = '';
        suppressDeaneryChange = false;
        lastConfirmedDeanery = '';
        draft.deanery = '';
        persistSelection(dioceseSelect.value, '');
      }
    }
    return;
  }

  if (list.includes(defaultDiocese) && !dioceseSelect.value) {
    dioceseSelect.value = defaultDiocese;
    draft.diocese = defaultDiocese;
    lastConfirmedDiocese = defaultDiocese;
    persistSelection(defaultDiocese, deanerySelect.value);
  }
}

await loadSiteSettings();
readStoredAccessCodes();
await loadDeaneries().catch(() => {});
await loadDioceses().catch(() => {});
refreshParticipantsCache().catch(() => {
  participantsCache = [];
  renderDeaneryParticipants();
  syncCertificateButton();
});

renderQuotaCounter();
renderDeaneryParticipants();
syncParticipantIndex();
await syncCertificateButton();

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    syncCertificateButton();
  }
});
window.addEventListener('focus', () => {
  syncCertificateButton();
});
