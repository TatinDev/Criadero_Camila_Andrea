#!/bin/bash
# generate-ssl.sh — Genera certificado SSL autofirmado para desarrollo
# En produccion, reemplazar con certificado real de Let's Encrypt / autoridad certificadora

set -e
DIR="$(cd "$(dirname "$0")/deploy/ssl" && pwd)"
mkdir -p "$DIR"

if [ -f "$DIR/cert.pem" ] && [ -f "$DIR/key.pem" ]; then
  echo "Certificado ya existe en ${DIR}"
  exit 0
fi

echo "Generando certificado SSL autofirmado..."
openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout "$DIR/key.pem" \
  -out "$DIR/cert.pem" \
  -subj "/CN=criadero-camila-andrea.local/O=Criadero Camila Andrea/C=CL" \
  -addext "subjectAltName=DNS:criadero-camila-andrea.local,DNS:localhost,IP:127.0.0.1"

echo "OK: ${DIR}/cert.pem"
echo "OK: ${DIR}/key.pem"
