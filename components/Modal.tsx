import React, { useEffect, useState, useRef } from 'react';
import { Project } from '../types';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ModalProps {
  item: Project | null;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

const Modal: React.FC<ModalProps> = ({ item, onClose, onNext, onPrev }) => {
  const [visible, setVisible] = useState(false);

  // Swipe Logic State
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);
  const minSwipeDistance = 50;

  useEffect(() => {
    if (item) {
      setVisible(true);
    } else {
      setTimeout(() => setVisible(false), 300); // Wait for exit animation
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
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && onNext) {
      onNext();
    }
    if (isRightSwipe && onPrev) {
      onPrev();
    }
  };

  // Mouse Drag Logic (for Desktop Swipe)
  const onMouseDown = (e: React.MouseEvent) => {
    touchEnd.current = null;
    touchStart.current = e.clientX;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (touchStart.current !== null) {
      touchEnd.current = e.clientX;
    }
  };

  const onMouseUp = () => {
    if (touchStart.current === null || touchEnd.current === null) {
      touchStart.current = null;
      touchEnd.current = null;
      return;
    }
    const distance = touchStart.current - touchEnd.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && onNext) {
      onNext();
    }
    if (isRightSwipe && onPrev) {
      onPrev();
    }

    // Reset
    touchStart.current = null;
    touchEnd.current = null;
  };

  if (!item && !visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-500 ease-in-out ${item ? 'bg-black/80 backdrop-blur-xl opacity-100 pointer-events-auto' : 'bg-black/0 backdrop-blur-none opacity-0 pointer-events-none'}`}
      onClick={onClose}
    >
      <div
        className={`relative w-full h-full md:w-[90%] md:h-[90%] bg-neutral-900 md:rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row transition-transform duration-700 cubic-bezier(0.16, 1, 0.3, 1) ${item ? 'translate-y-0 scale-100' : 'translate-y-20 scale-95'}`}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-50 p-2 bg-black/50 text-white rounded-full hover:bg-white hover:text-black transition-colors backdrop-blur-md"
        >
          <X size={24} />
        </button>

        {/* Navigation Buttons (Unified & Bottom Positioned) */}
        {onPrev && (
          <button
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            className="absolute left-6 bottom-8 z-50 p-3 bg-black/30 text-white/70 rounded-full hover:bg-white hover:text-black hover:scale-110 transition-all backdrop-blur-md"
          >
            <ChevronLeft size={32} />
          </button>
        )}

        {onNext && (
          <button
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="absolute right-6 bottom-8 z-50 p-3 bg-black/30 text-white/70 rounded-full hover:bg-white hover:text-black hover:scale-110 transition-all backdrop-blur-md"
          >
            <ChevronRight size={32} />
          </button>
        )}

        {/* Image Section */}
        <div className="w-full h-full relative overflow-hidden bg-black flex items-center justify-center">
          {item && (
            <>
              {item.mediaType === 'video' ? (
                <video
                  src={item.imageUrl}
                  className="max-w-full max-h-full object-contain"
                  controls
                  autoPlay
                  loop
                  controlsList="nodownload"
                  onContextMenu={(e) => e.preventDefault()}
                />
              ) : item.mediaType === 'audio' ? (
                <div className="flex flex-col items-center justify-center w-full h-full">
                  <div className="flex items-end gap-2 h-32 mb-8">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="w-4 bg-white animate-pulse"
                        style={{
                          height: `${Math.random() * 100}%`,
                          animationDelay: `${i * 0.1}s`,
                          animationDuration: '0.8s'
                        }}
                      />
                    ))}
                  </div>
                  <audio
                    src={item.imageUrl}
                    controls
                    controlsList="nodownload"
                    className="w-full max-w-md"
                    onContextMenu={(e) => e.preventDefault()}
                  />
                </div>
              ) : (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="max-w-full max-h-full object-contain"
                  onContextMenu={(e) => e.preventDefault()}
                  draggable={false}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
