import React from 'react';
import { GridItem } from '../types';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

interface ListViewProps {
    items: GridItem[];
    theme: 'day' | 'night';
    onItemClick: (item: GridItem) => void;
}

interface ListItemProps {
    item: GridItem;
    theme: 'day' | 'night';
    onItemClick: (item: GridItem) => void;
}

const ListItem: React.FC<ListItemProps> = ({ item, theme, onItemClick }) => {
    const borderColor = theme === 'day' ? 'border-gray-200' : 'border-gray-800';
    const hoverBg = theme === 'day' ? 'hover:bg-gray-100' : 'hover:bg-gray-900';
    const subTextColor = theme === 'day' ? 'text-gray-600' : 'text-gray-400';

    const { ref, isVisible } = useIntersectionObserver({
        rootMargin: '100px',
        freezeOnceVisible: false
    });

    const videoRef = React.useRef<HTMLVideoElement>(null);

    React.useEffect(() => {
        if (item.mediaType === 'video' && videoRef.current) {
            if (isVisible) {
                videoRef.current.play().catch(() => { });
            } else {
                videoRef.current.pause();
            }
        }
    }, [isVisible, item.mediaType]);

    return (
        <div
            ref={ref}
            onClick={() => onItemClick(item)}
            className={`flex items-center gap-6 p-4 border-b ${borderColor} ${hoverBg} transition-colors cursor-pointer group`}
        >
            <div className="w-24 h-16 md:w-48 md:h-32 flex-shrink-0 overflow-hidden rounded-md bg-gray-800 flex items-center justify-center">
                {item.mediaType === 'video' ? (
                    <video
                        ref={videoRef}
                        src={item.previewUrl ?? item.imageUrl}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        onMouseOver={e => e.currentTarget.play()}
                        onMouseOut={e => {
                            // Only pause if not visible (handled by effect) or if we want hover-only behavior?
                            // The original code had hover behavior.
                            // But now we have auto-play when visible.
                            // Let's keep hover behavior as an "extra" but the base is visibility.
                            // Actually, if we auto-play when visible, hover play is redundant or conflicting.
                            // Let's stick to visibility-based auto-play for consistency with Grid view.
                        }}
                    />
                ) : item.mediaType === 'audio' ? (
                    <div className="flex gap-1 items-end h-8">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="w-1 bg-white/50 animate-pulse h-full" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                    </div>
                ) : (
                    <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between mb-1">
                    <h3 className="text-xl md:text-2xl font-light truncate">{item.title}</h3>
                    <span className={`text-xs md:text-sm ${subTextColor} font-mono`}>{item.year}</span>
                </div>
                <p className={`text-sm md:text-base ${subTextColor} truncate`}>{item.client} — {item.type}</p>
            </div>
        </div>
    );
};

const ListView: React.FC<ListViewProps> = ({ items, theme, onItemClick }) => {
    const textColor = theme === 'day' ? 'text-black' : 'text-white';

    return (
        <div className={`w-full h-full overflow-y-auto pt-24 pb-32 px-4 md:px-20 ${textColor}`}>
            <div className="max-w-4xl mx-auto space-y-4">
                {items.map((item) => (
                    <ListItem
                        key={item.id}
                        item={item}
                        theme={theme}
                        onItemClick={onItemClick}
                    />
                ))}
            </div>
        </div>
    );
};

export default ListView;
