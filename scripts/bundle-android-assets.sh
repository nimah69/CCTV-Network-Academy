#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DEST="android/app/src/main/assets/academy"
mkdir -p "$DEST/js" "$DEST/icons"

cp index.html workshops.html manifest.webmanifest service-worker.js "$DEST/"
cp icons/*.svg "$DEST/icons/"
cp js/*.js "$DEST/js/"

required=(
  index.html
  workshops.html
  manifest.webmanifest
  service-worker.js
  icons/academy-icon.svg
  js/academy-data.js
  js/calculations.js
  js/chapter-labs.js
  js/chapter-lab-ui.js
  js/interactive-displays.js
  js/micro-lessons.js
  js/spaced-review.js
)
for relative in "${required[@]}"; do
  test -s "$DEST/$relative" || {
    printf 'Missing or empty Android asset: %s\n' "$DEST/$relative" >&2
    exit 1
  }
done

for source in js/*.js; do
  relative="${source#js/}"
  cmp -s "$source" "$DEST/js/$relative" || {
    printf 'Bundled JavaScript differs from source: %s\n' "$relative" >&2
    exit 1
  }
done

printf 'Bundled %s local JavaScript modules into %s\n' "$(find "$DEST/js" -maxdepth 1 -type f -name '*.js' | wc -l | tr -d ' ')" "$DEST"
find "$DEST" -type f | sort
