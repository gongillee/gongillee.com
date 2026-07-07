import React, { useEffect, useState, useRef, useMemo } from 'react';

export interface ModalItem {
  no: string;
  year: string;
  location: string;
  title: string;
  mediumLabel: string;
  mediaType: 'image' | 'video' | 'audio';
  url: string;
}

interface ModalProps {
  item: ModalItem | null;
  position?: { current: number; total: number };
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

const Modal: React.FC<ModalProps> = ({ item, position, onClose, onNext, onPrev }) => {
  const [visible, setVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Swipe Logic State
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);
  const minSwipeDistance = 50;

  // Stable pseudo-waveform for the audio view
  const bars = useMemo(
    () => Array.from({ length: 24 }, (_, i) => 25 + Math.abs(Math.sin((i + 1) * 2.7)) * 75),
    [item?.url]
  );

  useEffect(() => {
    if (item) {
      setVisible(true);
      setIsLoading(true);
    } else {
      const t = setTimeout(() => setVisible(false), 500); // Match exit transition
      return () => clearTimeout(t);
    }
  }, [item]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!item) return;
      if (e.key === 'ArrowLeft' && onPrev) onPrev();
      if (e.key === 'ArrowRight' && onNext) onNext();
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [item, onNext, onPrev, onClose]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    const distance = touchStart.current - touchEnd.current;
    if (distance > minSwipeDistance && onNext) onNext();
    if (distance < -minSwipeDistance && onPrev) onPrev();
  };

  if (!item && !visible) return null;

  const caption = item
    ? `no.${item.no} · ${item.year} · ${item.location}${item.title ? ` — ${item.title}` : ''} · ${item.mediumLabel}`
    : '';

  const navBtn = `font-mono text-[11px] tracking-[0.08em] px-2 py-1 transition-opacity opacity-70 hover:opacity-100 disabled:opacity-25`;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-500 ease-in-out ${
        item
          ? 'bg-paper/90 backdrop-blur-md opacity-100 pointer-events-auto'
          : 'bg-transparent backdrop-blur-none opacity-0 pointer-events-none'
      }`}
      onClick={onClose}
    >
      <div
        className={`relative flex h-full w-full flex-col overflow-hidden border border-ink bg-paper text-ink transition-transform duration-500 md:h-[90%] md:w-[90%] ${
          item ? 'translate-y-0 scale-100' : 'translate-y-10 scale-[0.98]'
        }`}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Stage */}
        <div className="relative flex min-h-0 flex-1 items-center justify-center p-4 md:p-8">
          {item && (
            <>
              {item.mediaType === 'video' ? (
                <>
                  {isLoading && (
                    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink border-t-transparent"></div>
                    </div>
                  )}
                  <video
                    src={item.url}
                    className="max-h-full max-w-full object-contain"
                    controls
                    autoPlay
                    playsInline
                    preload="auto"
                    loop
                    controlsList="nodownload"
                    onContextMenu={(e) => e.preventDefault()}
                    onLoadStart={() => setIsLoading(true)}
                    onWaiting={() => setIsLoading(true)}
                    onCanPlay={() => setIsLoading(false)}
                    onPlaying={() => setIsLoading(false)}
                  />
                </>
              ) : item.mediaType === 'audio' ? (
                <div className="flex w-full flex-col items-center justify-center gap-10 px-6">
                  <div className="flex h-28 items-end gap-[6px]">
                    {bars.map((h, i) => (
                      <div
                        key={i}
                        className="w-[3px] animate-pulse bg-ink"
                        style={{ height: `${h}%`, animationDelay: `${i * 0.08}s`, animationDuration: '1.1s' }}
                      />
                    ))}
                  </div>
                  <audio
                    src={item.url}
                    controls
                    controlsList="nodownload"
                    className="w-full max-w-md"
                    onContextMenu={(e) => e.preventDefault()}
                  />
                </div>
              ) : (
                <img
                  src={item.url}
                  alt={caption}
                  className="max-h-full max-w-full border border-ink object-contain"
                  onContextMenu={(e) => e.preventDefault()}
                  draggable={false}
                />
              )}
            </>
          )}
        </div>

        {/* Caption strip */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-ink px-4 py-3">
          <span className="min-w-0 truncate font-mono text-[11px] tracking-[0.06em]">
            {caption}
          </span>
          <span className="flex items-center gap-2 whitespace-nowrap">
            {position && (
              <span className="font-mono text-[11px] text-muted">
                {String(position.current).padStart(3, '0')} / {String(position.total).padStart(3, '0')}
              </span>
            )}
            {onPrev && (
              <button className={navBtn} onClick={(e) => { e.stopPropagation(); onPrev(); }}>
                ← prev
              </button>
            )}
            {onNext && (
              <button className={navBtn} onClick={(e) => { e.stopPropagation(); onNext(); }}>
                next →
              </button>
            )}
            <button
              className={`${navBtn} border border-dotted border-ink`}
              onClick={onClose}
            >
              esc ×
            </button>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Modal;
