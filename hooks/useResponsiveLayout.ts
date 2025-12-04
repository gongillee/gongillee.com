import { useState, useEffect } from 'react';
import { CARD_WIDTH, CARD_HEIGHT, GAP_Y, RADIUS } from '../constants';

export interface LayoutParams {
    cardWidth: number;
    cardHeight: number;
    gapY: number;
    radius: number;
    angleStep: number;
    rowCount: number;
    colCount: number;
}

export const useResponsiveLayout = () => {
    const [layout, setLayout] = useState<LayoutParams>({
        cardWidth: CARD_WIDTH,
        cardHeight: CARD_HEIGHT,
        gapY: GAP_Y,
        radius: RADIUS,
        angleStep: 15, // Initial placeholder
        rowCount: 6,
        colCount: 24,
    });

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            let newLayout: Partial<LayoutParams> = {};

            if (width < 768) {
                // Mobile
                newLayout = {
                    cardWidth: 200,
                    cardHeight: 200,
                    gapY: 20,
                    radius: 700,
                    rowCount: 6,
                    colCount: 20, // Adjust col count for mobile radius
                };
            } else if (width < 1024) {
                // Tablet
                newLayout = {
                    cardWidth: 250,
                    cardHeight: 250,
                    gapY: 30,
                    radius: 1070,
                    rowCount: 6,
                    colCount: 24,
                };
            } else {
                // Desktop
                newLayout = {
                    cardWidth: CARD_WIDTH,
                    cardHeight: CARD_HEIGHT,
                    gapY: GAP_Y,
                    radius: RADIUS,
                    rowCount: 6,
                    colCount: 24,
                };
            }

            // Calculate angleStep to ensure perfect 360 loop
            // We want cols * angleStep = 360
            // So angleStep = 360 / colCount
            newLayout.angleStep = 360 / (newLayout.colCount || 24);

            setLayout(prev => ({ ...prev, ...newLayout } as LayoutParams));
        };

        handleResize(); // Initial call
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return layout;
};
