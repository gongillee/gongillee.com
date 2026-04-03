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
  const zoomRef = useRef(1); // Zoom level
  const pinchStartDist = useRef(0); // For pinch-to-zoom
  const pinchStartZoom = useRef(1);

  // Track actual drag distance to distinguish click from drag
  const totalDragDist = useRef(0);
  const isTouchDevice = useRef(false);

  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 3;
  const PREVIEW_SIZE_DESKTOP = 80;
  const PREVIEW_SIZE_MOBILE = 100;

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

      const zoom = zoomRef.current;
      const sx = scrollRef.current.x;
      const sy = scrollRef.current.y;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      let closestDot: DotData | null = null;
      let closestDistSq = Infinity;

      const dots = dotsRef.current;

      // First pass: find the closest dot to mouse (based on origin position)
      const hitRadius = 30 / zoom; // Adjust hit area for zoom
      const hitRadiusSq = hitRadius * hitRadius;
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        const screenX = (dot.originX + sx) * zoom + cx * (1 - zoom);
        const screenY = (dot.originY + sy) * zoom + cy * (1 - zoom);
        if (screenX < -50 || screenX > canvas.width + 50 || screenY < -50 || screenY > canvas.height + 50) continue;
        const dx = mx - screenX;
        const dy = my - screenY;
        const distSq = dx * dx + dy * dy;
        if (distSq < closestDistSq && distSq < 40 * 40) {
          closestDistSq = distSq;
          closestDot = dot;
        }
      }

      // Second pass: update physics and draw
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];

        // Screen position with zoom
        const screenX = (dot.x + sx) * zoom + cx * (1 - zoom);
        const screenY = (dot.y + sy) * zoom + cy * (1 - zoom);

        // Culling: skip if off-screen
        if (screenX < -50 || screenX > canvas.width + 50 || screenY < -50 || screenY > canvas.height + 50) {
          continue;
        }

        // Mouse/touch interaction: repel dots, but NOT the hovered/pinned dot
        const activeDot = pinnedDot || closestDot;
        if (dot !== activeDot) {
          // Use mouse position for desktop, pinned dot origin for mobile
          const repelX = pinnedDot ? (pinnedDot.originX + sx) : mx;
          const repelY = pinnedDot ? (pinnedDot.originY + sy) : my;
          const dx = repelX - screenX;
          const dy = repelY - screenY;
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
        const baseSize = (isHovered ? dot.size * 1.8 : dot.size) * zoom;

        // Draw as image thumbnail if loaded, otherwise as circle
        if (isHovered && dot.imgLoaded && dot.img) {
          const isMob = canvas.width < 768;
          const previewSize = (isMob ? PREVIEW_SIZE_MOBILE : PREVIEW_SIZE_DESKTOP) * zoom;
          ctx.save();
          ctx.beginPath();
          ctx.arc(screenX, screenY, previewSize / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(dot.img, screenX - previewSize / 2, screenY - previewSize / 2, previewSize, previewSize);
          ctx.restore();
          // Border ring
          ctx.strokeStyle = theme === 'day' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(screenX, screenY, previewSize / 2, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.fillStyle = isHovered ? dotHoverColor : dotColor;
          ctx.beginPath();
          ctx.arc(screenX, screenY, baseSize / 2, 0, Math.PI * 2);
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
      if (isTouchDevice.current) return;
      isDragging.current = true;
      totalDragDist.current = 0;
      dragStart.current = { x: e.clientX, y: e.clientY };
      lastPos.current = { x: e.clientX, y: e.clientY };
      canvas.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isTouchDevice.current) return;
      mouseRef.current = { x: e.clientX, y: e.clientY };

      if (isDragging.current) {
        const dx = e.clientX - lastPos.current.x;
        const dy = e.clientY - lastPos.current.y;
        totalDragDist.current += Math.abs(dx) + Math.abs(dy);
        scrollRef.current.targetX += dx / zoomRef.current;
        scrollRef.current.targetY += dy / zoomRef.current;
        lastPos.current = { x: e.clientX, y: e.clientY };
      }
    };

    // Check if a point is inside the preview circle of a given dot
    const isInsidePreview = (px: number, py: number, dot: DotData): boolean => {
      const sx = scrollRef.current.x;
      const sy = scrollRef.current.y;
      const zoom = zoomRef.current;
      const cvs = canvasRef.current;
      if (!cvs) return false;
      const cxc = cvs.width / 2;
      const cyc = cvs.height / 2;
      const screenX = (dot.originX + sx) * zoom + cxc * (1 - zoom);
      const screenY = (dot.originY + sy) * zoom + cyc * (1 - zoom);
      const isMob = cvs.width < 768;
      const previewR = ((isMob ? PREVIEW_SIZE_MOBILE : PREVIEW_SIZE_DESKTOP) * zoom) / 2;
      const dx = px - screenX;
      const dy = py - screenY;
      return (dx * dx + dy * dy) <= previewR * previewR;
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isTouchDevice.current) return;
      isDragging.current = false;
      canvas.style.cursor = 'default';

      // Click (not drag) on preview circle → open image
      if (totalDragDist.current < 10 && hoveredDot.current && hoveredDot.current.imgLoaded) {
        if (isInsidePreview(e.clientX, e.clientY, hoveredDot.current)) {
          onDotClick(hoveredDot.current.imageUrl, hoveredDot.current.mediaType);
        }
      }
    };

    const handleMouseLeave = () => {
      isDragging.current = false;
      mouseRef.current = { x: -9999, y: -9999 };
      canvas.style.cursor = 'default';
    };

    // Wheel zoom (desktop)
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.001;
      zoomRef.current = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomRef.current + delta));
    };

    // Touch support — two-step interaction:
    // 1st tap: show preview on dot
    // 2nd tap on same dot: open modal
    // Tap on different dot: switch preview
    // Drag: scroll (dismiss preview)
    const findClosestDotAtPoint = (px: number, py: number): DotData | null => {
      const sx = scrollRef.current.x;
      const sy = scrollRef.current.y;
      const zoom = zoomRef.current;
      const cvs = canvasRef.current;
      if (!cvs) return null;
      const cxc = cvs.width / 2;
      const cyc = cvs.height / 2;
      let closest: DotData | null = null;
      let closestDistSq = 40 * 40; // threshold in screen pixels
      for (const dot of dotsRef.current) {
        const screenX = (dot.originX + sx) * zoom + cxc * (1 - zoom);
        const screenY = (dot.originY + sy) * zoom + cyc * (1 - zoom);
        const dx = px - screenX;
        const dy = py - screenY;
        const distSq = dx * dx + dy * dy;
        if (distSq < closestDistSq) {
          closestDistSq = distSq;
          closest = dot;
        }
      }
      return closest;
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault(); // Prevent synthetic mouse events
      isTouchDevice.current = true;
      const touch = e.touches[0];
      isDragging.current = true;
      totalDragDist.current = 0;
      dragStart.current = { x: touch.clientX, y: touch.clientY };
      lastPos.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();

      // Pinch-to-zoom with two fingers
      if (e.touches.length === 2) {
        const t0 = e.touches[0];
        const t1 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
        if (pinchStartDist.current > 0) {
          const scale = dist / pinchStartDist.current;
          zoomRef.current = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, pinchStartZoom.current * scale));
        } else {
          pinchStartDist.current = dist;
          pinchStartZoom.current = zoomRef.current;
        }
        return;
      }

      const touch = e.touches[0];
      if (isDragging.current) {
        const dx = touch.clientX - lastPos.current.x;
        const dy = touch.clientY - lastPos.current.y;
        totalDragDist.current += Math.abs(dx) + Math.abs(dy);
        scrollRef.current.targetX += dx / zoomRef.current;
        scrollRef.current.targetY += dy / zoomRef.current;
        lastPos.current = { x: touch.clientX, y: touch.clientY };
      }
    };

    const handleTouchEnd = () => {
      isDragging.current = false;
      pinchStartDist.current = 0;

      if (totalDragDist.current < 10) {
        // It was a tap, not a drag
        const tapX = dragStart.current.x;
        const tapY = dragStart.current.y;

        // If there's already a pinned preview, check if we tapped on it
        if (tappedDot.current && tappedDot.current.imgLoaded && isInsidePreview(tapX, tapY, tappedDot.current)) {
          // Tapped on the preview circle → open modal
          onDotClick(tappedDot.current.imageUrl, tappedDot.current.mediaType);
          tappedDot.current = null;
          return;
        }

        // Otherwise, find closest dot for new preview
        const tappedOnDot = findClosestDotAtPoint(tapX, tapY);
        if (tappedOnDot) {
          tappedDot.current = tappedOnDot;
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
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('wheel', handleWheel);
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
