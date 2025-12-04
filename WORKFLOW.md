---
description: How to add new images, videos, or audio and deploy the changes
---

# Adding New Media and Deploying

Follow these steps to add new content to your website.

## 1. Add Media Files
Place your new files in the correct folder:
- **Images:** `assets/images/`
- **Videos:** `assets/videos/` (Note: If >100MB, ensure Git LFS is tracked)
- **Audio:** `assets/audio/`

<!-- ## 2. Optimize Media (For Videos)
If you added new video files, run this command to optimize them for faster streaming:

```bash
npm run optimize-media
```
*This will automatically process your videos so they play instantly on the web.* -->

## 2. Update Data
Open `projects.ts` and add a new entry to the `PROJECTS_DATA` array.

**Example:**
```typescript
{
  title: "New Project Title",
  client: "Client Name",
  year: "2024",
  type: "Type",
  description: "Description...",
  mediaType: 'image', // or 'video', 'audio'
  src: 'your-new-file.jpg' // Filename only
},
```

## 3. Push to GitHub
Open your terminal and run:

```bash
# 1. Add all changes
git add .

# 2. Commit with a message
git commit -m "feat: add new project images"

# 3. Push to GitHub
git push origin main
```

## 4. Automatic Deployment
Once you push, **GitHub Actions** will automatically:
1.  Build your website.
2.  Deploy it to the `gh-pages` branch.
3.  Update the live site at `https://gongillee.com/`.

**Wait about 2-3 minutes** for the changes to appear.

## 5. Branches (FAQ)
- **`main`**: This is your workspace. **Always work and push to this branch.**
- **`gh-pages`**: This is a background branch used by the system to host the site. **You can completely ignore it.**

---

# Appendix: Video Compression Guide

For mobile optimization and faster loading, it is recommended to compress videos to under **20MB**.

### Option 1: Recommended Web Optimization (Best Quality/Size Balance)
This command resizes to 720p, optimizes compression, and enables instant web streaming.

```bash
ffmpeg -i input.mp4 -vf scale=1280:-2 -c:v libx264 -crf 23 -preset slow -c:a copy -movflags +faststart output.mp4
```
- `-vf scale=1280:-2`: Resizes width to 1280px, auto-calculates height.
- `-crf 23`: Controls quality (lower is better, 18-28 is standard).
- `-movflags +faststart`: **Crucial for web** (allows video to start playing before fully downloading).

### Option 2: High Compression (For Mobile/Backgrounds)
Use this if you need the file size to be extremely small.

```bash
ffmpeg -i input.mp4 -vf scale=1280:-2 -c:v libx264 -crf 28 -preset slow -c:a copy -movflags +faststart output.mp4
```

### Option 3: Quick Resize (Your Method)
Simple resize, fast processing.

```bash
ffmpeg -i input.mp4 -s 1280x720 -acodec copy -y output.mp4
```
