/**
 * Парсинг Excel-заявки КБМ → объекты участников.
 * Поддерживает:
 * 1) официальную форму «Заявка на участие в КБМ» (.xls/.xlsx);
 * 2) таблицу с колонками как у CSV-выгрузки формы;
 * 3) листы по благочиниям с секциями номинаций.
 */

const COMPETITION_YEAR = 2026;
const DEFAULT_FEDERAL_DISTRICT = 'Центральный федеральный округ';
const DEFAULT_RF_SUBJECT = 'Московская область';

const NOMINATION_MAIN = '«Основная тематика»';
const NOMINATION_ICON = '«Православная икона»';
const NOMINATION_PORCELAIN = '«Роспись по фарфору»';

const INSTITUTION_TYPES = [
  'Воскресная школа',
  'Учреждение культуры',
  'Образовательная организация',
  'Самостоятельное участие',
];

function cellText(value) {
  if (value == null) return '';
  if (value instanceof Date) return String(value.getFullYear());
  if (typeof value === 'boolean') return value ? 'есть' : 'нет';
  return String(value).replace(/\r\n/g, '\n').replace(/\u00a0/g, ' ').trim();
}

function normalizeHeader(value) {
  return cellText(value)
    .toLocaleLowerCase('ru-RU')
    .replace(/ё/g, 'е')
    .replace(/["«»„“”]/g, '')
    .replace(/[()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function headerIncludes(header, ...needles) {
  return needles.every((needle) => header.includes(normalizeHeader(needle)));
}

function scoreHeaderRow(row) {
  const headers = row.map(normalizeHeader).filter(Boolean);
  if (!headers.length) return 0;
  let score = 0;
  const blob = headers.join(' | ');
  if (blob.includes('фамил')) score += 3;
  if (blob.includes('имя')) score += 2;
  if (blob.includes('рисун') || blob.includes('работ')) score += 3;
  if (blob.includes('номинац')) score += 2;
  if (blob.includes('учрежд') || blob.includes('организац')) score += 2;
  if (blob.includes('педагог')) score += 2;
  if (blob.includes('телефон')) score += 1;
  if (blob.includes('возраст') || blob.includes('год рождения')) score += 2;
  return score;
}

function findHeaderRow(rows) {
  let best = { index: -1, score: 0 };
  for (let i = 0; i < Math.min(rows.length, 40); i += 1) {
    const score = scoreHeaderRow(rows[i] || []);
    if (score > best.score) best = { index: i, score };
  }
  return best.score >= 8 ? best.index : -1;
}

function mapColumns(headerRow) {
  const map = {};
  headerRow.forEach((raw, index) => {
    const h = normalizeHeader(raw);
    if (!h) return;

    const assign = (key) => {
      if (map[key] == null) map[key] = index;
    };

    if (h === '№' || h === 'n' || h.startsWith('№') || h.includes('п/п')) {
      assign('num');
      return;
    }
    if (h.includes('фамил') && h.includes('участ')) {
      assign('lastName');
      return;
    }
    if (h === 'фамилия' || (h.includes('фамил') && !h.includes('родител') && !h.includes('ответств'))) {
      assign('lastName');
      return;
    }
    if (h === 'имя' || (h.startsWith('имя') && !h.includes('отчеств'))) {
      assign('firstName');
      return;
    }
    if (h.includes('год рождения')) {
      assign('birthYear');
      return;
    }
    if (h.includes('возраст')) {
      assign('age');
      return;
    }
    if (h.includes('название рисунка') || h.includes('название работы')) {
      assign('workTitle');
      return;
    }
    if (h.includes('номинац')) {
      assign('nomination');
      return;
    }
    if (h.includes('тип учреждения')) {
      assign('institutionType');
      return;
    }
    if (h.includes('название учреждения') || h.includes('наименование учреждения')) {
      assign('institutionName');
      return;
    }
    if (h.includes('епарх')) {
      assign('diocese');
      return;
    }
    if (h.includes('благочин')) {
      assign('deanery');
      return;
    }
    if (
      h.includes('адрес') ||
      h.includes('федеральный округ') ||
      (h.includes('субъект') && h.includes('город'))
    ) {
      assign('address');
      return;
    }
    if (h.includes('федеральный округ') && !h.includes('субъект')) {
      assign('federalDistrict');
      return;
    }
    if (h.includes('субъект')) {
      assign('rfSubject');
      return;
    }
    if (h.includes('муниципаль')) {
      assign('municipalFormation');
      return;
    }
    if (h.includes('населён') || h.includes('населен') || (h.includes('город') && h.includes('село'))) {
      assign('locality');
      return;
    }
    if (h.includes('педагог')) {
      if (h.includes('телефон')) assign('teacherPhone');
      else assign('teacherName');
      return;
    }
    if (h.includes('преподаватель') && h.includes('фио')) {
      assign('teacherName');
      return;
    }
    if (h.includes('телефон преподавателя') || h.includes('телефон педагога')) {
      assign('teacherPhone');
      return;
    }
    if (h.includes('телефон представителя')) {
      assign('representativePhone');
      return;
    }
    if (
      h.includes('фио родителя') ||
      h.includes('фио представителя') ||
      h.includes('родителя / представителя')
    ) {
      if (h.includes('телефон') && h.includes('фио')) assign('representativeCombined');
      else assign('representativeName');
      return;
    }
    if (h.includes('телефон родителя')) {
      assign('representativeCombined');
      return;
    }
    if (h.includes('согласие') && h.includes('прав')) {
      assign('rightsConsent');
      return;
    }
    if (h.includes('согласие') && (h.includes('перс') || h.includes('обработ'))) {
      assign('personalDataConsent');
      return;
    }
    if (h.includes('документ') && h.includes('личност')) {
      assign('idDocumentConfirm');
      return;
    }
  });
  return map;
}

function col(row, map, key) {
  const index = map[key];
  if (index == null) return '';
  return cellText(row[index]);
}

function phoneDigits(value) {
  let digits = String(value || '')
    .replace(/\D/g, '')
    .slice(0, 11);
  if (!digits) return '';
  if (digits[0] === '8') digits = `7${digits.slice(1)}`;
  if (digits[0] !== '7') digits = `7${digits}`;
  return digits.slice(0, 11);
}

export function formatPhoneFromExcel(value) {
  const digits = phoneDigits(value).slice(1);
  if (digits.length !== 10) {
    const rawDigits = String(value || '').replace(/\D/g, '');
    if (rawDigits.length === 10) {
      return `+7(${rawDigits.slice(0, 3)})${rawDigits.slice(3, 6)}-${rawDigits.slice(6, 8)}-${rawDigits.slice(8, 10)}`;
    }
    if (rawDigits.length === 11 && (rawDigits[0] === '7' || rawDigits[0] === '8')) {
      const d = rawDigits.slice(1);
      return `+7(${d.slice(0, 3)})${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8, 10)}`;
    }
    return '';
  }
  return `+7(${digits.slice(0, 3)})${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
}

function isConsentYes(value) {
  const text = cellText(value).toLocaleLowerCase('ru-RU');
  if (!text) return true;
  if (text === 'true' || text === '1' || text === 'да' || text === 'есть' || text === 'v' || text === '✓' || text === '✔') {
    return true;
  }
  if (text === 'false' || text === '0' || text === 'нет' || text === 'отсутствует' || text === '-') {
    return false;
  }
  return Boolean(value);
}

export function formatWorkTitleFromExcel(value) {
  let content = cellText(value)
    .replace(/^[«"„]+/, '')
    .replace(/[»"“]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!content) return '';
  const titled = `${content.charAt(0).toLocaleUpperCase('ru-RU')}${content.slice(1)}`;
  return `«${titled}»`;
}

export function normalizeNominationFromExcel(raw, age = null) {
  const text = normalizeHeader(raw);
  if (!text) {
    if (age != null && age < 13) return NOMINATION_MAIN;
    return '';
  }
  if (text.includes('икон')) return NOMINATION_ICON;
  if (text.includes('фарфор')) return NOMINATION_PORCELAIN;
  if (text.includes('основн') || text.includes('тематик') || text.includes('рассказ')) {
    return NOMINATION_MAIN;
  }
  return '';
}

function nominationFromSectionLabel(raw) {
  const text = cellText(raw);
  if (!/^номинац/i.test(text)) return '';
  return normalizeNominationFromExcel(text);
}

export function inferInstitutionType(name) {
  const text = cellText(name);
  if (!text) return '';
  if (/самостоятельн/i.test(text)) return 'Самостоятельное участие';
  if (/воскресн/i.test(text)) return 'Воскресная школа';
  if (
    /дом\s+культур|дворец\s+культур|центр\s+развития\s+культур|музей|театр|школ[аы]\s+искусств|учреждение\s+культур/i.test(
      text
    )
  ) {
    return 'Учреждение культуры';
  }
  if (/школ|гимназ|лицей|мбоу|маоу|гаоу|гбоу|доу|образован|колледж|техникум|интернат|садик|детск/i.test(text)) {
    return 'Образовательная организация';
  }
  return 'Образовательная организация';
}

function normalizeInstitutionType(raw, institutionName) {
  const text = cellText(raw);
  if (text) {
    const found = INSTITUTION_TYPES.find(
      (type) => normalizeHeader(type) === normalizeHeader(text) || normalizeHeader(text).includes(normalizeHeader(type))
    );
    if (found) return found;
  }
  return inferInstitutionType(institutionName);
}

export function parseRepresentativeCombined(raw) {
  const text = cellText(raw).replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text || text === '-') return { name: '', phone: '' };

  const phoneMatch = text.match(
    /(?:\+?\s*7|8)[\s()\-]*\d{3}[\s()\-]*\d{3}[\s\-]*\d{2}[\s\-]*\d{2}|\d{11}|\d{10}/
  );
  let phone = '';
  let name = text;
  if (phoneMatch) {
    phone = formatPhoneFromExcel(phoneMatch[0]);
    name = text
      .replace(phoneMatch[0], ' ')
      .replace(/[(),;]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  return { name, phone };
}

export function parseAddressFromExcel(raw) {
  const text = cellText(raw).replace(/\n+/g, ', ').replace(/\s+/g, ' ').trim();
  const result = {
    federalDistrict: DEFAULT_FEDERAL_DISTRICT,
    rfSubject: DEFAULT_RF_SUBJECT,
    municipalFormation: '',
    locality: '',
    incomplete: false,
  };
  if (!text) {
    result.incomplete = true;
    return result;
  }

  const parts = text
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length && /федеральн/i.test(parts[0])) {
    result.federalDistrict = parts.shift();
  }

  if (
    parts.length &&
    /(область|республика|край|ао\b|округ)/i.test(parts[0]) &&
    !/^\s*(г\.?\s*о\.|м\.?\s*о\.|городской\s+округ|муниципальн)/i.test(parts[0])
  ) {
    result.rfSubject = parts.shift();
  }

  if (parts.length >= 2) {
    result.municipalFormation = parts[0];
    result.locality = parts.slice(1).join(', ');
  } else if (parts.length === 1) {
    result.locality = parts[0];
    result.municipalFormation = parts[0];
    result.incomplete = true;
  } else {
    result.incomplete = true;
  }

  return result;
}

function looksLikePersonFio(value) {
  const text = cellText(value).replace(/\s+/g, ' ');
  if (!text) return false;
  if (
    /(?:школ|гимназ|лицей|детск|сад\b|доу\b|мбоу|гбоу|маоу|гаоу|фгбоу|ооо\b|ано\b|нко\b|учрежд|организац|храм|церков|приход|монастыр|дом\s+культур|дворец|центр|колледж|техникум|универс|академи|институт|студи|кружок|секци|библиотек|музей|театр|воскресн|прич[её]т|епарх|благочин|№|\d|["«»()])/i.test(
      text
    )
  ) {
    return false;
  }
  const words = text.split(' ');
  if (words.length < 2 || words.length > 4) return false;
  const namePart = /^(?:[А-ЯЁа-яё]{2,}(?:-[А-ЯЁа-яё]{2,})?|[А-ЯЁа-яё]\.?)$/;
  if (!words.every((word) => namePart.test(word))) return false;
  return words.some((word) => /^[А-ЯЁа-яё]{2,}/.test(word));
}

function ageFromRow(row, map) {
  const birthYearRaw = col(row, map, 'birthYear');
  if (birthYearRaw) {
    const year = Number(String(birthYearRaw).replace(/\D/g, '').slice(0, 4));
    if (year >= COMPETITION_YEAR - 17 && year <= COMPETITION_YEAR - 9) {
      return { birthYear: year, age: COMPETITION_YEAR - year };
    }
  }
  const ageRaw = col(row, map, 'age');
  const age = Number(String(ageRaw).replace(',', '.').replace(/[^\d.]/g, ''));
  if (Number.isFinite(age) && age >= 9 && age <= 17) {
    return { birthYear: COMPETITION_YEAR - Math.round(age), age: Math.round(age) };
  }
  return { birthYear: null, age: null };
}

function isEmptyParticipantRow(row, map) {
  const lastName = col(row, map, 'lastName');
  const firstName = col(row, map, 'firstName');
  const workTitle = col(row, map, 'workTitle');
  return !lastName && !firstName && !workTitle;
}

function isSectionOrNoiseRow(row) {
  const first = cellText(row?.[0]);
  const joined = row.map(cellText).filter(Boolean).join(' ');
  if (!joined) return true;
  if (/^номинац/i.test(first) || /^номинац/i.test(joined)) return true;
  if (/^данные на лицо/i.test(joined) || /^заявка$/i.test(first.trim())) return true;
  if (/ответственн/i.test(joined) && !cellText(row?.[1])) return true;
  return false;
}

export function collectImportFieldIssues(payload) {
  const fields = [];
  const reasons = [];
  const push = (field, reason) => {
    if (!fields.includes(field)) fields.push(field);
    if (reason && !reasons.includes(reason)) reasons.push(reason);
  };

  const type = String(payload.institutionType || '').trim();
  const name = String(payload.institutionName || '').trim();
  const needsOrg = type !== 'Самостоятельное участие';

  if (needsOrg && !name) {
    push('institutionName', 'нет названия учреждения');
  } else if (needsOrg && looksLikePersonFio(name)) {
    push('institutionName', 'название учреждения похоже на ФИО');
  } else if (needsOrg) {
    // Импорт без выбора из ЕГРЮЛ — всегда просим проверить юрлицо
    if (type === 'Воскресная школа' || type === 'Образовательная организация') {
      push('institutionName', 'уточните наименование юрлица (ЕГРЮЛ)');
    } else if (name.length < 15 || !/[«"а-яё]/i.test(name)) {
      push('institutionName', 'проверьте название учреждения');
    }
  }

  if (!String(payload.workTitle || '').replace(/[«»"„“]/g, '').trim()) {
    push('workTitle', 'нет названия работы');
  }
  if (!String(payload.nomination || '').trim()) {
    push('nomination', 'не определена номинация');
  }
  if (!String(payload.teacherName || '').trim()) {
    push('teacherName', 'нет ФИО педагога');
  }
  if (!/^\+7\(\d{3}\)\d{3}-\d{2}-\d{2}$/.test(String(payload.teacherPhone || ''))) {
    push('teacherPhone', 'телефон педагога');
  }
  if (!String(payload.representativeName || '').trim()) {
    push('representativeName', 'нет ФИО представителя');
  }
  if (!/^\+7\(\d{3}\)\d{3}-\d{2}-\d{2}$/.test(String(payload.representativePhone || ''))) {
    push('representativePhone', 'телефон представителя');
  }
  if (!String(payload.municipalFormation || '').trim()) {
    push('municipalFormation', 'муниципальное образование');
  }
  if (!String(payload.locality || '').trim()) {
    push('locality', 'населённый пункт');
  }
  if (payload._addressIncomplete) {
    push('municipalFormation', 'адрес разобран не полностью');
    push('locality', 'адрес разобран не полностью');
  }
  if (payload._nominationCorrected) {
    push('nomination', 'номинация скорректирована по возрасту');
  }

  const age = Number(payload.age);
  const nomination = String(payload.nomination || '');
  if (
    Number.isFinite(age) &&
    age < 13 &&
    (nomination === NOMINATION_ICON || nomination === NOMINATION_PORCELAIN)
  ) {
    push('nomination', 'для возраста младше 13 лет — только «Основная тематика»');
  }

  return { fields, reasons };
}

function buildPayloadFromMappedRow(row, map, context, sectionNomination = '') {
  const lastName = col(row, map, 'lastName');
  const firstName = col(row, map, 'firstName');
  if (!lastName && !firstName) return null;

  const { birthYear, age } = ageFromRow(row, map);
  const workTitle = formatWorkTitleFromExcel(col(row, map, 'workTitle'));
  const nomination =
    normalizeNominationFromExcel(col(row, map, 'nomination'), age) ||
    normalizeNominationFromExcel(sectionNomination, age);

  const institutionName = cellText(col(row, map, 'institutionName')).replace(/\s+/g, ' ').trim();
  const institutionType = normalizeInstitutionType(col(row, map, 'institutionType'), institutionName);

  let federalDistrict = col(row, map, 'federalDistrict') || DEFAULT_FEDERAL_DISTRICT;
  let rfSubject = col(row, map, 'rfSubject') || DEFAULT_RF_SUBJECT;
  let municipalFormation = col(row, map, 'municipalFormation');
  let locality = col(row, map, 'locality');
  let addressIncomplete = false;

  if (map.address != null) {
    const parsed = parseAddressFromExcel(col(row, map, 'address'));
    federalDistrict = parsed.federalDistrict;
    rfSubject = parsed.rfSubject;
    municipalFormation = municipalFormation || parsed.municipalFormation;
    locality = locality || parsed.locality;
    addressIncomplete = parsed.incomplete;
  } else if (!municipalFormation || !locality) {
    addressIncomplete = true;
  }

  if (!municipalFormation && locality) municipalFormation = locality;
  if (!locality && municipalFormation) locality = municipalFormation;

  // Листы без адреса (по благочиниям) — ставим заглушку и подсвечиваем
  if (!municipalFormation) {
    municipalFormation = 'уточнить';
    addressIncomplete = true;
  }
  if (!locality) {
    locality = 'уточнить';
    addressIncomplete = true;
  }

  const teacherName = col(row, map, 'teacherName');
  const teacherPhone = formatPhoneFromExcel(col(row, map, 'teacherPhone'));

  let representativeName = col(row, map, 'representativeName');
  let representativePhone = formatPhoneFromExcel(col(row, map, 'representativePhone'));
  if (map.representativeCombined != null) {
    const parsed = parseRepresentativeCombined(col(row, map, 'representativeCombined'));
    representativeName = representativeName || parsed.name;
    representativePhone = representativePhone || parsed.phone;
  }

  // CSV-выгрузка: «+7(...) (ФИО)» в одной колонке представителя
  if (!representativePhone && representativeName) {
    const parsed = parseRepresentativeCombined(representativeName);
    if (parsed.phone) {
      representativePhone = parsed.phone;
      representativeName = parsed.name || representativeName;
    }
  }

  const payload = {
    diocese: context.diocese,
    deanery: context.deanery,
    birthYear,
    age,
    lastName,
    firstName,
    workTitle,
    federalDistrict,
    rfSubject,
    municipalFormation,
    locality,
    nomination,
    institutionType,
    institutionName: institutionType === 'Самостоятельное участие' ? '' : institutionName,
    teacherName,
    teacherPhone,
    representativeName,
    representativePhone,
    rightsConsent: map.rightsConsent != null ? isConsentYes(col(row, map, 'rightsConsent')) : true,
    personalDataConsent:
      map.personalDataConsent != null ? isConsentYes(col(row, map, 'personalDataConsent')) : true,
    idDocumentConfirm:
      map.idDocumentConfirm != null ? isConsentYes(col(row, map, 'idDocumentConfirm')) : true,
    _addressIncomplete: addressIncomplete,
    _rowNumber: col(row, map, 'num') || '',
    _nominationCorrected: false,
  };

  if (
    age != null &&
    age < 13 &&
    (payload.nomination === NOMINATION_ICON || payload.nomination === NOMINATION_PORCELAIN)
  ) {
    payload.nomination = NOMINATION_MAIN;
    payload._nominationCorrected = true;
  }

  return payload;
}

function validatePayloadForSave(payload) {
  const missing = [];
  if (!payload.lastName) missing.push('фамилия');
  if (!payload.firstName) missing.push('имя');
  if (!payload.birthYear) missing.push('возраст / год рождения');
  if (!payload.workTitle) missing.push('название работы');
  if (!payload.nomination) missing.push('номинация');
  if (!payload.institutionType) missing.push('тип учреждения');
  if (payload.institutionType !== 'Самостоятельное участие' && !payload.institutionName) {
    missing.push('название учреждения');
  }
  if (!payload.municipalFormation) missing.push('муниципальное образование');
  if (!payload.locality) missing.push('населённый пункт');
  if (!payload.teacherName) missing.push('педагог');
  if (!/^\+7\(\d{3}\)\d{3}-\d{2}-\d{2}$/.test(payload.teacherPhone || '')) {
    missing.push('телефон педагога');
  }
  if (!payload.representativeName) missing.push('представитель');
  if (!/^\+7\(\d{3}\)\d{3}-\d{2}-\d{2}$/.test(payload.representativePhone || '')) {
    missing.push('телефон представителя');
  }
  if (!payload.rightsConsent || !payload.personalDataConsent || !payload.idDocumentConfirm) {
    missing.push('отметки согласий');
  }
  if (
    payload.age != null &&
    payload.age < 13 &&
    (payload.nomination === NOMINATION_ICON || payload.nomination === NOMINATION_PORCELAIN)
  ) {
    missing.push('номинация не соответствует возрасту');
  }
  return missing;
}

function parseSheetRows(rows, context) {
  const participants = [];
  const skipped = [];

  const headerIndex = findHeaderRow(rows);
  if (headerIndex >= 0) {
    const map = mapColumns(rows[headerIndex]);
    if (map.lastName == null || map.firstName == null) {
      return { participants, skipped, error: 'В таблице не найдены колонки «Фамилия» и «Имя».' };
    }

    let sectionNomination = '';
    for (let i = headerIndex + 1; i < rows.length; i += 1) {
      const row = rows[i] || [];
      const section = nominationFromSectionLabel(cellText(row[0]) || row.map(cellText).join(' '));
      if (section) {
        sectionNomination = section;
        continue;
      }
      if (isEmptyParticipantRow(row, map) || isSectionOrNoiseRow(row)) continue;

      const payload = buildPayloadFromMappedRow(row, map, context, sectionNomination);
      if (!payload) continue;

      const missing = validatePayloadForSave(payload);
      if (missing.length) {
        skipped.push({
          row: i + 1,
          name: `${payload.lastName} ${payload.firstName}`.trim(),
          reason: `не хватает: ${missing.join(', ')}`,
        });
        continue;
      }

      const issues = collectImportFieldIssues(payload);
      participants.push({ payload, issues });
    }

    return { participants, skipped, format: 'table' };
  }

  // Без явной шапки — пробуем секции номинаций (листы по благочиниям)
  let sectionNomination = '';
  let sawSection = false;
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i] || [];
    const section = nominationFromSectionLabel(cellText(row[0]) || '');
    if (section) {
      sectionNomination = section;
      sawSection = true;
      continue;
    }
  }
  if (!sawSection) {
    return {
      participants,
      skipped,
      error:
        'Не удалось распознать таблицу. Ожидается официальная форма заявки КБМ или таблица с колонками «Фамилия», «Имя», «Название рисунка».',
    };
  }

  // Повторный проход с фиксированной раскладкой секций (как в листах по благочиниям)
  const fixedMap = {
    num: 0,
    lastName: 1,
    firstName: 2,
    age: 3,
    workTitle: 4,
    institutionName: 5,
    teacherName: 6,
    teacherPhone: 7,
    representativeCombined: 8,
    rightsConsent: 9,
    personalDataConsent: 10,
    idDocumentConfirm: 11,
  };
  sectionNomination = '';
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i] || [];
    const section = nominationFromSectionLabel(cellText(row[0]) || '');
    if (section) {
      sectionNomination = section;
      continue;
    }
    if (!sectionNomination) continue;
    if (isEmptyParticipantRow(row, fixedMap)) continue;
    if (!/^\d+$/.test(cellText(row[0])) && !cellText(row[1])) continue;

    const payload = buildPayloadFromMappedRow(row, fixedMap, context, sectionNomination);
    if (!payload) continue;
    const missing = validatePayloadForSave(payload);
    if (missing.length) {
      skipped.push({
        row: i + 1,
        name: `${payload.lastName} ${payload.firstName}`.trim(),
        reason: `не хватает: ${missing.join(', ')}`,
      });
      continue;
    }
    participants.push({ payload, issues: collectImportFieldIssues(payload) });
  }

  return { participants, skipped, format: 'sectioned' };
}

async function loadXlsx() {
  if (typeof window !== 'undefined' && window.XLSX) return window.XLSX;
  throw new Error('Библиотека Excel не загружена. Обновите страницу и попробуйте снова.');
}

export async function parseExcelApplicationFile(file, context) {
  const name = String(file?.name || '').toLowerCase();
  if (!name.endsWith('.xlsx') && !name.endsWith('.xls')) {
    throw new Error('Выберите файл Excel (.xlsx или .xls).');
  }
  if (!file.size) {
    throw new Error('Файл пустой.');
  }

  const XLSX = await loadXlsx();
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  if (!workbook.SheetNames?.length) {
    throw new Error('В книге нет листов.');
  }

  const preferred =
    workbook.SheetNames.find((sheetName) => /заявк/i.test(sheetName)) ||
    workbook.SheetNames.find((sheetName) => {
      const key = normalizeHeader(context.deanery || '');
      if (!key) return false;
      const sheetKey = normalizeHeader(sheetName);
      return sheetKey === key || sheetKey.includes(key) || key.includes(sheetKey);
    }) ||
    workbook.SheetNames.find((sheetName) => !/дорожн|карт|свод|итог/i.test(sheetName)) ||
    workbook.SheetNames[0];

  const allParticipants = [];
  const allSkipped = [];
  let lastError = '';

  const sheetOrder = [
    preferred,
    ...workbook.SheetNames.filter((sheetName) => sheetName !== preferred),
  ];

  // Берём первый удачный лист; если участники пусты, но есть пропуски — тоже стоп
  // (чтобы не смешивать «Дорожную карту» и чужие благочиния из одной книги).
  for (const sheetName of sheetOrder) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
    if (!rows.length) continue;
    const parsed = parseSheetRows(rows, context);
    if (parsed.error) {
      lastError = parsed.error;
      continue;
    }
    if (parsed.participants.length || parsed.skipped.length) {
      allParticipants.push(...parsed.participants);
      allSkipped.push(...parsed.skipped);
      break;
    }
  }

  if (!allParticipants.length) {
    throw new Error(
      lastError ||
        'В файле не найдено ни одной заполненной строки участника. Проверьте, что это готовая заявка Excel.'
    );
  }

  return {
    participants: allParticipants,
    skipped: allSkipped,
    sheet: preferred,
  };
}

export const EXCEL_IMPORT_HINT =
  'Поддерживается официальная форма заявки КБМ (.xls/.xlsx): Фамилия, Имя, Возраст, Название рисунка, Номинация, Адрес, Название учреждения, Педагог, телефоны, согласия. Также подходит таблица с колонками как в CSV-выгрузке формы.';

/** Нормализация строк для сравнения дубликатов при импорте. */
export function normalizeImportMatchText(value) {
  return String(value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/ё/g, 'е')
    .replace(/Ё/g, 'Е')
    .replace(/["«»„“”']/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('ru-RU');
}

/** Год рождения или возраст → единый birthYear для сравнения. */
export function normalizeImportBirthYear(person, competitionYear = COMPETITION_YEAR) {
  const birthYear = Number(person?.birthYear);
  if (Number.isFinite(birthYear) && birthYear >= competitionYear - 17 && birthYear <= competitionYear - 9) {
    return birthYear;
  }
  const age = Number(person?.age);
  if (Number.isFinite(age) && age >= 9 && age <= 17) {
    return competitionYear - Math.round(age);
  }
  return null;
}

/**
 * Полное совпадение по 5 полям: фамилия, имя, возраст/год рождения, номинация, название работы.
 */
export function isSameImportedParticipant(a, b, competitionYear = COMPETITION_YEAR) {
  if (!a || !b) return false;
  const birthA = normalizeImportBirthYear(a, competitionYear);
  const birthB = normalizeImportBirthYear(b, competitionYear);
  if (birthA == null || birthB == null || birthA !== birthB) return false;
  return (
    normalizeImportMatchText(a.lastName) === normalizeImportMatchText(b.lastName) &&
    normalizeImportMatchText(a.firstName) === normalizeImportMatchText(b.firstName) &&
    normalizeImportMatchText(a.nomination) === normalizeImportMatchText(b.nomination) &&
    normalizeImportMatchText(a.workTitle) === normalizeImportMatchText(b.workTitle)
  );
}

export function findExistingImportDuplicate(candidate, existingList, competitionYear = COMPETITION_YEAR) {
  if (!candidate || !Array.isArray(existingList)) return null;
  return (
    existingList.find((person) => isSameImportedParticipant(candidate, person, competitionYear)) || null
  );
}
