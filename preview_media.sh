#!/bin/bash

# Directory containing videos
VIDEO_DIR="assets/videos"

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "Error: ffmpeg is not installed. Please install it first."
    exit 1
fi

echo "Generating video previews..."

# Loop through all mp4 files in the directory
for file in "$VIDEO_DIR"/*.mp4; do
    # Check if file exists (in case of no matches)
    [ -e "$file" ] || continue

    # Get filename without extension
    filename=$(basename -- "$file")
    extension="${filename##*.}"
    filename="${filename%.*}"

    # Skip if it's already a preview file
    if [[ "$filename" == *"_preview"* ]]; then
        continue
    fi

    # Define preview filename
    preview_file="$VIDEO_DIR/${filename}_preview.mp4"

    # Check if preview already exists
    if [ -f "$preview_file" ]; then
        echo "Preview already exists for $file. Skipping."
        continue
    fi

    echo "Processing $file -> $preview_file"

    # Generate 5-second preview
    # -t 5: Duration 5 seconds
    # -vf scale=640:-2: Resize width to 640px (maintain aspect ratio)
    # -an: Remove audio
    # -crf 28: High compression
    ffmpeg -i "$file" -t 5 -vf "scale=640:-2" -c:v libx264 -crf 28 -preset slow -an -movflags +faststart "$preview_file"

    if [ $? -eq 0 ]; then
        echo "Successfully created $preview_file"
    else
        echo "Failed to create preview for $file"
    fi
done

echo "Preview generation complete!"
