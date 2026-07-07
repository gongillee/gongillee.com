import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Modal, { ModalItem } from './components/Modal';
import StippleCanvas from './components/StippleCanvas';
import IndexView from './components/IndexView';
import Marquee from './components/Marquee';
import { PROJECTS_DATA, getMediaUrl } from './constants';

type View = 'canvas' | 'index';

const MEDIUM_LABEL: Record<string, string> = {
  image: '사진',
  video: '영상',
  audio: '음악',
};

const buildModalItem = (projectIdx: number): ModalItem => {
  const p = PROJECTS_DATA[projectIdx];
  return {
    no: String(projectIdx + 1).padStart(3, '0'),
    year: p.year,
    location: p.type,
    title: p.mediaType === 'image' ? '' : p.title,
    mediumLabel: MEDIUM_LABEL[p.mediaType],
    mediaType: p.mediaType,
    url: getMediaUrl(p.mediaType, projectIdx, p.src),
  };
};

const App: React.FC = () => {
  const [view, setView] = useState<View>('canvas');
  // Modal state: an ordered list of project indices + the current position in it
  const [modal, setModal] = useState<{ list: number[]; pos: number } | null>(null);

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

  const allIndices = useMemo(() => PROJECTS_DATA.map((_, i) => i), []);

  const handleDotClick = useCallback((projectIdx: number) => {
    setModal({ list: allIndices, pos: projectIdx });
  }, [allIndices]);

  const handleIndexOpen = useCallback((list: number[], pos: number) => {
    setModal({ list, pos });
  }, []);

  const modalItem = modal ? buildModalItem(modal.list[modal.pos]) : null;

  const handlePrev = modal && modal.pos > 0
    ? () => setModal(m => m && { ...m, pos: m.pos - 1 })
    : undefined;
  const handleNext = modal && modal.pos < modal.list.length - 1
    ? () => setModal(m => m && { ...m, pos: m.pos + 1 })
    : undefined;

  const pillBase = 'font-mono text-[11px] tracking-[0.08em] px-3 py-1 transition-colors';
  const pillOn = 'border border-solid border-ink bg-ink text-paper';
  const pillOff = 'border border-dotted border-ink opacity-70 hover:opacity-100';

  return (
    <div
      className={`relative w-full h-screen overflow-hidden select-none bg-paper ${view === 'canvas' ? 'touch-none' : ''}`}
    >
      {/* Stage */}
      {view === 'canvas' ? (
        <StippleCanvas onOpen={handleDotClick} active={modal === null} />
      ) : (
        <IndexView onOpen={handleIndexOpen} />
      )}

      {/* HUD */}
      <div className="fixed inset-0 pointer-events-none z-50 text-ink">
        {/* Top Left - Brand */}
        <div className="absolute top-6 left-5 md:top-8 md:left-8 pointer-events-auto">
          <h1 className="font-mono text-lg md:text-xl font-medium tracking-tight lowercase">
            gong il lee
          </h1>
          <p className="font-mono text-[10px] tracking-[0.14em] text-muted">
            012
          </p>
        </div>

        {/* Bottom Right - View toggle */}
        <div className="absolute bottom-12 right-5 md:bottom-14 md:right-8 pointer-events-auto flex items-center gap-2">
          <button
            onClick={() => setView('canvas')}
            className={`${pillBase} ${view === 'canvas' ? pillOn : pillOff}`}
          >
            dot
          </button>
          <button
            onClick={() => setView('index')}
            className={`${pillBase} ${view === 'index' ? pillOn : pillOff}`}
          >
            grid
          </button>
        </div>
      </div>

      {/* Bottom ticker */}
      <Marquee />

      {/* Detail modal */}
      <Modal
        item={modalItem}
        position={modal ? { current: modal.pos + 1, total: modal.list.length } : undefined}
        onClose={() => setModal(null)}
        onPrev={handlePrev}
        onNext={handleNext}
      />
    </div>
  );
};

export default App;
