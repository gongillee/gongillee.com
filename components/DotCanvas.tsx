import React, { useEffect, useRef, useCallback } from 'react';
import { PROJECTS_DATA, getMediaUrl } from '../constants';

interface DotCanvasProps {
  theme: 'day' | 'night';
  onDotClick: (imageUrl: string, mediaType: 'image' | 'video' | 'audio') => void;
}

interface DotData {
  // World position (origin)
  originX: number;
  originY: number;
  // Current position (with physics)
  x: number;
  y: number;
  vx: number;
  vy: number;
  // Assigned media
  imageUrl: string;
  mediaType: 'image' | 'video' | 'audio';
  src: string;
  // Preloaded image for rendering
  img: HTMLImageElement | null;
  imgLoaded: boolean;
  // State
  size: number;
}

const DotCanvas: React.FC<DotCanvasProps> = ({ theme, onDotClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<DotData[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const scrollRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const lastPos = useRef({ x: 0, y: 0 });
  const hoveredDot = useRef<DotData | null>(null);
  const tappedDot = useRef<DotData | null>(null); // Mobile: pinned preview dot
  const maxScrollRef = useRef({ x: 0, y: 0 });
  const animFrameRef = useRef<number>(0);

  // Track actual drag distance to distinguish click from drag
  const totalDragDist = useRef(0);
  const isTouchDevice = useRef(false);

  const initDots = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const width = canvas.width;
    const height = canvas.height;
    const isMobile = width < 768;

    const dotSize = isMobile ? 4 : 8;
    const gap = isMobile ? 5 : 10;

    // Three lines of text, rendered vertically
    const lines = ['이공일', '李空一', 'Gong Il Lee'];
    const fontSize = isMobile
      ? Math.min(width / 3.5, 80)
      : Math.min(Math.max(width / 10, 60), 160);
    const lineHeight = fontSize * 1.3;
    const totalTextHeight = lines.length * lineHeight;

    // Measure max text width across all lines
    ctx.font = `900 ${fontSize}px sans-serif`;
    let maxTextWidth = 0;
    for (const line of lines) {
      const w = ctx.measureText(line).width;
      if (w > maxTextWidth) maxTextWidth = w;
    }

    // Temp canvas to rasterize multi-line text
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    const contentWidth = Math.ceil(Math.max(width, maxTextWidth + 200));
    const contentHeight = Math.ceil(Math.max(height, totalTextHeight + 200));
    tempCanvas.width = contentWidth;
    tempCanvas.height = contentHeight;

    tempCtx.font = `900 ${fontSize}px sans-serif`;
    tempCtx.fillStyle = 'white';
    tempCtx.textAlign = 'center';
    tempCtx.textBaseline = 'middle';

    // Draw each line centered vertically
    const startY = contentHeight / 2 - totalTextHeight / 2 + lineHeight / 2;
    for (let i = 0; i < lines.length; i++) {
      tempCtx.fillText(lines[i], contentWidth / 2, startY + i * lineHeight);
    }

    const imageData = tempCtx.getImageData(0, 0, contentWidth, contentHeight);

    // Calculate scroll bounds
    const bufferX = width * 0.2;
    const bufferY = height * 0.3;
    maxScrollRef.current.x = Math.max((contentWidth - width) / 2, 0) + bufferX;
    maxScrollRef.current.y = Math.max((contentHeight - height) / 2, 0) + bufferY;

    const offsetX = (width - contentWidth) / 2;
    const offsetY = (height - contentHeight) / 2;

    // Get all image projects for assignment
    const imageProjects = PROJECTS_DATA.filter(p => p.mediaType === 'image');

    // Collect dot positions where text IS present (positive space)
    const dots: DotData[] = [];
    let projectIndex = 0;

    const scanMinX = Math.floor(-maxScrollRef.current.x);
    const scanMaxX = Math.ceil(width + maxScrollRef.current.x);
    const scanMinY = Math.floor(-maxScrollRef.current.y);
    const scanMaxY = Math.ceil(height + maxScrollRef.current.y);

    for (let y = scanMinY; y < scanMaxY; y += gap) {
      for (let x = scanMinX; x < scanMaxX; x += gap) {
        // Map to temp canvas coordinates
        const tempX = x - offsetX;
        const tempY = y - offsetY;

        if (tempX >= 0 && tempX < contentWidth && tempY >= 0 && tempY < contentHeight) {
          const index = (Math.floor(tempY) * imageData.width + Math.floor(tempX)) * 4;
          const alpha = imageData.data[index + 3];

          // If alpha > 128, this pixel is part of the text → add a dot
          if (alpha > 128) {
            const project = imageProjects[projectIndex % imageProjects.length];
            const url = getMediaUrl(project.mediaType, projectIndex, project.src);
            projectIndex++;

            dots.push({
              originX: x,
              originY: y,
              x: x + (Math.random() - 0.5) * 3,
              y: y + (Math.random() - 0.5) * 3,
              vx: 0,
              vy: 0,
              imageUrl: url,
              mediaType: project.mediaType,
              src: project.src || '',
              img: null,
              imgLoaded: false,
              size: dotSize,
            });
          }
        }
      }
    }

    dotsRef.current = dots;

    // Reset scroll
    scrollRef.current = { x: 0, y: 0, targetX: 0, targetY: 0 };
  }, []);

  useEffect(() => {
    initDots();

    const handleResize = () => initDots();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initDots]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dotColor = theme === 'day' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)';
    const dotHoverColor = theme === 'day' ? 'rgba(0,0,0,1)' : 'rgba(255,255,255,1)';

    const FRICTION = 0.92;
    const EASE = 0.08;
    const MOUSE_RADIUS = 80;
    const MOUSE_RADIUS_SQ = MOUSE_RADIUS * MOUSE_RADIUS;

    let currentHovered: DotData | null = null;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // On touch devices, use tappedDot as the "hovered" dot
      const pinnedDot = isTouchDevice.current ? tappedDot.current : null;

      // Clamp scroll targets
      const maxX = maxScrollRef.current.x;
      const maxY = maxScrollRef.current.y;
      scrollRef.current.targetX = Math.max(-maxX, Math.min(maxX, scrollRef.current.targetX));
      scrollRef.current.targetY = Math.max(-maxY, Math.min(maxY, scrollRef.current.targetY));

      // Smooth scroll
      scrollRef.current.x += (scrollRef.current.targetX - scrollRef.current.x) * 0.1;
      scrollRef.current.y += (scrollRef.current.targetY - scrollRef.current.y) * 0.1;

      const sx = scrollRef.current.x;
      const sy = scrollRef.current.y;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      let closestDot: DotData | null = null;
      let closestDistSq = Infinity;

      const dots = dotsRef.current;

      // First pass: find the closest dot to mouse (based on origin position)
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        const screenX = dot.originX + sx;
        const screenY = dot.originY + sy;
        if (screenX < -20 || screenX > canvas.width + 20 || screenY < -20 || screenY > canvas.height + 20) continue;
        const dx = mx - screenX;
        const dy = my - screenY;
        const distSq = dx * dx + dy * dy;
        if (distSq < closestDistSq && distSq < 30 * 30) {
          closestDistSq = distSq;
          closestDot = dot;
        }
      }

      // Second pass: update physics and draw
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];

        // Screen position
        const screenX = dot.x + sx;
        const screenY = dot.y + sy;

        // Culling: skip if off-screen
        if (screenX < -20 || screenX > canvas.width + 20 || screenY < -20 || screenY > canvas.height + 20) {
          continue;
        }

        // Mouse interaction: repel dots, but NOT the closest (hovered) dot
        if (dot !== closestDot) {
          const dx = mx - screenX;
          const dy = my - screenY;
          const distSq = dx * dx + dy * dy;

          if (distSq < MOUSE_RADIUS_SQ && distSq > 0) {
            const angle = Math.atan2(dy, dx);
            const force = -MOUSE_RADIUS_SQ / distSq;
            dot.vx += Math.cos(angle) * force * 0.3;
            dot.vy += Math.sin(angle) * force * 0.3;
          }
        }

        // Spring back to origin
        dot.x += (dot.originX - dot.x) * EASE;
        dot.y += (dot.originY - dot.y) * EASE;
        dot.x += dot.vx;
        dot.y += dot.vy;
        dot.vx *= FRICTION;
        dot.vy *= FRICTION;

        // Draw dot
        const isHovered = dot === closestDot || dot === pinnedDot;
        const size = isHovered ? dot.size * 1.8 : dot.size;

        // Draw as image thumbnail if loaded, otherwise as circle
        if (isHovered && dot.imgLoaded && dot.img) {
          const previewSize = 40;
          ctx.save();
          ctx.beginPath();
          ctx.arc(screenX, screenY, previewSize / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(dot.img, screenX - previewSize / 2, screenY - previewSize / 2, previewSize, previewSize);
          ctx.restore();
        } else {
          ctx.fillStyle = isHovered ? dotHoverColor : dotColor;
          ctx.beginPath();
          ctx.arc(screenX, screenY, size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Update hover state
      if (closestDot !== currentHovered) {
        currentHovered = closestDot;
        hoveredDot.current = closestDot;

        const dotToPreload = closestDot || pinnedDot;
        if (dotToPreload) {
          // Lazy-load image for this dot
          if (!dotToPreload.img && dotToPreload.mediaType === 'image') {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              dotToPreload!.img = img;
              dotToPreload!.imgLoaded = true;
            };
            img.src = dotToPreload.imageUrl;
            dotToPreload.img = img; // mark as loading (prevents re-requesting)
          }
        }
      }

      // Also preload pinned dot if different
      if (pinnedDot && !pinnedDot.img && pinnedDot.mediaType === 'image') {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          pinnedDot!.img = img;
          pinnedDot!.imgLoaded = true;
        };
        img.src = pinnedDot.imageUrl;
        pinnedDot.img = img;
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [theme]);

  // Mouse/Touch handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      totalDragDist.current = 0;
      dragStart.current = { x: e.clientX, y: e.clientY };
      lastPos.current = { x: e.clientX, y: e.clientY };
      canvas.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };

      if (isDragging.current) {
        const dx = e.clientX - lastPos.current.x;
        const dy = e.clientY - lastPos.current.y;
        totalDragDist.current += Math.abs(dx) + Math.abs(dy);
        scrollRef.current.targetX += dx;
        scrollRef.current.targetY += dy;
        lastPos.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      isDragging.current = false;
      canvas.style.cursor = 'default';

      // Click (not drag) → open image
      if (totalDragDist.current < 10 && hoveredDot.current) {
        const dot = hoveredDot.current;
        onDotClick(dot.imageUrl, dot.mediaType);
      }
    };

    const handleMouseLeave = () => {
      isDragging.current = false;
      mouseRef.current = { x: -9999, y: -9999 };
      canvas.style.cursor = 'default';
    };

    // Touch support — two-step interaction:
    // 1st tap: show preview on dot
    // 2nd tap on same dot: open modal
    // Tap on different dot: switch preview
    // Drag: scroll (dismiss preview)
    const findClosestDotAtPoint = (cx: number, cy: number): DotData | null => {
      const sx = scrollRef.current.x;
      const sy = scrollRef.current.y;
      let closest: DotData | null = null;
      let closestDistSq = 30 * 30; // max distance threshold
      for (const dot of dotsRef.current) {
        const screenX = dot.originX + sx;
        const screenY = dot.originY + sy;
        const dx = cx - screenX;
        const dy = cy - screenY;
        const distSq = dx * dx + dy * dy;
        if (distSq < closestDistSq) {
          closestDistSq = distSq;
          closest = dot;
        }
      }
      return closest;
    };

    const handleTouchStart = (e: TouchEvent) => {
      isTouchDevice.current = true;
      const touch = e.touches[0];
      isDragging.current = true;
      totalDragDist.current = 0;
      dragStart.current = { x: touch.clientX, y: touch.clientY };
      lastPos.current = { x: touch.clientX, y: touch.clientY };
      // Don't set mouseRef here — no repel effect on touch start
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];

      if (isDragging.current) {
        const dx = touch.clientX - lastPos.current.x;
        const dy = touch.clientY - lastPos.current.y;
        totalDragDist.current += Math.abs(dx) + Math.abs(dy);
        scrollRef.current.targetX += dx;
        scrollRef.current.targetY += dy;
        lastPos.current = { x: touch.clientX, y: touch.clientY };
      }
    };

    const handleTouchEnd = () => {
      isDragging.current = false;

      if (totalDragDist.current < 10) {
        // It was a tap, not a drag
        const tapX = dragStart.current.x;
        const tapY = dragStart.current.y;
        const tappedOnDot = findClosestDotAtPoint(tapX, tapY);

        if (tappedOnDot) {
          if (tappedDot.current === tappedOnDot) {
            // Second tap on same dot → open modal
            onDotClick(tappedOnDot.imageUrl, tappedOnDot.mediaType);
            tappedDot.current = null;
          } else {
            // First tap or different dot → show preview
            tappedDot.current = tappedOnDot;
          }
        } else {
          // Tapped on empty area → dismiss preview
          tappedDot.current = null;
        }
      } else {
        // Was a drag → dismiss preview
        tappedDot.current = null;
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onDotClick]);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  );
};

export default DotCanvas;
