import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(path.join(__dirname, '.env'));
loadEnvFile(path.join(__dirname, 'deploy', 'kbm-contest.env'));

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
/** Публичный префикс при встраивании, напр. /konkursy/krasota-bozhego-mira */
const BASE_PATH = String(process.env.BASE_PATH || '')
  .trim()
  .replace(/\/+$/, '');
const ORGANIZER_USER = String(process.env.ORGANIZER_USER || 'organizer').trim() || 'organizer';
const ORGANIZER_PASSWORD = String(process.env.ORGANIZER_PASSWORD || '');
const ORGANIZER_AUTH_ENABLED = Boolean(ORGANIZER_PASSWORD);
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'participants.json');
const META_FILE = path.join(DATA_DIR, 'application.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const DEANERY_ACCESS_FILE = path.join(DATA_DIR, 'deanery-access.json');
const DEANERIES_FILE = path.join(__dirname, 'public', 'deaneries.json');
const ACCESS_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const DEFAULT_DEANERIES = [
  'Бронницкое 1',
  'Бронницкое 2',
  'Воскресенское 1',
  'Воскресенское 2',
  'Егорьевское 1',
  'Егорьевское 2',
  'Жуковское',
  'Зарайское 1',
  'Зарайское 2',
  'Каширское',
  'Коломенское 1',
  'Коломенское 2',
  'Коломенское 3',
  'Луховицкое 1',
  'Луховицкое 2',
  'Монастырское',
  'Озерское',
  'Раменское',
  'Серебряно-Прудское',
];

const DEFAULT_SETTINGS = {
  brand: 'Красота Божьего мира',
  contestNumber: 'XXII',
  contestYear: '2026',
  subtitle:
    'XXII Международный конкурс детского творчества «Красота Божьего мира: народы единой России». Заполните данные участника — они появятся в общей таблице заявки.',
  chips: ['Возраст 9–17 лет', 'Год конкурса: 2026', 'Сдача рисунков и документов до 12 октября'],
  addressButtonLabel: 'Адрес приема документов',
  addressText: 'г. Воскресенск, ул. Первомайская, д. 29 (Сергиевский храм г. Воскресенск)',
  addressPhone: '+7(909)910-23-98',
};

fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf8');
if (!fs.existsSync(META_FILE)) {
  fs.writeFileSync(
    META_FILE,
    JSON.stringify(
      {
        diocese: '',
        deanery: '',
        responsible: {
          fullName: '',
          phone: '',
        },
      },
      null,
      2
    ),
    'utf8'
  );
}
if (!fs.existsSync(SETTINGS_FILE)) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf8');
}
if (!fs.existsSync(DEANERY_ACCESS_FILE)) {
  fs.writeFileSync(DEANERY_ACCESS_FILE, JSON.stringify({ codes: {} }, null, 2), 'utf8');
}

function listDeaneries() {
  const fromFile = readJson(DEANERIES_FILE, null);
  if (Array.isArray(fromFile) && fromFile.length) {
    return fromFile.map((item) => String(item || '').trim()).filter(Boolean);
  }
  return [...DEFAULT_DEANERIES];
}

function readAccessStore() {
  const raw = readJson(DEANERY_ACCESS_FILE, { codes: {} });
  return {
    codes: raw && typeof raw.codes === 'object' && raw.codes ? raw.codes : {},
  };
}

function writeAccessStore(store) {
  writeJson(DEANERY_ACCESS_FILE, { codes: store.codes || {} });
}

function normalizeAccessCode(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function generateAccessCode(length = 8) {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += ACCESS_CODE_ALPHABET[bytes[i] % ACCESS_CODE_ALPHABET.length];
  }
  return out;
}

function setDeaneryAccessCode(deanery, code = generateAccessCode()) {
  const key = String(deanery || '').trim();
  if (!key) return null;
  const store = readAccessStore();
  const now = new Date().toISOString();
  const nextCode = normalizeAccessCode(code) || generateAccessCode();
  store.codes[key] = {
    code: nextCode,
    updatedAt: now,
    generatedAt: store.codes[key]?.generatedAt || now,
  };
  writeAccessStore(store);
  return { deanery: key, code: nextCode, updatedAt: now };
}

function getDeaneryAccessEntry(deanery) {
  const key = String(deanery || '').trim();
  if (!key) return null;
  const entry = readAccessStore().codes[key];
  if (!entry?.code) return null;
  return {
    deanery: key,
    code: String(entry.code),
    updatedAt: entry.updatedAt || null,
    generatedAt: entry.generatedAt || null,
  };
}

function deaneryAccessRequired(deanery) {
  return Boolean(getDeaneryAccessEntry(deanery)?.code);
}

function verifyDeaneryAccessCode(deanery, code) {
  const entry = getDeaneryAccessEntry(deanery);
  if (!entry) {
    return { ok: false, missing: true, error: 'Код доступа для этого благочиния ещё не создан организатором.' };
  }
  if (normalizeAccessCode(code) !== normalizeAccessCode(entry.code)) {
    return { ok: false, error: 'Неверный код доступа к благочинию.' };
  }
  return { ok: true };
}

function readDeaneryFromRequest(req, fallback = '') {
  return String(
    req.headers['x-deanery'] ||
      req.body?.deanery ||
      req.query?.deanery ||
      fallback ||
      ''
  ).trim();
}

function readAccessCodeFromRequest(req) {
  return String(req.headers['x-deanery-code'] || req.body?.accessCode || '').trim();
}

/** Если для благочиния код уже выдан — требуем его в заголовке X-Deanery-Code. */
function requireDeaneryAccess(req, res, next) {
  const deanery = readDeaneryFromRequest(req);
  if (!deanery) {
    return res.status(400).json({ error: 'Не указано благочиние' });
  }
  if (!deaneryAccessRequired(deanery)) return next();
  const check = verifyDeaneryAccessCode(deanery, readAccessCodeFromRequest(req));
  if (!check.ok) {
    return res.status(401).json({ error: check.error || 'Требуется код доступа к благочинию.' });
  }
  return next();
}

