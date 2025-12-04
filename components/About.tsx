import React, { useEffect, useRef } from 'react';

interface AboutProps {
  theme: 'day' | 'night';
}

const About: React.FC<AboutProps> = ({ theme }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999, radius: 100 });
  const scrollRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let textWidth = 0;

    // Particle Class
    class Particle {
      x: number;
      y: number;
      originX: number;
      originY: number;
      size: number;
      color: string;
      vx: number;
      vy: number;
      friction: number;
      ease: number;
      dx: number;
      dy: number;
      distance: number;
      force: number;
      angle: number;
      char: string;

      constructor(x: number, y: number, size: number) {
        this.x = x; // World position
        this.y = y; // World position
        this.originX = x;
        this.originY = y;
        this.size = size;
        this.color = theme === 'day' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)';
        this.vx = 0;
        this.vy = 0;
        this.friction = 0.95;
        this.ease = 0.1;
        this.dx = 0;
        this.dy = 0;
        this.distance = 0;
        this.force = 0;
        this.angle = 0;
        this.char = Math.random() > 0.5 ? '0' : '1';
      }

      draw() {
        if (!ctx) return;
        // Apply scroll offset
        const screenX = this.x + scrollRef.current.x;
        const screenY = this.y + scrollRef.current.y;

        // Only draw if visible
        if (screenX > -50 && screenX < canvas!.width + 50 && screenY > -50 && screenY < canvas!.height + 50) {
          ctx.fillStyle = this.color;
          ctx.font = `${this.size}px monospace`;
          ctx.fillText(this.char, screenX, screenY);
        }
      }

      update() {
        // Calculate screen position for interaction
        const screenX = this.x + scrollRef.current.x;
        const screenY = this.y + scrollRef.current.y;

        this.dx = mouseRef.current.x - screenX;
        this.dy = mouseRef.current.y - screenY;
        this.distance = this.dx * this.dx + this.dy * this.dy;
        const forceRadius = mouseRef.current.radius * mouseRef.current.radius;

        if (this.distance < forceRadius) {
          this.angle = Math.atan2(this.dy, this.dx);
          this.force = -forceRadius / this.distance;

          const randomAngle = this.angle + (Math.random() - 0.5) * 1.5;
          const pushX = Math.cos(randomAngle) * this.force * 5;
          const pushY = Math.sin(randomAngle) * this.force * 5;

          this.vx += pushX;
          this.vy += pushY;
        }

        this.x += (this.originX - this.x) * this.ease;
        this.y += (this.originY - this.y) * this.ease;

        this.x += this.vx;
        this.y += this.vy;

        this.vx *= this.friction;
        this.vy *= this.friction;
      }
    }

    // Config state to share with event handlers
    let maxScrollX = 0;
    let maxScrollY = 0;

    const init = () => {
      particles = [];
      const width = canvas.width;
      const height = canvas.height;
      const isMobile = width < 768;

      // Configuration based on device - INCREASED DENSITY (Round 2)
      const particleSize = isMobile ? 6 : 8; // Even smaller particles
      const gap = isMobile ? 7 : 9; // Even tighter gap

      // Font size for negative space text
      const fontSize = isMobile
        ? Math.min(width / 4, 120)
        : Math.min(Math.max(width / 8, 80), 200);

      const text = "이공일 李空一 Gong Il Lee";

      // Measure text first
      ctx.font = `900 ${fontSize}px sans-serif`;
      const textMetrics = ctx.measureText(text);
      const textWidth = textMetrics.width;

      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      // Make temp canvas large enough to hold the text plus some padding
      // CRITICAL: Round to integer
      const contentWidth = Math.ceil(Math.max(width, textWidth + 100));

      tempCanvas.width = contentWidth;
      tempCanvas.height = height;

      tempCtx.font = `900 ${fontSize}px sans-serif`;
      tempCtx.fillStyle = 'white';
      tempCtx.textAlign = 'center';
      tempCtx.textBaseline = 'middle';

      const centerX = contentWidth / 2;
      const centerY = height / 2;
      tempCtx.fillText(text, centerX, centerY);

      const imageData = tempCtx.getImageData(0, 0, contentWidth, height);

      // Calculate maxScrollX
      const bufferX = width * 0.5;
      maxScrollX = Math.max((contentWidth - width) / 2, 0) + bufferX;

      // Calculate maxScrollY
      const bufferY = height * 0.5;
      maxScrollY = bufferY;

      const offsetX = (width - contentWidth) / 2;

      // Generate particles
      // Range to generate in World Space:
      const worldMinX = -maxScrollX;
      const worldMaxX = width + maxScrollX;
      const worldMinY = -maxScrollY;
      const worldMaxY = height + maxScrollY;

      for (let y = worldMinY; y < worldMaxY; y += gap) {
        for (let x = worldMinX; x < worldMaxX; x += gap) {
          let shouldAddParticle = true;

          // Map World X to TempCanvas X to check for text
          const tempX = x - offsetX;
          // Map World Y to TempCanvas Y (no offset needed as height matches)
          // Actually, since we generate particles outside [0, height], we need to check bounds
          const tempY = y;

          // Check if we are within the tempCanvas bounds
          if (tempX >= 0 && tempX < contentWidth && tempY >= 0 && tempY < height) {
            // CRITICAL: Use imageData.width for stride
            const index = (Math.floor(tempY) * imageData.width + Math.floor(tempX)) * 4;
            const alpha = imageData.data[index + 3];
            // If alpha > 128 (Text), DO NOT add particle (Negative Space)
            if (alpha > 128) {
              shouldAddParticle = false;
            }
          }

          if (shouldAddParticle) {
            const randomX = x + (Math.random() - 0.5) * 4;
            const randomY = y + (Math.random() - 0.5) * 4;
            particles.push(new Particle(randomX, randomY, particleSize));
          }
        }
      }

      scrollRef.current.x = 0;
      scrollRef.current.y = 0;
      scrollRef.current.targetX = 0;
      scrollRef.current.targetY = 0;
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Clamp targetX
      if (scrollRef.current.targetX > maxScrollX) scrollRef.current.targetX = maxScrollX;
      if (scrollRef.current.targetX < -maxScrollX) scrollRef.current.targetX = -maxScrollX;

      // Clamp targetY
      if (scrollRef.current.targetY > maxScrollY) scrollRef.current.targetY = maxScrollY;
      if (scrollRef.current.targetY < -maxScrollY) scrollRef.current.targetY = -maxScrollY;

      // Smooth scroll inertia
      scrollRef.current.x += (scrollRef.current.targetX - scrollRef.current.x) * 0.1;
      scrollRef.current.y += (scrollRef.current.targetY - scrollRef.current.y) * 0.1;

      particles.forEach(particle => {
        particle.draw();
        particle.update();
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    };

    let mouseTimeout: NodeJS.Timeout;

    const resetMouse = () => {
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
    };

    const handleMouseDown = (e: MouseEvent | TouchEvent) => {
      isDragging.current = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      lastPos.current.x = clientX;
      lastPos.current.y = clientY;

      mouseRef.current.x = clientX;
      mouseRef.current.y = clientY;

      clearTimeout(mouseTimeout);
      mouseTimeout = setTimeout(resetMouse, 500);
    };

    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      mouseRef.current.x = clientX;
      mouseRef.current.y = clientY;
      clearTimeout(mouseTimeout);
      mouseTimeout = setTimeout(resetMouse, 500);

      if (isDragging.current) {
        const dx = clientX - lastPos.current.x;
        const dy = clientY - lastPos.current.y;

        scrollRef.current.targetX += dx;
        scrollRef.current.targetY += dy;

        lastPos.current.x = clientX;
        lastPos.current.y = clientY;
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    // Initial setup
    handleResize();
    animate();

    window.addEventListener('resize', handleResize);

    // Mouse Events
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Touch Events
    window.addEventListener('touchstart', handleMouseDown);
    window.addEventListener('touchmove', handleMouseMove);
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchstart', handleMouseDown);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
      cancelAnimationFrame(animationFrameId);
      clearTimeout(mouseTimeout);
    };
  }, [theme]);

  return (
    <div className={`fixed inset-0 ${theme === 'day' ? 'bg-white' : 'bg-black'} z-20 cursor-grab active:cursor-grabbing`}>
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};

export default About;
