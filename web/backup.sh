#!/bin/bash
# backup.sh — Backup de base de datos PostgreSQL
# Uso: ./backup.sh [output-dir]
# Por defecto guarda en ./backups/

set -e
OUTPUT_DIR="${1:-./backups}"
mkdir -p "$OUTPUT_DIR"

DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="criadero_cca_${DATE}.sql.gz"

echo "=== Respaldo de base de datos Criadero Camila Andrea ==="
echo "Destino: ${OUTPUT_DIR}/${FILENAME}"

docker compose exec -T db pg_dump -U postgres -d criadero_camila_andrea | gzip > "${OUTPUT_DIR}/${FILENAME}"

echo "OK: $(du -h "${OUTPUT_DIR}/${FILENAME}" | cut -f1)"
echo "Para restaurar: gunzip -c ${FILENAME} | docker compose exec -T db psql -U postgres -d criadero_camila_andrea"