function requireDeaneryAccessForParticipantId(req, res, next) {
  const list = readJson(DATA_FILE, []);
  const person = list.find((item) => item.id === req.params.id);
  if (!person) {
    return res.status(404).json({ error: 'Участник не найден' });
  }
  const deanery = String(person.deanery || '').trim();
  req.kbmParticipant = person;
  req.headers['x-deanery'] = deanery;
  if (!deaneryAccessRequired(deanery)) return next();
  const check = verifyDeaneryAccessCode(deanery, readAccessCodeFromRequest(req));
  if (!check.ok) {
    return res.status(401).json({ error: check.error || 'Требуется код доступа к благочинию.' });
  }
  return next();
}

function normalizeSettings(input = {}, fallback = DEFAULT_SETTINGS) {
  const chipsRaw = Array.isArray(input.chips) ? input.chips : fallback.chips;
  const chips = chipsRaw.map((item) => String(item ?? '').trim()).filter(Boolean);
  return {
    brand: String(input.brand ?? fallback.brand ?? '').trim() || DEFAULT_SETTINGS.brand,
    contestNumber:
      String(input.contestNumber ?? fallback.contestNumber ?? '').trim() ||
      DEFAULT_SETTINGS.contestNumber,
    contestYear:
      String(input.contestYear ?? fallback.contestYear ?? '').trim() || DEFAULT_SETTINGS.contestYear,
    subtitle: String(input.subtitle ?? fallback.subtitle ?? '').trim() || DEFAULT_SETTINGS.subtitle,
    chips: chips.length ? chips : [...DEFAULT_SETTINGS.chips],
    addressButtonLabel:
      String(input.addressButtonLabel ?? fallback.addressButtonLabel ?? '').trim() ||
      DEFAULT_SETTINGS.addressButtonLabel,
    addressText:
      String(input.addressText ?? fallback.addressText ?? '').trim() || DEFAULT_SETTINGS.addressText,
    addressPhone:
      String(input.addressPhone ?? fallback.addressPhone ?? '').trim() ||
      DEFAULT_SETTINGS.addressPhone,
  };
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

/** Убирает отметки отправки/подтверждения у благочиний без участников. */
function pruneEmptyDeanerySubmissions(meta = {}, participants = []) {
  const submissions = { ...(meta.submissions || {}) };
  let changed = false;

  for (const deanery of Object.keys(submissions)) {
    const hasParticipants = participants.some(
      (item) => String(item.deanery || '').trim() === deanery
    );
    if (!hasParticipants) {
      delete submissions[deanery];
      changed = true;
    }
  }

  if (!changed) {
    return { meta, changed: false };
  }

  const nextMeta = { ...meta, submissions };
  writeJson(META_FILE, nextMeta);
  return { meta: nextMeta, changed: true };
}

function calcAge(birthYear) {
  const year = Number(birthYear);
  if (!year) return null;
  return 2026 - year;
}

function ageGroup(age) {
  if (age == null) return '';
  if (age >= 9 && age <= 12) return '9–12';
  if (age >= 13 && age <= 17) return '13–17';
  return 'вне возрастной группы';
}

app.use(express.json({ limit: '1mb' }));

function sendHtml(res, fileName) {
  const filePath = path.join(__dirname, 'public', fileName);
  let html = fs.readFileSync(filePath, 'utf8');
  if (BASE_PATH) {
    const boot = `<script>(function(b){window.__KBM_BASE__=b;var f=window.fetch;window.fetch=function(i,n){if(typeof i==="string"&&i.charAt(0)==="/"&&i.indexOf("//")!==0)i=b+i;return f.call(this,i,n)};})("${BASE_PATH}");</script>`;
    html = html.replace(/<head>/i, `<head>${boot}`);
    html = html.replace(/(href|src)="\/(?!\/)/g, `$1="${BASE_PATH}/`);
  }
  // Main-site links/assets (not under BASE_PATH): __SITE_ROOT__/novosti → /novosti
  html = html.replaceAll('__SITE_ROOT__', '');
  res.type('html').send(html);
}

function unauthorized(res) {
  res.setHeader('WWW-Authenticate', 'Basic realm="KBM Organizer", charset="UTF-8"');
  return res.status(401).send('Требуется авторизация организатора');
}

function requireOrganizerAuth(req, res, next) {
  if (!ORGANIZER_AUTH_ENABLED) return next();

  const header = String(req.headers.authorization || '');
  if (!header.startsWith('Basic ')) return unauthorized(res);

  let decoded = '';
  try {
    decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
  } catch {
    return unauthorized(res);
  }

  const sep = decoded.indexOf(':');
  const user = sep >= 0 ? decoded.slice(0, sep) : '';
  const pass = sep >= 0 ? decoded.slice(sep + 1) : '';
  if (user !== ORGANIZER_USER || pass !== ORGANIZER_PASSWORD) {
    return unauthorized(res);
  }
  return next();
}

// Страницы и ассеты кабинета организатора
app.use((req, res, next) => {
  const p = req.path || '';
  const protectedPath =
    p === '/organizer' ||
    p === '/organizer.html' ||
    p.startsWith('/js/organizer.js') ||
    p === '/admin.html' ||
    p.startsWith('/js/admin.js');
  if (protectedPath) return requireOrganizerAuth(req, res, next);
  return next();
});

app.use(express.static(path.join(__dirname, 'public'), { index: false }));

app.get('/api/settings', (_req, res) => {
  const current = readJson(SETTINGS_FILE, DEFAULT_SETTINGS);
  res.json(normalizeSettings(current));
});

app.put('/api/settings', requireOrganizerAuth, (req, res) => {
  const current = readJson(SETTINGS_FILE, DEFAULT_SETTINGS);
  const next = normalizeSettings(req.body || {}, current);
  writeJson(SETTINGS_FILE, next);
  res.json(next);
});

app.get('/api/deanery-access/status', (req, res) => {
  const deanery = String(req.query.deanery || '').trim();
  if (!deanery) {
    return res.status(400).json({ error: 'Не указано благочиние' });
  }
  res.json({
    deanery,
    required: deaneryAccessRequired(deanery),
  });
});

app.post('/api/deanery-access/verify', (req, res) => {
  const deanery = String(req.body?.deanery || '').trim();
  const code = String(req.body?.code || '').trim();
  if (!deanery) {
    return res.status(400).json({ error: 'Не указано благочиние' });
  }
  if (!code) {
    return res.status(400).json({ error: 'Введите код доступа' });
  }
  const check = verifyDeaneryAccessCode(deanery, code);
  if (!check.ok) {
    return res.status(check.missing ? 403 : 401).json({ error: check.error });
  }
  res.json({ ok: true, deanery });
});

app.get('/api/organizer/deanery-access', requireOrganizerAuth, (_req, res) => {
  const items = listDeaneries().map((deanery) => {
    const entry = getDeaneryAccessEntry(deanery);
    return {
      deanery,
      hasCode: Boolean(entry?.code),
      code: entry?.code || '',
      updatedAt: entry?.updatedAt || null,
      generatedAt: entry?.generatedAt || null,
    };
  });
  res.json({ items });
});

app.post('/api/organizer/deanery-access/generate', requireOrganizerAuth, (req, res) => {
  const deanery = String(req.body?.deanery || '').trim();
  if (!deanery) {
    return res.status(400).json({ error: 'Не указано благочиние' });
  }
  if (!listDeaneries().includes(deanery)) {
    return res.status(400).json({ error: 'Неизвестное благочиние' });
  }
  const item = setDeaneryAccessCode(deanery);
  res.json(item);
});

app.post('/api/organizer/deanery-access/generate-all', requireOrganizerAuth, (_req, res) => {
  const items = listDeaneries().map((deanery) => setDeaneryAccessCode(deanery));
  res.json({ items });
});

app.get('/api/application', (_req, res) => {
  const participants = readJson(DATA_FILE, []);
  const { meta } = pruneEmptyDeanerySubmissions(readJson(META_FILE, {}), participants);
  res.json(meta);
});

app.put('/api/application', (req, res) => {
  const current = readJson(META_FILE, {});
  const next = {
    diocese: String(req.body.diocese ?? current.diocese ?? '').trim(),
    deanery: String(req.body.deanery ?? current.deanery ?? '').trim(),
    responsible: {
      fullName: String(req.body.responsible?.fullName ?? '').trim(),
      phone: String(req.body.responsible?.phone ?? '').trim(),
    },
    submissions: current.submissions || {},
  };
  writeJson(META_FILE, next);
  res.json(next);
});

app.post('/api/submit-review', requireDeaneryAccess, (req, res) => {
  const diocese = String(req.body.diocese ?? '').trim();
  const deanery = String(req.body.deanery ?? '').trim();
  if (!diocese) {
    return res.status(400).json({ error: 'Выберите епархию' });
  }
  if (!deanery) {
    return res.status(400).json({ error: 'Выберите благочиние' });
  }

  const responsibleName = String(req.body.responsible?.fullName ?? '').trim();
  const responsiblePhone = normalizePhone(req.body.responsible?.phone);
  if (!responsibleName || !/^\+7\(\d{3}\)\d{3}-\d{2}-\d{2}$/.test(responsiblePhone)) {
    return res.status(400).json({
      error: 'Заполните данные ответственного лица: сан, ФИО и телефон в формате +7(907)987-34-45',
    });
  }

  const participants = readJson(DATA_FILE, []).filter((item) => item.deanery === deanery);
  if (participants.length < 3) {
    return res.status(400).json({
      error: 'Для отправки на проверку нужно не менее трёх участников',
    });
  }

  const quotaRules = [
    {
      key: 'icon',
      title: '«Православная икона»',
      min: 1,
      match: (p) => p.nomination === '«Православная икона»',
    },
    {
      key: 'porcelain',
      title: '«Роспись по фарфору»',
      min: 3,
      match: (p) => p.nomination === '«Роспись по фарфору»',
    },
    {
      key: 'main-young',
      title: '«Основная тематика» 9–12 лет',
      min: 10,
      match: (p) =>
        p.nomination === '«Основная тематика»' && Number(p.age) >= 9 && Number(p.age) <= 12,
    },
    {
      key: 'main-old',
      title: '«Основная тематика» 13–17 лет',
      min: 10,
      match: (p) =>
        p.nomination === '«Основная тематика»' && Number(p.age) >= 13 && Number(p.age) <= 17,
    },
  ];

  const quotas = quotaRules.map((rule) => {
    const count = participants.filter(rule.match).length;
    return {
      key: rule.key,
      title: rule.title,
      count,
      min: rule.min,
      done: count >= rule.min,
    };
  });

  const meta = readJson(META_FILE, {});
  const submissions = { ...(meta.submissions || {}) };
  const previous = submissions[deanery] || {};
  const reviewSubmitCount = Math.max(0, Number(previous.reviewSubmitCount) || 0) + 1;
  const submission = {
    diocese,
    deanery,
    submittedAt: new Date().toISOString(),
    participantCount: participants.length,
    participantIds: participants.map((item) => item.id),
    quotas,
    quotasComplete: quotas.every((item) => item.done),
    responsible: {
      fullName: responsibleName,
      phone: responsiblePhone,
    },
    // Новая отправка сбрасывает проверку, подтверждение сертификатов сохраняем
    reviewed: false,
    reviewedAt: null,
    place: previous.place || '',
    reviewNote: '',
    reviewSubmitCount,
    certificatesConfirmed: Boolean(previous.certificatesConfirmed),
    certificatesConfirmedAt: previous.certificatesConfirmedAt || null,
    certificatesConfirmCount: Math.max(0, Number(previous.certificatesConfirmCount) || 0),
    // Новая отправка снимает отклонение
    rejected: false,
    rejectedAt: null,
    rejectionKind: null,
  };
  submissions[deanery] = submission;

  writeJson(META_FILE, {
    ...meta,
    deanery,
    diocese,
    responsible: {
      fullName: responsibleName,
      phone: responsiblePhone,
    },
    submissions,
  });

  res.json({ ok: true, submission });
});

app.get('/api/submissions/:deanery', (req, res) => {
  const deanery = decodeURIComponent(req.params.deanery || '').trim();
  if (!deanery) {
    return res.status(400).json({ error: 'Укажите благочиние' });
  }
  const participants = readJson(DATA_FILE, []);
  const { meta } = pruneEmptyDeanerySubmissions(readJson(META_FILE, {}), participants);
  const submission = (meta.submissions || {})[deanery];
  if (!submission) {
    return res.status(404).json({ error: 'Заявка по этому благочинию ещё не отправлялась на проверку' });
  }
  res.json(submission);
});

app.post('/api/submissions/:deanery/review', requireOrganizerAuth, (req, res) => {
  const deanery = decodeURIComponent(req.params.deanery || '').trim();
  if (!deanery) {
    return res.status(400).json({ error: 'Укажите благочиние' });
  }

  const meta = readJson(META_FILE, {});
  const submissions = { ...(meta.submissions || {}) };
  const current = submissions[deanery];
  if (!current) {
    return res.status(404).json({ error: 'Сначала должна быть отправка на проверку' });
  }

  const reviewed = Boolean(req.body.reviewed);
  const place = String(req.body.place ?? current.place ?? '').trim();
  const reviewNote = String(req.body.reviewNote ?? current.reviewNote ?? '').trim();

  if (reviewed && !place) {
    return res.status(400).json({ error: 'Укажите место для сертификата' });
  }

  const next = {
    ...current,
    reviewed,
    reviewedAt: reviewed ? new Date().toISOString() : null,
    place,
    reviewNote,
  };
  submissions[deanery] = next;
  writeJson(META_FILE, { ...meta, submissions });
  res.json({ ok: true, submission: next });
});

app.post('/api/submissions/:deanery/confirm-certificates', requireOrganizerAuth, (req, res) => {
  const deanery = decodeURIComponent(req.params.deanery || '').trim();
  if (!deanery) {
    return res.status(400).json({ error: 'Укажите благочиние' });
  }

  const participants = readJson(DATA_FILE, []).filter(
    (item) => String(item.deanery || '').trim() === deanery
  );
  if (!participants.length) {
    return res.status(400).json({ error: 'Нет участников в этом благочинии' });
  }

  const meta = readJson(META_FILE, {});
  const submissions = { ...(meta.submissions || {}) };
  const current = submissions[deanery] || {
    diocese: String(participants[0]?.diocese || '').trim(),
    deanery,
    participantCount: participants.length,
  };

  const certificatesConfirmCount = Math.max(0, Number(current.certificatesConfirmCount) || 0) + 1;
  const next = {
    ...current,
    diocese: current.diocese || String(participants[0]?.diocese || '').trim(),
    deanery,
    participantCount: participants.length,
    certificatesConfirmed: true,
    certificatesConfirmedAt: new Date().toISOString(),
    certificatesConfirmCount,
    reviewSubmitCount: Math.max(0, Number(current.reviewSubmitCount) || 0),
    rejected: false,
    rejectedAt: null,
    rejectionKind: null,
  };
  submissions[deanery] = next;
  writeJson(META_FILE, { ...meta, submissions });
  res.json({ ok: true, submission: next });
});

/** Пакетное сохранение мест/одобрений; при снятии части/всех галочек — отклонение заявки. */
app.post('/api/organizer/awards', requireOrganizerAuth, (req, res) => {
  const awards = Array.isArray(req.body?.awards) ? req.body.awards : [];
  if (!awards.length) {
    return res.status(400).json({ error: 'Нет изменений для сохранения' });
  }

  const list = readJson(DATA_FILE, []);
  const byId = new Map(list.map((item) => [item.id, item]));
  const touchedDeaneries = new Set();

  for (const award of awards) {
    const id = String(award?.id || '').trim();
    const person = byId.get(id);
    if (!person) continue;
    const place = String(award?.place ?? person.place ?? '').trim();
    const approved = Boolean(award?.approved);
    const deanery = String(person.deanery || '').trim();
    Object.assign(person, {
      place,
      approved,
      updatedAt: new Date().toISOString(),
    });
    if (deanery) touchedDeaneries.add(deanery);
  }

  writeJson(DATA_FILE, list);

  const meta = readJson(META_FILE, {});
  const submissions = { ...(meta.submissions || {}) };
  const rejectedDeaneries = [];
  const clarificationDeaneries = [];
  const confirmedDeaneries = [];

  for (const deanery of touchedDeaneries) {
    if (!deanery) continue;
    const deaneryPeople = list.filter((item) => String(item.deanery || '').trim() === deanery);
    if (!deaneryPeople.length) continue;

    const approvedCount = deaneryPeople.filter((item) => item.approved).length;
    const allApproved = approvedCount === deaneryPeople.length;
    const noneApproved = approvedCount === 0;
    const current = submissions[deanery] || {
      diocese: String(deaneryPeople[0]?.diocese || '').trim(),
      deanery,
      participantCount: deaneryPeople.length,
    };
    const diocese = current.diocese || String(deaneryPeople[0]?.diocese || '').trim();

    if (allApproved) {
      // Все одобрены — как бывшая кнопка «Отправить подтверждение»
      const certificatesConfirmCount =
        Math.max(0, Number(current.certificatesConfirmCount) || 0) + 1;
      submissions[deanery] = {
        ...current,
        diocese,
        deanery,
        participantCount: deaneryPeople.length,
        rejected: false,
        rejectedAt: null,
        rejectionKind: null,
        certificatesConfirmed: true,
        certificatesConfirmedAt: new Date().toISOString(),
        certificatesConfirmCount,
        reviewSubmitCount: Math.max(0, Number(current.reviewSubmitCount) || 0),
      };
      confirmedDeaneries.push(deanery);
      continue;
    }

    // Все галочки сняты — полное отклонение; часть снята — требуется уточнение
    const rejectionKind = noneApproved ? 'full' : 'partial';
    submissions[deanery] = {
      ...current,
      diocese,
      deanery,
      participantCount: deaneryPeople.length,
      rejected: true,
      rejectedAt: new Date().toISOString(),
      rejectionKind,
      certificatesConfirmed: false,
    };
    if (rejectionKind === 'full') rejectedDeaneries.push(deanery);
    else clarificationDeaneries.push(deanery);
  }

  writeJson(META_FILE, { ...meta, submissions });
  res.json({
    ok: true,
    participants: list,
    submissions,
    rejectedDeaneries,
    clarificationDeaneries,
    confirmedDeaneries,
  });
});

app.get('/api/participants', (_req, res) => {
  const list = readJson(DATA_FILE, []);
  res.json(list);
});

function isLocalReligiousOrganization(name, shortName = '') {
  const text = `${name} ${shortName}`.replace(/\s+/g, ' ').trim();
  if (!text) return false;
  // Исключаем явный коммерческий мусор без религиозного статуса
  if (
    /(?:^|[\s«"'])(?:ООО|АО|ПАО|ЗАО|ИП)(?:\s|$)/i.test(text) &&
    !/религиозн/i.test(text)
  ) {
    return false;
  }
  return (
    /местн[а-яё]*\s+религиозн[а-яё]*\s+организац/i.test(text) ||
    /религиозн[а-яё]*\s+организац/i.test(text) ||
    (/приход/i.test(text) &&
      /(?:храм|церкв|епарх|православ|патриархат|монастыр)/i.test(text))
  );
}

/**
 * Именительный → родительный для типичных названий храмов
 * (Успенский кафедральный собор → Успенского кафедрального собора).
 * Без \b: в JS граница слова не работает для кириллицы.
 */
function toGenitiveReligiousPhrase(query) {
  let q = String(query || '').replace(/\s+/g, ' ').trim();
  if (!q) return q;

  // Названия после с./г./д./пос. не склоняем (с. Петровское)
  const protectedNames = [];
  q = q.replace(
    /((?:^|[\s,.«"'(])(?:с|д|г|п|пос)\.\s*)([А-ЯЁа-яё]+(?:-[А-ЯЁа-яё]+)?)/gi,
    (_full, prefix, name) => {
      const token = `§P${protectedNames.length}§`;
      protectedNames.push(name);
      return `${prefix}${token}`;
    }
  );

  const edge = '(^|[\\s,.«"\'(])';
  const end = '(?=[\\s,.»"\')]|$)';
  const rules = [
    [`([А-ЯЁа-яё]+?)ский`, '$1$2ского'],
    [`([А-ЯЁа-яё]+?)ская`, '$1$2ской'],
    [`([А-ЯЁа-яё]+?)ское`, '$1$2ского'],
    [`([А-ЯЁа-яё]+?)цкий`, '$1$2цкого'],
    [`([А-ЯЁа-яё]+?)цкая`, '$1$2цкой'],
    [`([А-ЯЁа-яё]+?)ний`, '$1$2него'],
    [`([А-ЯЁа-яё]+?)няя`, '$1$2ней'],
    [`([А-ЯЁа-яё]+?)нее`, '$1$2него'],
    [`([А-ЯЁа-яё]+?)ный`, '$1$2ного'],
    [`([А-ЯЁа-яё]+?)ная`, '$1$2ной'],
    [`([А-ЯЁа-яё]+?)ное`, '$1$2ного'],
    [`([А-ЯЁа-яё]+?)кий`, '$1$2кого'],
    [`([А-ЯЁа-яё]+?)кая`, '$1$2кой'],
    [`([А-ЯЁа-яё]+?)кое`, '$1$2кого'],
    [`храм`, '$1храма'],
    [`церковь`, '$1церкви'],
    [`собор`, '$1собора'],
    [`монастырь`, '$1монастыря'],
    [`часовн[яа]`, '$1часовни'],
  ];

  for (const [pattern, replacement] of rules) {
    q = q.replace(new RegExp(`${edge}${pattern}${end}`, 'gi'), replacement);
  }

  protectedNames.forEach((name, index) => {
    q = q.replace(`§P${index}§`, name);
  });

  return q.replace(/\s+/g, ' ').trim();
}

function normalizePlaceSearchToken(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(г|с|д|п|пос|пгт)\.?\s+/i, '')
    .replace(/[«»"]/g, '')
    .trim();
}

function itemMatchesPlace(item, placeToken) {
  if (!placeToken) return true;
  const needle = placeToken.toLocaleLowerCase('ru-RU');
  const hay = [item.name, item.shortName, item.address, item.locality, item.region]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase('ru-RU');
  return hay.includes(needle);
}

function buildReligiousSearchQueries(query, { locality = '', municipal = '' } = {}) {
  const raw = String(query || '').replace(/\s+/g, ' ').trim();
  if (!raw) return [];

  const genitive = toGenitiveReligiousPhrase(raw);
  const place = normalizePlaceSearchToken(locality) || normalizePlaceSearchToken(municipal);
  const withParish = (value) =>
    /^(?:приход|местн|религиозн)/i.test(value) ? value : `приход ${value}`;

  const variants = [];
  const push = (value) => {
    const next = String(value || '').replace(/\s+/g, ' ').trim();
    if (!next) return;
    const key = next.toLocaleLowerCase('ru-RU');
    if (variants.some((item) => item.toLocaleLowerCase('ru-RU') === key)) return;
    variants.push(next);
  };

  // Не больше 2–3 запросов: иначе ЕГРЮЛ часто отвечает 429/блокировкой
  if (place) push(`${withParish(genitive)} ${place}`);
  push(withParish(genitive));
  if (genitive.toLocaleLowerCase('ru-RU') !== raw.toLocaleLowerCase('ru-RU')) {
    push(withParish(raw));
  }

  return variants.slice(0, 3);
}

async function searchEgrulOnce(searchQuery, { retries = 2 } = {}) {
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, 700 * attempt));
      }

      const body = new URLSearchParams({
        query: searchQuery,
        vyp3CaptchaToken: '',
        page: '',
        region: '',
        PreventChromeAutocomplete: '',
      });

      const start = await fetch('https://egrul.nalog.ru/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Accept: 'application/json, text/javascript, */*; q=0.01',
        },
        body,
      });

      if (!start.ok) {
        lastError = new Error('ЕГРЮЛ временно недоступен');
        continue;
      }

      const startJson = await start.json();
      const token = startJson?.t;
      if (!token) {
        if (startJson?.captchaRequired) {
          throw new Error('ЕГРЮЛ запросил проверку. Повторите поиск чуть позже.');
        }
        return [];
      }

      let rows = [];
      for (let i = 0; i < 12; i += 1) {
        await new Promise((resolve) => setTimeout(resolve, 450));
        const result = await fetch(`https://egrul.nalog.ru/search-result/${token}`, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            Accept: 'application/json, text/javascript, */*; q=0.01',
          },
        });
        if (!result.ok) continue;
        const data = await result.json();
        rows = Array.isArray(data?.rows) ? data.rows : [];
        if (rows.length) break;
      }

      return rows
        .filter((row) => row?.k === 'ul' && (row?.n || row?.c) && !row?.e)
        .map((row) => {
          const name = String(row.n || row.c).trim();
          const shortName = String(row.c || row.n || '').trim();
          const address = String(row.a || '').trim();
          const region = String(row.rn || '').trim();
          const place = buildPlaceInfo(name, shortName, address, region);
          return {
            name,
            shortName,
            inn: String(row.i || '').trim(),
            ogrn: String(row.o || '').trim(),
            address,
            region: place.region,
            locality: place.locality,
          };
        });
    } catch (error) {
      if (error?.message?.includes('проверку')) throw error;
      lastError = error instanceof Error ? error : new Error('ЕГРЮЛ временно недоступен');
    }
  }

  throw lastError || new Error('ЕГРЮЛ временно недоступен');
}

