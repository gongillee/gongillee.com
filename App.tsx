import React, { useState, useEffect, useCallback } from 'react';
import Modal from './components/Modal';
import DotCanvas from './components/DotCanvas';

const App: React.FC = () => {
  const [theme, setTheme] = useState<'day' | 'night'>('night');
  const [selectedImage, setSelectedImage] = useState<{ imageUrl: string; mediaType: 'image' | 'video' | 'audio' } | null>(null);

  // Global Content Protection
  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', preventDefault);
    document.addEventListener('dragstart', preventDefault);
    return () => {
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('dragstart', preventDefault);
    };
  }, []);

  const handleDotClick = useCallback((imageUrl: string, mediaType: 'image' | 'video' | 'audio') => {
    setSelectedImage({ imageUrl, mediaType });
  }, []);

  const handleThemeToggle = () => {
    setTheme(prev => prev === 'day' ? 'night' : 'day');
  };

  // Build a minimal Project-like item for Modal
  const modalItem = selectedImage ? {
    id: 'dot-preview',
    title: '',
    client: '',
    year: '',
    type: '',
    imageUrl: selectedImage.imageUrl,
    description: '',
    mediaType: selectedImage.mediaType,
  } : null;

  return (
    <div className={`relative w-full h-screen overflow-hidden touch-none select-none transition-colors duration-500 ${theme === 'day' ? 'bg-white' : 'bg-black'}`}>

      {/* Dot Canvas — Single Page */}
      <DotCanvas theme={theme} onDotClick={handleDotClick} />

      {/* Minimal HUD */}
      <div className={`fixed inset-0 pointer-events-none z-50 ${theme === 'day' ? 'text-black' : 'text-white'}`}>
        {/* Top Left - Brand */}
        <div className="absolute top-6 left-6 md:top-8 md:left-8 pointer-events-auto">
          <h1 className="text-xl md:text-2xl font-bold tracking-tighter mix-blend-difference">
            gong il lee
          </h1>
          <p className="text-xs font-mono opacity-60 mix-blend-difference">
            012
          </p>
        </div>

        {/* Top Right - Info */}
        <div className="absolute top-6 right-6 md:top-8 md:right-8 text-right pointer-events-auto">
          <div className="flex flex-col items-end gap-1">
            <p className="text-xs font-mono opacity-60 mix-blend-difference">
              {new Date().getFullYear()} ©
            </p>
            <p className="text-xs font-mono opacity-60 mix-blend-difference">
              DRAG TO EXPLORE
            </p>
            <p className="text-xs font-mono opacity-60 mix-blend-difference">
              HOVER TO PREVIEW
            </p>
          </div>
        </div>

        {/* Bottom Right - Theme Toggle */}
        <div className="absolute bottom-8 right-6 md:bottom-8 md:right-8 pointer-events-auto">
          <button
            onClick={handleThemeToggle}
            className="w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md bg-white/10 hover:bg-white/20 transition-all border border-white/10"
          >
            {theme === 'day' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></svg>
            )}
          </button>
        </div>
      </div>

      {/* Modal for full image view */}
      <Modal
        item={modalItem}
        onClose={() => setSelectedImage(null)}
      />
    </div>
  );
};

export default App;
