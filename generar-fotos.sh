#!/usr/bin/env bash
# Regenera photos.js con todas las imágenes de la carpeta img/.
# Uso:  ./generar-fotos.sh
set -euo pipefail

cd "$(dirname "$0")"

IMG_DIR="img"
OUT="photos.js"

count=$(ls "$IMG_DIR" 2>/dev/null | grep -icE '\.(heic|jpe?g|png)$' || true)
if [ "$count" -eq 0 ]; then
  echo "No se encontraron imágenes en $IMG_DIR/"
  exit 1
fi

{
  cat <<'EOF'
/* Lista de fotos del cuaderno. Regenera este archivo con:  ./generar-fotos.sh
   El orden final se calcula por la fecha EXIF de cada foto.

   ¿Una foto sale como "Fecha desconocida"? Es que no tiene fecha EXIF.
   Tienes dos formas de darle fecha (AÑO-MES-DÍA):
   1) Renombrar el archivo incluyendo la fecha (lo más fácil), por ejemplo:
        2026-09-15.HEIC   o   2026-09-15_playa.HEIC   o   20260915.HEIC
   2) O cambiar el texto por un objeto con "date":
        Antes:   "img/IMG_0148.HEIC",
        Después: { src: "img/IMG_0148.HEIC", date: "2026-09-15" },
   La fecha (EXIF > manual > nombre) se muestra y se usa para ordenar. */
window.PHOTOS = [
EOF
  ls "$IMG_DIR" | grep -iE '\.(heic|jpe?g|png)$' | sort | awk '{printf "  \"img/%s\",\n", $0}'
  echo "];"
} > "$OUT"

echo "✓ $OUT generado con $count foto(s)."