async function searchEgrul(
  query,
  { religiousOnly = false, locality = '', municipal = '' } = {}
) {
  if (!religiousOnly) {
    return (await searchEgrulOnce(String(query || '').trim())).slice(0, 12);
  }

  const place = normalizePlaceSearchToken(locality) || normalizePlaceSearchToken(municipal);
  const queries = buildReligiousSearchQueries(query, { locality, municipal });
  const byKey = new Map();
  let lastError = null;

  for (let index = 0; index < queries.length; index += 1) {
    const searchQuery = queries[index];
    try {
      if (index > 0) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      const items = await searchEgrulOnce(searchQuery, { retries: 1 });
      for (const item of items) {
        if (!isLocalReligiousOrganization(item.name, item.shortName)) continue;
        const key = item.ogrn || item.inn || item.name;
        if (!byKey.has(key)) byKey.set(key, item);
      }
      // Достаточно результатов с учётом населённого пункта — дальше не долбим ЕГРЮЛ
      if (place) {
        const matchedCount = [...byKey.values()].filter((item) =>
          itemMatchesPlace(item, place)
        ).length;
        if (matchedCount >= 3) break;
      } else if (byKey.size >= 6) {
        break;
      }
    } catch (error) {
      lastError = error;
    }
  }

  let list = [...byKey.values()];
  if (!list.length && lastError) {
    throw lastError;
  }

  if (place) {
    const matched = list.filter((item) => itemMatchesPlace(item, place));
    const rest = list.filter((item) => !itemMatchesPlace(item, place));
    list = matched.length ? [...matched, ...rest] : list;
    if (matched.length >= 3) list = matched;
  }

  return list.slice(0, 12);
}

