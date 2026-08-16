#!/bin/sh
set -eu

APP_DIR=/home/deploy/obr-mosmit
BACKUP_DIR=/home/deploy/backups
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"

mkdir -p "$BACKUP_DIR"
cd "$APP_DIR"

docker compose -f compose.prod.yaml exec -T db \
  pg_dump -U obr_mosmit -d obr_mosmit \
  | gzip -9 > "$BACKUP_DIR/database-$STAMP.sql.gz"

docker run --rm \
  -v obr-mosmit_uploads_data:/data:ro \
  alpine:3.22 tar -czf - -C /data . \
  > "$BACKUP_DIR/uploads-$STAMP.tar.gz"

find "$BACKUP_DIR" -type f -mtime +14 -delete
