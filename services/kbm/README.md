# Красота Божьего мира — веб-форма заявки 2026

## Локальный запуск

```bash
npm install
npm start
```

Откройте:

- http://localhost:3000 — форма благочинного
- http://localhost:3000/organizer — кабинет организатора

Данные хранятся в папке `data/` (в git не входит).

Для локальной защиты кабинета создайте `.env` по образцу [`.env.example`](.env.example) или задайте переменные окружения:

```bash
set ORGANIZER_PASSWORD=секрет
npm start
```

Если `ORGANIZER_PASSWORD` не задан, кабинет организатора открыт без пароля (удобно для разработки).

---

## Публикация на https://kbm.eorok.ru

Основной сайт `https://eorok.ru/` не затрагивается. Формы работают на поддомене **`kbm.eorok.ru`**.

### Ссылки для пользователей

| Кто | URL |
|-----|-----|
| Благочинные | https://kbm.eorok.ru/ |
| Организатор | https://kbm.eorok.ru/organizer |

### 1. DNS

В панели управления доменом `eorok.ru` создайте **A-запись**:

| Имя | Тип | Значение |
|-----|-----|----------|
| `kbm` | A | IP сервера, куда ставите Node |

- Если ставите на тот же сервер, что и сайт: IP сейчас `81.177.24.62`.
- Если отдельный VPS — укажите IP этого VPS.

Проверка: `nslookup kbm.eorok.ru` должен показать нужный IP.

### 2. Копирование проекта на сервер

На сервере (Ubuntu/Debian), от root:

```bash
mkdir -p /var/www/kbm-contest
# с вашего ПК, например:
# rsync -av --exclude node_modules --exclude data --exclude .git ./ user@SERVER:/var/www/kbm-contest/
```

Либо `git clone` репозитория в `/var/www/kbm-contest`.

### 3. Автоустановка

```bash
cd /var/www/kbm-contest
bash deploy/install.sh
```

Скрипт:

- ставит Node.js, Nginx, certbot (если нужно);
- выполняет `npm install --omit=dev`;
- создаёт `deploy/kbm-contest.env` со случайным паролем организатора (пароль выводится в консоль — **сохраните**);
- включает systemd-сервис `kbm-contest`;
- подключает Nginx для `kbm.eorok.ru`;
- добавляет ежедневный cron-бэкап `data/` в `/var/backups/kbm-contest`.

Файлы деплоя:

- [`deploy/kbm.eorok.ru.nginx.conf`](deploy/kbm.eorok.ru.nginx.conf)
- [`deploy/kbm-contest.service`](deploy/kbm-contest.service)
- [`deploy/kbm-contest.env.example`](deploy/kbm-contest.env.example)
- [`deploy/backup-data.sh`](deploy/backup-data.sh)
- [`deploy/install.sh`](deploy/install.sh)

### 4. HTTPS

Когда DNS уже указывает на сервер:

```bash
certbot --nginx -d kbm.eorok.ru
```

### 5. Проверка

```bash
systemctl status kbm-contest
curl -sS http://127.0.0.1:3000/ | head
curl -sS -o /dev/null -w "%{http_code}\n" https://kbm.eorok.ru/
curl -sS -o /dev/null -w "%{http_code}\n" https://kbm.eorok.ru/organizer
# ожидается 401 без пароля, 200 с паролем:
curl -sS -o /dev/null -w "%{http_code}\n" -u organizer:ПАРОЛЬ https://kbm.eorok.ru/organizer
```

Пароль лежит в `/var/www/kbm-contest/deploy/kbm-contest.env` (`ORGANIZER_PASSWORD`).

### 6. Обновление кода

```bash
cd /var/www/kbm-contest
# git pull или rsync
npm install --omit=dev
systemctl restart kbm-contest
```

Каталог `data/` при обновлении **не удаляйте**.

### Бэкапы

По умолчанию cron в 03:15 копирует `data/` в `/var/backups/kbm-contest/YYYYMMDD-HHMMSS/` и хранит ~30 дней. Ручной запуск:

```bash
bash /var/www/kbm-contest/deploy/backup-data.sh
```