function cleanPlacePart(value) {
  return String(value || '')
    .replace(/["«»]/g, ' ')
    .replace(/\s+(ИНН|ОГРН|ДИРЕКТОР|МОСКОВСКАЯ|ЛЕНИНГРАДСКАЯ).*$/i, '')
    .replace(/\s+/g, ' ')
    .replace(/^[\s.,;/-]+|[\s.,;/-]+$/g, '')
    .trim();
}

function normalizeCityRegion(region) {
  const value = cleanPlacePart(region);
  if (!value) return '';
  if (/^г\.?\s*/i.test(value)) {
    return `г. ${value.replace(/^г\.?\s*/i, '')}`;
  }
  return value;
}

function extractLocality(name, shortName, address) {
  const source = [address, name, shortName].filter(Boolean).join(' | ');
  const patterns = [
    { re: /городско(?:й|го)\s+округ(?:а)?\s+([А-ЯЁA-Z][^|,;]{1,50}?)(?=\s+(?:РАЙОН|МОСКОВ|Г\.|С\.|Д\.|П\.|,|\||$))/i, prefix: 'г. о.' },
    { re: /г\.\s*о\.\s*([А-ЯЁA-Z][^|,;\s]{1,40})/i, prefix: 'г. о.' },
    { re: /г\.о\.\s*([А-ЯЁA-Z][^|,;\s]{1,40})/i, prefix: 'г. о.' },
    { re: /(?:^|[\s|("«])пгт\.?\s*([А-ЯЁA-Z][^|,;\s]{1,40})/i, prefix: 'пгт' },
    { re: /(?:^|[\s|("«])пос(?:[её]лок)?\.?\s*([А-ЯЁA-Z][^|,;\s]{1,40})/i, prefix: 'пос.' },
    { re: /(?:^|[\s|("«])п\.\s*([А-ЯЁA-Z][^|,;\s]{1,40})/i, prefix: 'п.' },
    { re: /(?:^|[\s|("«])село\s+([А-ЯЁA-Z][^|,;\s]{1,40})/i, prefix: 'с.' },
    { re: /(?:^|[\s|("«])с\.\s*([А-ЯЁA-Z][^|,;\s]{1,40})/i, prefix: 'с.' },
    { re: /(?:^|[\s|("«])деревня\s+([А-ЯЁA-Z][^|,;\s]{1,40})/i, prefix: 'д.' },
    { re: /(?:^|[\s|("«])д\.\s*([А-ЯЁA-Z][^|,;\s]{1,40})/i, prefix: 'д.' },
    { re: /(?:^|[\s|("«])город\s+([А-ЯЁA-Z][^|,;\s]{1,40})/i, prefix: 'г.' },
    { re: /(?:^|[\s|("«])г\.\s*([А-ЯЁA-Z][^|,;\s]{1,40})/i, prefix: 'г.' },
    { re: /\bГ\.([А-ЯЁ]{2,}(?:-[А-ЯЁ]+)?)/u, prefix: 'г.' },
    { re: /\bП\.([А-ЯЁ]{2,}(?:-[А-ЯЁ]+)?)/u, prefix: 'п.' },
    { re: /\bС\.([А-ЯЁ]{2,}(?:-[А-ЯЁ]+)?)/u, prefix: 'с.' },
    { re: /\bД\.([А-ЯЁ]{2,}(?:-[А-ЯЁ]+)?)/u, prefix: 'д.' },
    { re: /([А-ЯЁ][А-ЯЁа-яё-]+)\s+район(?:а)?/i, prefix: '', suffix: 'район' },
  ];

  for (const pattern of patterns) {
    const match = source.match(pattern.re);
    if (!match?.[1]) continue;
    const value = cleanPlacePart(match[1]);
    if (!value || value.length < 2) continue;
    if (pattern.suffix) return `${value} ${pattern.suffix}`;
    return `${pattern.prefix} ${value}`.replace(/\s+/g, ' ').trim();
  }

  return '';
}

function buildPlaceInfo(name, shortName, address, regionRaw) {
  const region = cleanPlacePart(regionRaw);
  const locality = extractLocality(name, shortName, address);
  const regionIsCity =
    /^г\.?\s*/i.test(region) || /^(Москва|Санкт-Петербург|Севастополь)\b/i.test(region);

  if (regionIsCity) {
    const city = normalizeCityRegion(region);
    if (locality && locality.toLowerCase() !== city.toLowerCase()) {
      return { region: city, locality };
    }
    return { region: '', locality: city };
  }

  return { region, locality };
}

app.get('/api/egrul-suggest', async (req, res) => {
  const query = String(req.query.q || '').trim();
  if (query.length < 3) {
    return res.json([]);
  }

  const religiousOnly =
    String(req.query.filter || '').trim() === 'religious' ||
    String(req.query.kind || '').trim() === 'religious';
  const locality = String(req.query.locality || '').trim();
  const municipal = String(req.query.municipal || '').trim();

  try {
    const items = await searchEgrul(query, { religiousOnly, locality, municipal });
    res.json(items);
  } catch (error) {
    res.status(502).json({ error: error.message || 'Ошибка поиска ЕГРЮЛ' });
  }
});

function normalizePhone(value) {
  let digits = String(value || '').replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  if (digits[0] === '8') digits = `7${digits.slice(1)}`;
  if (digits[0] !== '7') digits = `7${digits}`;
  digits = digits.slice(0, 11);
  if (digits.length !== 11) return '';
  return `+7(${digits.slice(1, 4)})${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
}

function looksLikePersonFio(value) {
  const text = String(value || '')
    .trim()
    .replace(/\s+/g, ' ');
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

function normalizeParticipant(body, existing = null) {
  const institutionType = String(body.institutionType ?? '').trim();
  const institutionName = String(body.institutionName ?? '').trim();
  const isIndependent = institutionType === 'Самостоятельное участие';

  const required = [
    'lastName',
    'firstName',
    'birthYear',
    'institutionType',
    'diocese',
    'deanery',
    'workTitle',
    'federalDistrict',
    'rfSubject',
    'municipalFormation',
    'locality',
    'teacherName',
    'teacherPhone',
    'representativeName',
    'representativePhone',
    'nomination',
  ];

  for (const key of required) {
    if (!String(body[key] ?? '').trim()) {
      return { error: `Заполните поле: ${key}` };
    }
  }

  if (!isIndependent && !institutionName) {
    return { error: 'Заполните наименование учреждения' };
  }

  if (!isIndependent && looksLikePersonFio(institutionName)) {
    return {
      error:
        'В поле названия учреждения нельзя указывать ФИО. Укажите наименование организации или учреждения.',
    };
  }

  if (!body.rightsConsent || !body.personalDataConsent || !body.idDocumentConfirm) {
    return {
      error: 'Нужны все три отметки: передача прав, персональные данные и документ личности',
    };
  }

  const phonePattern = /^\+7\(\d{3}\)\d{3}-\d{2}-\d{2}$/;
  const teacherPhone = normalizePhone(body.teacherPhone);
  const representativePhone = normalizePhone(body.representativePhone);
  if (!phonePattern.test(teacherPhone) || !phonePattern.test(representativePhone)) {
    return { error: 'Телефоны укажите в формате +7(907)987-34-45' };
  }

  const age = calcAge(body.birthYear);
  if (age == null || age < 9 || age > 17) {
    return {
      error: 'Участник должен быть в возрасте от 9 до 17 лет (год рождения 2009–2017)',
    };
  }

  const nomination = String(body.nomination).trim();
  if (
    age < 13 &&
    (nomination === '«Православная икона»' || nomination === '«Роспись по фарфору»')
  ) {
    return {
      error: 'Для возраста младше 13 лет доступна только номинация «Основная тематика»',
    };
  }

  return {
    participant: {
      id: existing?.id || crypto.randomUUID(),
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastName: String(body.lastName).trim(),
      firstName: String(body.firstName).trim(),
      birthYear: Number(body.birthYear),
      age,
      ageGroup: ageGroup(age),
      institutionType,
      workTitle: String(body.workTitle).trim(),
      federalDistrict: String(body.federalDistrict).trim(),
      rfSubject: String(body.rfSubject).trim(),
      municipalFormation: String(body.municipalFormation).trim(),
      locality: String(body.locality).trim(),
      nomination,
      institutionName: isIndependent ? '' : institutionName,
      deanery: String(body.deanery).trim(),
      diocese: String(body.diocese).trim(),
      teacherName: String(body.teacherName).trim(),
      teacherPhone,
      representativeName: String(body.representativeName).trim(),
      representativePhone,
      rightsConsent: true,
      personalDataConsent: true,
      idDocumentConfirm: true,
      place: String(body.place ?? existing?.place ?? '').trim(),
      awardNomination: String(body.awardNomination ?? existing?.awardNomination ?? '').trim(),
      approved: Boolean(
        body.approved !== undefined ? body.approved : existing?.approved
      ),
    },
  };
}

app.post('/api/participants', requireDeaneryAccess, (req, res) => {
  const result = normalizeParticipant(req.body || {});
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  const list = readJson(DATA_FILE, []);
  list.push(result.participant);
  writeJson(DATA_FILE, list);
  res.status(201).json(result.participant);
});

app.put('/api/participants/:id', requireDeaneryAccessForParticipantId, (req, res) => {
  const list = readJson(DATA_FILE, []);
  const index = list.findIndex((item) => item.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Участник не найден' });
  }

  const result = normalizeParticipant(req.body || {}, list[index]);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  // Нельзя перенести участника в другое благочиние без кода нового
  const nextDeanery = String(result.participant.deanery || '').trim();
  const prevDeanery = String(list[index].deanery || '').trim();
  if (nextDeanery && nextDeanery !== prevDeanery && deaneryAccessRequired(nextDeanery)) {
    const check = verifyDeaneryAccessCode(nextDeanery, readAccessCodeFromRequest(req));
    if (!check.ok) {
      return res.status(401).json({ error: check.error || 'Требуется код доступа к благочинию.' });
    }
  }

  list[index] = result.participant;
  writeJson(DATA_FILE, list);
  res.json(result.participant);
});

app.patch('/api/participants/:id/award', requireOrganizerAuth, (req, res) => {
  const list = readJson(DATA_FILE, []);
  const index = list.findIndex((item) => item.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Участник не найден' });
  }

  const allowedPlaces = new Set(['', 'I', 'II', 'III', 'Спецприз']);
  const place = String(req.body?.place ?? list[index].place ?? '').trim();
  if (!allowedPlaces.has(place)) {
    return res.status(400).json({ error: 'Некорректное место' });
  }

  const awardNomination = String(
    req.body?.awardNomination ?? list[index].awardNomination ?? list[index].nomination ?? ''
  ).trim();

  const approved =
    req.body?.approved !== undefined
      ? Boolean(req.body.approved)
      : Boolean(list[index].approved);

  list[index] = {
    ...list[index],
    place,
    awardNomination,
    approved,
    updatedAt: new Date().toISOString(),
  };
  writeJson(DATA_FILE, list);
  res.json(list[index]);
});

app.delete('/api/participants/:id', requireDeaneryAccessForParticipantId, (req, res) => {
  const list = readJson(DATA_FILE, []);
  const removed = list.find((item) => item.id === req.params.id);
  if (!removed) {
    return res.status(404).json({ error: 'Участник не найден' });
  }
  const next = list.filter((item) => item.id !== req.params.id);
  writeJson(DATA_FILE, next);
  pruneEmptyDeanerySubmissions(readJson(META_FILE, {}), next);
  res.json({ ok: true });
});

app.get('/api/export.csv', (req, res) => {
  const meta = readJson(META_FILE, {});
  const submissions = meta.submissions || {};
  const deaneryFilter = String(req.query.deanery ?? '').trim();
  const dioceseFilter = String(req.query.diocese ?? '').trim();
  const group = String(req.query.group ?? 'deanery').trim() === 'nomination'
    ? 'nomination'
    : 'deanery';

  // Без благочиния — полная выгрузка (админка). С благочинием — строго одно благочиние.
  let list = readJson(DATA_FILE, []);
  if (deaneryFilter) {
    list = list.filter((item) => String(item.deanery || '').trim() === deaneryFilter);
    if (!list.length) {
      return res.status(400).json({
        error: 'Нет участников для выбранного благочиния',
      });
    }
  } else if (dioceseFilter) {
    list = list.filter((item) => String(item.diocese || '').trim() === dioceseFilter);
  }

  const compareRu = (a, b) => String(a || '').localeCompare(String(b || ''), 'ru', { sensitivity: 'base' });
  list = [...list].sort((a, b) => {
    if (group === 'nomination') {
      return (
        compareRu(a.nomination, b.nomination) ||
        compareRu(a.deanery, b.deanery) ||
        compareRu(a.lastName, b.lastName) ||
        compareRu(a.firstName, b.firstName)
      );
    }
    return (
      compareRu(a.deanery, b.deanery) ||
      compareRu(a.nomination, b.nomination) ||
      compareRu(a.lastName, b.lastName) ||
      compareRu(a.firstName, b.firstName)
    );
  });

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
    const responsible =
      submissions[p.deanery]?.responsible || meta.responsible || {};
    const address = [
      p.federalDistrict,
      p.rfSubject,
      p.municipalFormation,
      p.locality,
    ]
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

  const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const csv = '\uFEFF' + [headers, ...rows].map((row) => row.map(escape).join(';')).join('\n');
  const baseName = deaneryFilter || (group === 'nomination' ? 'po-nominaciyam' : 'po-blagochiniyam');
  const safeName = String(baseName)
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, '-')
    .slice(0, 60);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="zayavka-kbm-2026-${safeName}.csv"`
  );
  res.send(csv);
});

app.get('/', (_req, res) => {
  sendHtml(res, 'index.html');
});

app.get('/organizer', requireOrganizerAuth, (_req, res) => {
  sendHtml(res, 'organizer.html');
});

app.get('/zayavka', (_req, res) => {
  res.redirect(`${BASE_PATH}/organizer?tab=table`);
});

app.get('/certificates', (_req, res) => {
  sendHtml(res, 'certificates.html');
});

app.get('/certificates/preview', (_req, res) => {
  sendHtml(res, 'certificates-preview.html');
});

app.get('/index.html', (_req, res) => sendHtml(res, 'index.html'));
app.get('/organizer.html', requireOrganizerAuth, (_req, res) => sendHtml(res, 'organizer.html'));
app.get('/certificates.html', (_req, res) => sendHtml(res, 'certificates.html'));
app.get('/certificates-preview.html', (_req, res) => sendHtml(res, 'certificates-preview.html'));

app.listen(PORT, HOST, () => {
  const origin = `http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`;
  console.log(`КБМ форма: ${origin}${BASE_PATH || ''}/`);
  console.log(`Организатор: ${origin}${BASE_PATH || ''}/organizer`);
  if (BASE_PATH) console.log(`BASE_PATH: ${BASE_PATH}`);
  if (ORGANIZER_AUTH_ENABLED) {
    console.log(`Защита кабинета организатора: включена (пользователь «${ORGANIZER_USER}»)`);
  } else {
    console.warn(
      'Внимание: ORGANIZER_PASSWORD не задан — кабинет организатора открыт без пароля. Для продакшена задайте ORGANIZER_PASSWORD.'
    );
  }
});
