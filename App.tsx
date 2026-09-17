import React, { useEffect, useRef, useState } from 'react';
import { PROJECTS_DATA } from './projects';

const photos = PROJECTS_DATA.filter(photo => photo.mediaType === 'image' && photo.src);

// Shuffle once per page load; navigation keeps the same order without repeats.
for (let i = photos.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [photos[i], photos[j]] = [photos[j], photos[i]];
}

const photoUrl = (index: number) => `/images/${photos[index].src}`;

const App: React.FC = () => {
  const [showPhotos, setShowPhotos] = useState(() => window.location.hash === '#photos');
  const [index, setIndex] = useState(0);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const move = (step: number) => setIndex(current => (current + step + photos.length) % photos.length);

  useEffect(() => {
    const onHashChange = () => setShowPhotos(window.location.hash === '#photos');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    document.title = showPhotos ? 'photos — gong il lee' : 'gong il lee';
    if (!showPhotos || !photos.length) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        move(event.key === 'ArrowLeft' ? -1 : 1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showPhotos]);

  useEffect(() => {
    if (!showPhotos || photos.length < 2) return;
    const nextImage = new Image();
    nextImage.src = photoUrl((index + 1) % photos.length);
  }, [showPhotos, index]);

  if (!showPhotos) {
    return (
      <main className="home">
        <h1>gong il lee</h1>
        <p>0 1 2</p>
        <a href="#photos">photos</a>
      </main>
    );
  }

  return (
    <main className="gallery">
      <header><a href="#">gong il lee</a></header>
      {photos.length ? <>
        <div
          className="photo-stage"
          onTouchStart={event => {
            const touch = event.touches[0];
            touchStart.current = event.touches.length === 1 ? { x: touch.clientX, y: touch.clientY } : null;
          }}
          onTouchCancel={() => { touchStart.current = null; }}
          onTouchEnd={event => {
            const start = touchStart.current;
            touchStart.current = null;
            if (!start) return;
            const touch = event.changedTouches[0];
            const dx = touch.clientX - start.x;
            const dy = touch.clientY - start.y;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) move(dx < 0 ? 1 : -1);
          }}
        >
          {failedImage === photoUrl(index) ? <p role="status">Unable to load this photo. Please try the next one.</p> :
            <img
              key={photoUrl(index)}
              src={photoUrl(index)}
              alt={`Photograph ${index + 1} by Gong Il Lee${photos[index].type ? `, ${photos[index].type}` : ''}${photos[index].year ? `, ${photos[index].year}` : ''}`}
              onError={() => setFailedImage(photoUrl(index))}
            />}
        </div>
        <nav className="photo-navigation" aria-label="Photo navigation">
          <button type="button" onClick={() => move(-1)}>previous</button>
          <span aria-live="polite" aria-atomic="true">{index + 1} / {photos.length}</span>
          <button type="button" onClick={() => move(1)}>next</button>
        </nav>
      </> : <p>No photos yet.</p>}
    </main>
  );
};

export default App;
