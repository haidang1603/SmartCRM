#!/bin/bash
# ==============================================================================
# SmartCRM - MySQL Database Backup Script (Linux / macOS)
# Performs consistent logical backup with timestamp and gzip compression.
# ==============================================================================

set -euo pipefail

BACKUP_DIR="${1:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/smartcrm_backup_${TIMESTAMP}.sql.gz"

CONTAINER_NAME="${DB_CONTAINER:-smartcrm-mysql}"
DB_NAME="${DB_NAME:-smartcrm}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${MYSQL_ROOT_PASSWORD:-secret}"

mkdir -p "${BACKUP_DIR}"

echo "[INFO] Starting database backup for '${DB_NAME}' from container '${CONTAINER_NAME}'..."

docker exec "${CONTAINER_NAME}" mysqldump \
  -u"${DB_USER}" \
  -p"${DB_PASSWORD}" \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  "${DB_NAME}" | gzip > "${BACKUP_FILE}"

echo "[SUCCESS] Backup completed successfully: ${BACKUP_FILE}"
echo "[INFO] File size: $(ls -lh "${BACKUP_FILE}" | awk '{print $5}')"
