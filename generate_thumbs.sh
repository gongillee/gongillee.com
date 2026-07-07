#!/bin/bash

# Generate lightweight thumbnails for hover previews and the index view.
# Originals stay in public/images/ (used by the detail modal);
# thumbnails land in public/thumbs/ with the same filename.
# Only missing thumbnails are generated — safe to re-run any time.

SRC_DIR="public/images"
OUT_DIR="public/thumbs"
MAX_DIM=480
QUALITY=75

if ! command -v sips &> /dev/null; then
    echo "sips could not be found (this script expects macOS)."
    exit 1
fi

mkdir -p "$OUT_DIR"

count=0
skipped=0
for src in "$SRC_DIR"/*.jpg "$SRC_DIR"/*.jpeg "$SRC_DIR"/*.png; do
    [ -e "$src" ] || continue
    name=$(basename "$src")
    out="$OUT_DIR/$name"

    if [ -e "$out" ]; then
        skipped=$((skipped + 1))
        continue
    fi

    sips -s format jpeg -s formatOptions "$QUALITY" -Z "$MAX_DIM" "$src" --out "$out" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        count=$((count + 1))
    else
        echo "Failed: $name"
    fi
done

echo "Done. Generated $count thumbnail(s), skipped $skipped existing."
