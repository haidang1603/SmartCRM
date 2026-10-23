#!/bin/bash
# ==============================================================================
# SmartCRM - MySQL Database Restore Script (Linux / macOS)
# ==============================================================================

set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: $0 <path_to_backup_file.sql or .sql.gz>"
  exit 1
fi

BACKUP_FILE="$1"
CONTAINER_NAME="${DB_CONTAINER:-smartcrm-mysql}"
DB_NAME="${DB_NAME:-smartcrm}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${MYSQL_ROOT_PASSWORD:-secret}"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "[ERROR] Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

echo "[WARNING] This will overwrite existing data in database '${DB_NAME}'!"
read -p "Are you sure you want to proceed? (yes/no): " CONFIRM
if [ "${CONFIRM}" != "yes" ]; then
  echo "Restore aborted by user."
  exit 0
fi

echo "[INFO] Restoring '${BACKUP_FILE}' into '${DB_NAME}'..."

if [[ "${BACKUP_FILE}" == *.gz ]]; then
  gunzip -c "${BACKUP_FILE}" | docker exec -i "${CONTAINER_NAME}" mysql -u"${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}"
else
  docker exec -i "${CONTAINER_NAME}" mysql -u"${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" < "${BACKUP_FILE}"
fi

echo "[SUCCESS] Database restored successfully!"
