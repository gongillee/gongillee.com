import React, { useEffect, useState } from 'react';
import { Project } from '../types';
import { X, ArrowRight, Share2 } from 'lucide-react';

interface ModalProps {
  item: Project | null;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ item, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (item) {
      setVisible(true);
    } else {
      setTimeout(() => setVisible(false), 300); // Wait for exit animation
    }
  }, [item]);

  if (!item && !visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-500 ease-in-out ${item ? 'bg-black/80 backdrop-blur-xl opacity-100 pointer-events-auto' : 'bg-black/0 backdrop-blur-none opacity-0 pointer-events-none'}`}
      onClick={onClose}
    >
      <div
        className={`relative w-full h-full md:w-[90%] md:h-[90%] bg-neutral-900 md:rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row transition-transform duration-700 cubic-bezier(0.16, 1, 0.3, 1) ${item ? 'translate-y-0 scale-100' : 'translate-y-20 scale-95'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-50 p-2 bg-black/50 text-white rounded-full hover:bg-white hover:text-black transition-colors backdrop-blur-md"
        >
          <X size={24} />
        </button>

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
