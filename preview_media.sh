#!/bin/bash

# Directory to save previews
PREVIEW_DIR="assets/videos/previews"
PROJECTS_FILE="projects.ts"

# Create preview directory if it doesn't exist
mkdir -p "$PREVIEW_DIR"

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "Error: ffmpeg is not installed. Please install it first."
    exit 1
fi

echo "Scanning $PROJECTS_FILE for video URLs..."

# Extract URLs from projects.ts
# 1. grep: Find lines with 'https://...mp4'
# 2. grep -o: Extract just the URL part
# 3. grep -v: Exclude existing preview URLs (containing _preview)
# 4. sort -u: Remove duplicates
URLS=$(grep -o "https://[^']*\.mp4" "$PROJECTS_FILE" | grep -v "_preview" | sort -u)

if [ -z "$URLS" ]; then
    echo "No video URLs found in $PROJECTS_FILE."
    exit 0
fi

echo "Found the following videos:"
echo "$URLS"
echo "-----------------------------------"

# Loop through each URL
for url in $URLS; do
    # Extract filename from URL (e.g., constantvalue8.mp4)
    filename=$(basename "$url")
    
    # Remove extension (e.g., constantvalue8)
    name="${filename%.*}"
    
    # Define output path
    output_file="$PREVIEW_DIR/${name}_preview.mp4"

    # Check if preview already exists
    if [ -f "$output_file" ]; then
        echo "[SKIP] Preview already exists: $output_file"
        continue
    fi

    echo "[PROCESSING] $filename"
    echo "  Source: $url"
    echo "  Target: $output_file"

    # Generate preview
    # -t 30: Duration 30 seconds (User requested)
    # -vf scale=320:-2: Resize width to 320px
    # -an: Remove audio
    # -crf 28: High compression
    # -movflags +faststart: Web optimization
    ffmpeg -i "$url" -t 30 -vf "scale=320:-2" -c:v libx264 -crf 28 -preset slow -an -movflags +faststart "$output_file" < /dev/null

    if [ $? -eq 0 ]; then
        echo "  [SUCCESS] Created $output_file"
    else
        echo "  [FAILED] Could not create preview for $url"
    fi
    echo "-----------------------------------"
done

echo "All done! Previews are saved in $PREVIEW_DIR"
