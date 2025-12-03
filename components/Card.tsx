import React, { memo } from 'react';
import { GridItem } from '../types';
import { LayoutParams } from '../hooks/useResponsiveLayout';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

interface CardProps {
  item: GridItem;
  layout: LayoutParams;
  scrollY: number;
  onClick: (item: GridItem) => void;
  theme: 'day' | 'night';
}

const Card: React.FC<CardProps> = memo(({ item, layout, scrollY, onClick, theme }) => {
  // Calculate 3D position on cylinder
  // x is angle (rotateY)
  // y is vertical height (translateY)
  // z is fixed radius (translateZ)

  const rotateY = item.col * layout.angleStep;

  // Vertical Wrapping Logic
  const rowHeight = layout.cardHeight + layout.gapY;
  const totalHeight = layout.rowCount * rowHeight;

  // Calculate base position
  const baseTranslateY = item.row * rowHeight;

  // Apply scroll and wrap
  // We add totalHeight multiple times to ensure positive modulo result
  let effectiveTranslateY = (baseTranslateY + scrollY) % totalHeight;
  if (effectiveTranslateY < 0) effectiveTranslateY += totalHeight;

  // Center the wrapping:
  // We want rows to appear from -totalHeight/2 to +totalHeight/2 relative to the center
  // But standard modulo gives 0 to totalHeight.
  // Let's shift it so 0 is at the top of the "cylinder" view
  // Actually, standard modulo 0..totalHeight is fine if we center the container or adjust here.
  // Let's adjust so that items wrap around the visual center.

  if (effectiveTranslateY > totalHeight / 2) {
    effectiveTranslateY -= totalHeight;
  }

  const style: React.CSSProperties = {
    transform: `rotateY(${rotateY}deg) translateY(${effectiveTranslateY}px) translateZ(${layout.radius}px)`,
    width: `${layout.cardWidth}px`,
    height: `${layout.cardHeight}px`,
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginTop: -layout.cardHeight / 2,
    marginLeft: -layout.cardWidth / 2,
    // Ensure the card faces the center properly
    backfaceVisibility: 'hidden',
  };

  const containerClass = theme === 'day'
    ? "relative w-full h-full overflow-hidden rounded-lg shadow-2xl transform transition-all duration-300 group-hover:scale-[1.03]"
    : "relative w-full h-full overflow-hidden bg-neutral-900 rounded-lg shadow-2xl transform transition-all duration-300 group-hover:scale-[1.03] border border-white/5 group-hover:border-white/20";

  // Lazy Loading Logic
  // We use a margin to start loading slightly before it enters the viewport
  const { ref, isVisible } = useIntersectionObserver({
    rootMargin: '200px',
    freezeOnceVisible: false // We want to unload videos when they go out of view to save memory
  });

  return (
    <div
      ref={ref}
      className="group absolute cursor-pointer select-none"
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        onClick(item);
      }}
    >
      <div className={containerClass}>

        {/* Media Container */}
        <div className="w-full h-full overflow-hidden relative bg-black">
          {item.mediaType === 'video' ? (
            isVisible ? (
              <video
                src={item.imageUrl}
                className="w-full h-full object-cover grayscale transition-all duration-700 ease-in-out group-hover:grayscale-0 group-hover:scale-110"
                autoPlay
                muted
                loop
                playsInline
                controlsList="nodownload"
                onContextMenu={(e) => e.preventDefault()}
              />
            ) : (
              // Placeholder for video when not visible
              <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                <span className="text-white/20 text-xs">LOADING</span>
              </div>
            )
          ) : item.mediaType === 'audio' ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-900 group-hover:bg-neutral-800 transition-colors">
              <div className="flex items-end gap-1 h-12 mb-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 bg-white/50 animate-pulse"
                    style={{
                      height: `${Math.random() * 100}%`,
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: '0.8s'
                    }}
                  />
                ))}
              </div>
              <span className="text-xs font-mono text-white/50 tracking-widest">AUDIO</span>
              {isVisible && (
                <audio
                  src={item.imageUrl}
                  controls
                  controlsList="nodownload"
                  className="absolute bottom-4 left-4 right-4 w-[calc(100%-2rem)] opacity-0 group-hover:opacity-100 transition-opacity"
                  onContextMenu={(e) => e.preventDefault()}
                />
              )}
            </div>
          ) : (
            <img
              src={item.imageUrl}
              alt={item.title}
              loading="lazy"
              className="w-full h-full object-cover grayscale transition-all duration-700 ease-in-out group-hover:grayscale-0 group-hover:scale-110"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
            />
          )}
          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500 pointer-events-none" />
        </div>
      </div>
    </div>
  );
});

export default Card;
