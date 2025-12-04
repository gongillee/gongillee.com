import React from 'react';

interface HUDProps {
  currentView: 'archive' | 'about';
  onViewChange: (view: 'archive' | 'about') => void;
  theme: 'day' | 'night';
  onThemeToggle: () => void;
  filter: 'all' | 'image' | 'video' | 'audio';
  onFilterChange: () => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: () => void;
}

const HUD: React.FC<HUDProps> = ({
  currentView,
  onViewChange,
  theme,
  onThemeToggle,
  filter,
  onFilterChange,
  viewMode,
  onViewModeChange
}) => {
  const textColor = theme === 'day' ? 'text-black' : 'text-white';
  const bgColor = theme === 'day' ? 'bg-white/10' : 'bg-white/10'; // Keep glass effect similar
  const activeColor = theme === 'day' ? 'bg-black text-white' : 'bg-white text-black';
  const borderColor = theme === 'day' ? 'border-black/10' : 'border-white/10';

  return (
    <div className={`fixed inset-0 pointer-events-none z-50 ${textColor}`}>
      {/* Top Left - Brand */}
      <div className="absolute top-6 left-6 md:top-8 md:left-8 pointer-events-auto">
        <h1 className="text-xl md:text-2xl font-bold tracking-tighter mix-blend-difference">
          gong il lee
        </h1>
        <p className="text-xs font-mono opacity-60 mix-blend-difference">
          a.k.a. 012
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
            CLICK TO VIEW
          </p>
        </div>
      </div>

      {/* Bottom Left - View Mode & Filter */}
      {currentView === 'archive' && (
        <div className="absolute bottom-24 left-6 md:bottom-8 md:left-8 flex flex-col gap-2 pointer-events-auto items-start">
          <button
            onClick={onViewModeChange}
            className={`px-4 py-2 rounded-full backdrop-blur-md ${bgColor} text-xs font-mono hover:bg-white/20 transition-all border ${borderColor}`}
          >
            {viewMode === 'grid' ? 'LIST VIEW' : 'GRID VIEW'}
          </button>
          <button
            onClick={onFilterChange}
            className={`px-4 py-2 rounded-full backdrop-blur-md ${bgColor} text-xs font-mono hover:bg-white/20 transition-all border ${borderColor}`}
          >
            FILTER: {filter.toUpperCase()}
          </button>
        </div>
      )}

      {/* Bottom Right - Theme Toggle */}
      <div className="absolute bottom-24 right-6 md:bottom-8 md:right-8 pointer-events-auto">
        <button
          onClick={onThemeToggle}
          className={`w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md ${bgColor} hover:bg-white/20 transition-all border ${borderColor}`}
        >
          {theme === 'day' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></svg>
          )}
        </button>
      </div>

      {/* Bottom Center - Navigation */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto">
        <div className={`flex items-center gap-1 p-1 rounded-full backdrop-blur-md ${bgColor} border ${borderColor}`}>
          <button
            onClick={() => onViewChange('archive')}
            className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${currentView === 'archive' ? activeColor : 'hover:bg-white/10'}`}
          >
            ARCHIVE
          </button>
          <button
            onClick={() => onViewChange('about')}
            className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${currentView === 'about' ? activeColor : 'hover:bg-white/10'}`}
          >
            ABOUT
          </button>
        </div>
      </div>
    </div>
  );
};

export default HUD;
