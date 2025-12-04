#!/bin/bash

# Directory containing media
VIDEO_DIR="assets/videos"
AUDIO_DIR="assets/audio"

# Ensure ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "ffmpeg could not be found. Please install it first."
    exit 1
fi

echo "Optimizing Videos..."
find "$VIDEO_DIR" -type f \( -name "*.mp4" -o -name "*.mov" \) | while read file; do
    echo "Processing $file..."
    temp_file="${file%.*}_temp.${file##*.}"
    
    # Move metadata to the beginning of the file (faststart)
    ffmpeg -i "$file" -c copy -movflags +faststart "$temp_file" -y -loglevel error
    
    if [ $? -eq 0 ]; then
        mv "$temp_file" "$file"
        echo "Optimized $file"
    else
        echo "Failed to optimize $file"
        rm "$temp_file"
    fi
done

echo "Optimization Complete!"
