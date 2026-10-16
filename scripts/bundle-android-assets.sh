#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DEST="$ROOT_DIR/android/app/src/main/assets/academy"
mkdir -p "$DEST/js" "$DEST/icons" "$DEST/fonts"
cp "$ROOT_DIR/index.html" "$ROOT_DIR/workshops.html" "$ROOT_DIR/manifest.webmanifest" "$ROOT_DIR/service-worker.js" "$DEST/"
cp "$ROOT_DIR/icons/"*.svg "$DEST/icons/"
cp "$ROOT_DIR/js/"*.js "$DEST/js/"
if [[ -d "$ROOT_DIR/fonts" ]]; then cp "$ROOT_DIR/fonts/"* "$DEST/fonts/"; fi
for file in index.html workshops.html manifest.webmanifest service-worker.js; do test -s "$DEST/$file"; done
test -s "$DEST/icons/academy-icon.svg"
for source in "$ROOT_DIR"/js/*.js; do
  target="$DEST/js/$(basename "$source")"
  test -s "$target"
  cmp -s "$source" "$target"
done
if [[ -f "$ROOT_DIR/fonts/Vazirmatn-Variable.woff2" ]]; then
  test -s "$DEST/fonts/Vazirmatn-Variable.woff2"
  cmp -s "$ROOT_DIR/fonts/Vazirmatn-Variable.woff2" "$DEST/fonts/Vazirmatn-Variable.woff2"
  test -s "$DEST/fonts/OFL.txt"
fi
echo "Bundled offline academy assets:"
find "$DEST" -type f | sort
