#!/usr/bin/env bash
# Установка на Ubuntu/Debian (запускать от root на сервере):
#   cd /var/www/kbm-contest && bash deploy/install.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/kbm-contest}"
DOMAIN="${DOMAIN:-kbm.eorok.ru}"
NODE_MAJOR="${NODE_MAJOR:-20}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Запустите от root: sudo bash deploy/install.sh" >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y nginx curl ca-certificates gnupg

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y nodejs
fi

apt-get install -y certbot python3-certbot-nginx

mkdir -p "${APP_DIR}"
cd "${APP_DIR}"

if [[ ! -f package.json ]]; then
  echo "Скопируйте проект в ${APP_DIR} (git clone или rsync) и повторите." >&2
  exit 1
fi

npm install --omit=dev

mkdir -p "${APP_DIR}/data" /var/backups/kbm-contest
chown -R www-data:www-data "${APP_DIR}"
chmod 750 "${APP_DIR}/data"

ENV_FILE="${APP_DIR}/deploy/kbm-contest.env"
if [[ ! -f "${ENV_FILE}" ]]; then
  cp "${APP_DIR}/deploy/kbm-contest.env.example" "${ENV_FILE}"
  PASS="$(openssl rand -base64 18 | tr -d '=+/')"
  sed -i "s|замените_перед_запуском|${PASS}|" "${ENV_FILE}"
  chown root:www-data "${ENV_FILE}"
  chmod 640 "${ENV_FILE}"
  echo "Создан ${ENV_FILE}"
  echo "ORGANIZER_USER=organizer"
  echo "ORGANIZER_PASSWORD=${PASS}"
  echo "Сохраните пароль — он понадобится для входа в /organizer"
fi

NODE_BIN="$(command -v node)"
sed "s|/usr/bin/node|${NODE_BIN}|g" "${APP_DIR}/deploy/kbm-contest.service" \
  > /etc/systemd/system/kbm-contest.service

cp "${APP_DIR}/deploy/kbm.eorok.ru.nginx.conf" "/etc/nginx/sites-available/${DOMAIN}"
ln -sfn "/etc/nginx/sites-available/${DOMAIN}" "/etc/nginx/sites-enabled/${DOMAIN}"
nginx -t
systemctl reload nginx

systemctl daemon-reload
systemctl enable kbm-contest
systemctl restart kbm-contest

chmod +x "${APP_DIR}/deploy/backup-data.sh"
CRON_LINE="15 3 * * * APP_DIR=${APP_DIR} ${APP_DIR}/deploy/backup-data.sh >> /var/log/kbm-backup.log 2>&1"
(crontab -l 2>/dev/null | grep -v 'kbm-contest/deploy/backup-data.sh' || true; echo "${CRON_LINE}") | crontab -

echo
echo "Сервис запущен. Проверка: curl -sS http://127.0.0.1:3000/ | head"
echo "Когда DNS kbm.eorok.ru укажет на этот сервер, выполните:"
echo "  certbot --nginx -d ${DOMAIN}"
echo
systemctl --no-pager --full status kbm-contest || true
