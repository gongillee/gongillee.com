import React, { useRef, useState, useEffect, useCallback } from 'react';
import Card from './components/Card';
import Modal from './components/Modal';
import HUD from './components/HUD';
import { generateGridItems, PROJECTS_DATA, getMediaUrl } from './constants';
import { GridItem } from './types';
import { useResponsiveLayout } from './hooks/useResponsiveLayout';

// Cylinder Config
const INITIAL_ROWS = 6;
const INITIAL_COLS = 24; // Needs enough cols to form a full circle or large arc

import About from './components/About';
import ListView from './components/ListView';

const App: React.FC = () => {
  const layout = useResponsiveLayout();

  // Separate state for 3D grid (full fill) and List view (unique items)
  const [gridItems, setGridItems] = useState<GridItem[]>([]);
  const [listItems, setListItems] = useState<GridItem[]>([]);

  const [view, setView] = useState<'archive' | 'about'>('archive');
  const [theme, setTheme] = useState<'day' | 'night'>('night');
  const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'audio'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Data Generation Logic
  useEffect(() => {
    // 1. Determine relevant source data based on filter
    let sourceData = PROJECTS_DATA;
    if (filter !== 'all') {
      sourceData = PROJECTS_DATA.filter(item => item.mediaType === filter);
    }

    // 2. Generate Grid Items (Full Cylinder)
    // We pass the filtered sourceData to generateGridItems, which will repeat items to fill the grid
    const newGridItems = generateGridItems(layout.rowCount, layout.colCount, true, sourceData);
    setGridItems(newGridItems);

    // 3. Generate List Items (Unique & Random Order)
    // Shuffle sourceData for list view
    const shuffledSource = [...sourceData];
    for (let i = shuffledSource.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledSource[i], shuffledSource[j]] = [shuffledSource[j], shuffledSource[i]];
    }

    const newListItems = shuffledSource.map((data, index) => {
      const url = getMediaUrl(data.mediaType, index, data.src);

      return {
        ...data,
        id: `list-${index}`,
        row: 0,
        col: 0,
        imageUrl: url
      } as GridItem;
    });
    setListItems(newListItems);

  }, [layout.rowCount, layout.colCount, filter]);

  const [selectedItem, setSelectedItem] = useState<GridItem | null>(null);

  // Viewport State
  const [rotationY, setRotationY] = useState(0); // Horizontal rotation (pan)
  const [translateY, setTranslateY] = useState(0); // Vertical scroll

  // Interaction State
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const lastPos = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const animationFrame = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Physics Config
  const FRICTION = 0.92;
  const SENSITIVITY_X = 0.15; // Deg per pixel
  const SENSITIVITY_Y = 1.2; // Px per pixel

  // Render Loop for inertia
  const animate = useCallback(() => {
    if (view !== 'archive' || viewMode === 'list') return; // Stop animation if not in 3D view

    if (!isDragging.current) {
      // Apply inertia
      if (Math.abs(velocity.current.x) > 0.01 || Math.abs(velocity.current.y) > 0.1) {
        setRotationY(prev => prev - velocity.current.x);
        setTranslateY(prev => prev + velocity.current.y);

        velocity.current.x *= FRICTION;
        velocity.current.y *= FRICTION;

        animationFrame.current = requestAnimationFrame(animate);
      } else {
        cancelAnimationFrame(animationFrame.current);
      }
    }
  }, [view, viewMode]);

  useEffect(() => {
    if (view === 'archive' && viewMode === 'grid') {
      // Start animation loop to check for momentum
      animationFrame.current = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(animationFrame.current);
  }, [animate, view, viewMode]);

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

  const handlePointerDown = (e: React.PointerEvent) => {
    if (view !== 'archive' || viewMode === 'list') return;
    isDragging.current = true;
    startPos.current = { x: e.clientX, y: e.clientY };
    lastPos.current = { x: e.clientX, y: e.clientY };
    velocity.current = { x: 0, y: 0 };
    cancelAnimationFrame(animationFrame.current); // Stop inertia when user grabs

    // Set cursor
    if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (view !== 'archive' || viewMode === 'list') return;
    if (!isDragging.current) return;

    e.preventDefault();

    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;

    // Update state based on drag
    // Dragging Left (Negative X) -> Should rotate Right (Positive Angle)
    // Dragging Up (Negative Y) -> Should move Up (Negative Translate) - wait, standard scrolling usually moves content with finger
    // Let's implement "Drag the content": Drag Up -> Content moves Up (Positive Y)

    const rotChange = dx * SENSITIVITY_X;
    const posChange = dy * SENSITIVITY_Y;

    setRotationY(prev => prev + rotChange);
    setTranslateY(prev => prev + posChange);

    // Update velocity for release inertia
    velocity.current = { x: -rotChange, y: posChange }; // Invert X for physics loop logic
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    if (view !== 'archive' || viewMode === 'list') return;
    isDragging.current = false;
    if (containerRef.current) containerRef.current.style.cursor = 'grab';

    // Trigger inertia loop
    animationFrame.current = requestAnimationFrame(animate);
  };

  const handleCardClick = useCallback((item: GridItem) => {
    // Prevent click if it was a drag gesture
    const dist = Math.sqrt(
      Math.pow(lastPos.current.x - startPos.current.x, 2) +
      Math.pow(lastPos.current.y - startPos.current.y, 2)
    );

    if (dist < 10) {
      setSelectedItem(item);
    }
  }, []);

  const handleThemeToggle = () => {
    setTheme(prev => prev === 'day' ? 'night' : 'day');
  };

  const handleFilterChange = () => {
    const filters: ('all' | 'image' | 'video' | 'audio')[] = ['all', 'image', 'video', 'audio'];
    const currentIndex = filters.indexOf(filter);
    const nextIndex = (currentIndex + 1) % filters.length;
    setFilter(filters[nextIndex]);
  };

  const handleViewModeChange = () => {
    setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
  };

  const handleNext = useCallback(() => {
    if (!selectedItem || viewMode !== 'list') return;
    const currentIndex = listItems.findIndex(item => item.id === selectedItem.id);
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + 1) % listItems.length;
    setSelectedItem(listItems[nextIndex]);
  }, [selectedItem, listItems, viewMode]);

  const handlePrev = useCallback(() => {
    if (!selectedItem || viewMode !== 'list') return;
    const currentIndex = listItems.findIndex(item => item.id === selectedItem.id);
    if (currentIndex === -1) return;
    const prevIndex = (currentIndex - 1 + listItems.length) % listItems.length;
    setSelectedItem(listItems[prevIndex]);
  }, [selectedItem, listItems, viewMode]);

  return (
    <div className={`relative w-full h-screen overflow-hidden touch-none select-none transition-colors duration-500 ${theme === 'day' ? 'bg-white' : 'bg-black'}`}>

      <HUD
        currentView={view}
        onViewChange={setView}
        theme={theme}
        onThemeToggle={handleThemeToggle}
        filter={filter}
        onFilterChange={handleFilterChange}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
      />

      {view === 'archive' && (
        <>
          {viewMode === 'grid' ? (
            /* 3D Scene Container */
            <div
              ref={containerRef}
              className="w-full h-full cursor-grab active:cursor-grabbing perspective-container"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              <div
                className="w-full h-full transform-style-3d will-change-transform"
                style={{
                  // Remove global translateY, pass it to cards instead
                  transform: `translateZ(-500px) rotateY(${rotationY}deg)`
                }}
              >
                {gridItems.map(item => (
                  <Card
                    key={item.id}
                    item={item}
                    layout={layout}
                    scrollY={translateY}
                    onClick={handleCardClick}
                    theme={theme}
                  />
                ))}
              </div>
            </div>
          ) : (
            /* List View */
            <ListView
              items={listItems}
              theme={theme}
              onItemClick={setSelectedItem}
            />
          )}

          <Modal
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onNext={viewMode === 'list' ? handleNext : undefined}
            onPrev={viewMode === 'list' ? handlePrev : undefined}
          />
        </>
      )}

      {view === 'about' && <About theme={theme} />}

      <style>{`
        .perspective-container {
          perspective: 2000px; /* Deep perspective for VR feel */
          perspective-origin: 50% 50%;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
      `}</style>
    </div>
  );
};

export default App;
