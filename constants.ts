import { Project } from './types';

export const CARD_WIDTH = 320;
export const CARD_HEIGHT = 320;
export const GAP_X = 40;
export const GAP_Y = 40;
export const RADIUS = 1375; // Radius of the cylinder
export const ANGLE_STEP = 14; // Degrees per column

import { PROJECTS_DATA } from './projects';
export { PROJECTS_DATA };

// Dynamic Media Imports
const videoModules = import.meta.glob('./assets/videos/*.{mp4,webm,mov}', { eager: true, query: '?url', import: 'default' });
const audioModules = import.meta.glob('./assets/audio/*.{mp3,wav,ogg}', { eager: true, query: '?url', import: 'default' });

const VIDEO_URLS = Object.values(videoModules) as string[];
const AUDIO_URLS = Object.values(audioModules) as string[];

export const getMediaUrl = (mediaType: 'image' | 'video' | 'audio', index: number, filename?: string): string => {
  if (filename) {
    if (mediaType === 'image') {
      return `/images/${filename}`;
    } else if (mediaType === 'video') {
      // Find the module that ends with the filename or contains the basename (for hashed files)
      const basename = filename.substring(0, filename.lastIndexOf('.'));
      const found = VIDEO_URLS.find(url => url.includes(filename) || (basename && url.includes(basename)));
      return found || '';
    } else if (mediaType === 'audio') {
      const basename = filename.substring(0, filename.lastIndexOf('.'));
      const found = AUDIO_URLS.find(url => url.includes(filename) || (basename && url.includes(basename)));
      return found || '';
    }
  }

  // Fallback to index-based assignment if no filename provided
  if (mediaType === 'video') {
    if (VIDEO_URLS.length > 0) {
      return VIDEO_URLS[index % VIDEO_URLS.length];
    }
    return '';
  } else if (mediaType === 'audio') {
    if (AUDIO_URLS.length > 0) {
      return AUDIO_URLS[index % AUDIO_URLS.length];
    }
    return '';
  } else {
    return `/images/image${String(index + 1).padStart(5, '0')}.jpg`;
  }
};

export const generateGridItems = (rows: number, cols: number, shuffle: boolean = false, sourceData: Omit<Project, 'id' | 'imageUrl'>[] = PROJECTS_DATA) => {
  const items = [];

  // Create a shuffled copy of data if requested
  let dataPool = [...sourceData];
  if (shuffle) {
    // Fisher-Yates shuffle
    for (let i = dataPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [dataPool[i], dataPool[j]] = [dataPool[j], dataPool[i]];
    }
  }

  // Helper to get item at grid position
  const getItemAt = (r: number, c: number) => {
    return items.find(item => item.row === r && item.col === c);
  };

  let poolIndex = 0;

  for (let r = -Math.floor(rows / 2); r < Math.floor(rows / 2) + (rows % 2); r++) {
    for (let c = -Math.floor(cols / 2); c < Math.floor(cols / 2) + (cols % 2); c++) {

      // Try to find a non-conflicting item
      let selectedData = null;

      // Look ahead in the pool to find a valid item
      // We check up to dataPool.length times to find a match
      // If we can't find one, we just take the next one (unavoidable collision)

      const leftNeighbor = getItemAt(r, c - 1);
      const topNeighbor = getItemAt(r - 1, c);

      // We need to check against neighbors. 
      // Since dataPool might be smaller than grid, we cycle through it.
      // We want to pick an index `k` such that dataPool[k] != neighbors.

      let found = false;
      let attempts = 0;
      const maxAttempts = dataPool.length; // Don't search forever

      while (!found && attempts < maxAttempts) {
        const candidate = dataPool[poolIndex % dataPool.length];

        // Check conflicts (ignore if title is empty)
        const conflictLeft = leftNeighbor && leftNeighbor.title && candidate.title && leftNeighbor.title === candidate.title;
        const conflictTop = topNeighbor && topNeighbor.title && candidate.title && topNeighbor.title === candidate.title;

        if (!conflictLeft && !conflictTop) {
          selectedData = candidate;
          found = true;
        } else {
          // If conflict, try next item in pool
          poolIndex++;
          attempts++;
        }
      }

      // If still not found (very dense constraints or small pool), just take the current one
      if (!selectedData) {
        selectedData = dataPool[poolIndex % dataPool.length];
      }

      // Increment for next cell (unless we just used it, but we incremented in loop)
      poolIndex++;

      let url = '';
      // Use helper with src if available
      url = getMediaUrl(selectedData.mediaType, poolIndex, selectedData.src);

      items.push({
        ...selectedData,
        id: `card-${items.length}`, // Use items.length for unique ID sequence
        row: r,
        col: c,
        imageUrl: url
      });
    }
  }
  return items;
};
