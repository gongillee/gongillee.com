import React from 'react';
import { GridItem } from '../types';

interface ListViewProps {
    items: GridItem[];
    theme: 'day' | 'night';
    onItemClick: (item: GridItem) => void;
}

const ListView: React.FC<ListViewProps> = ({ items, theme, onItemClick }) => {
    const textColor = theme === 'day' ? 'text-black' : 'text-white';
    const subTextColor = theme === 'day' ? 'text-gray-600' : 'text-gray-400';
    const borderColor = theme === 'day' ? 'border-gray-200' : 'border-gray-800';
    const hoverBg = theme === 'day' ? 'hover:bg-gray-100' : 'hover:bg-gray-900';

    return (
        <div className={`w-full h-full overflow-y-auto pt-24 pb-32 px-4 md:px-20 ${textColor}`}>
            <div className="max-w-4xl mx-auto space-y-4">
                {items.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => onItemClick(item)}
                        className={`flex items-center gap-6 p-4 border-b ${borderColor} ${hoverBg} transition-colors cursor-pointer group`}
                    >
                        <div className="w-24 h-16 md:w-48 md:h-32 flex-shrink-0 overflow-hidden rounded-md bg-gray-800 flex items-center justify-center">
                            {item.mediaType === 'video' ? (
                                <video
                                    src={item.imageUrl}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    muted
                                    loop
                                    onMouseOver={e => e.currentTarget.play()}
                                    onMouseOut={e => e.currentTarget.pause()}
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
                ))}
            </div>
        </div>
    );
};

export default ListView;
