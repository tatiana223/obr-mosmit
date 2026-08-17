#!/usr/bin/env bash
# Ежедневный бэкап data/ — пример для cron:
# 15 3 * * * /var/www/kbm-contest/deploy/backup-data.sh >> /var/log/kbm-backup.log 2>&1

set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/kbm-contest}"
DATA_DIR="${APP_DIR}/data"
BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/kbm-contest}"
KEEP_DAYS="${KEEP_DAYS:-30}"
STAMP="$(date +%Y%m%d-%H%M%S)"
DEST="${BACKUP_ROOT}/${STAMP}"

mkdir -p "${DEST}"
if [[ -d "${DATA_DIR}" ]]; then
  cp -a "${DATA_DIR}/." "${DEST}/"
  echo "[$(date -Iseconds)] backup ok -> ${DEST}"
else
  echo "[$(date -Iseconds)] ERROR: нет каталога ${DATA_DIR}" >&2
  exit 1
fi

find "${BACKUP_ROOT}" -mindepth 1 -maxdepth 1 -type d -mtime "+${KEEP_DAYS}" -exec rm -rf {} +
