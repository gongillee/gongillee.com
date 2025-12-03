import React, { useEffect, useRef } from 'react';

interface AboutProps {
  theme: 'day' | 'night';
}

const About: React.FC<AboutProps> = ({ theme }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999, radius: 100 });
  const scrollRef = useRef({ x: 0, targetX: 0 });
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0 });

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

      constructor(x: number, y: number) {
        this.x = x; // World position
        this.y = y; // World position
        this.originX = x;
        this.originY = y;
        this.size = 1.2;
        this.color = theme === 'day' ? 'black' : 'white';
        this.vx = 0;
        this.vy = 0;
        this.friction = 0.98;
        this.ease = 0.05;
        this.dx = 0;
        this.dy = 0;
        this.distance = 0;
        this.force = 0;
        this.angle = 0;
      }

      draw() {
        if (!ctx) return;
        // Apply scroll offset
        const screenX = this.x + scrollRef.current.x;

        // Only draw if visible
        if (screenX > -50 && screenX < canvas!.width + 50) {
          ctx.fillStyle = this.color;
          ctx.fillRect(screenX, this.y, this.size, this.size);
        }
      }

      update() {
        // Calculate screen position for interaction
        const screenX = this.x + scrollRef.current.x;

        this.dx = mouseRef.current.x - screenX;
        this.dy = mouseRef.current.y - this.y;
        this.distance = this.dx * this.dx + this.dy * this.dy;
        const forceRadius = mouseRef.current.radius * mouseRef.current.radius;

        if (this.distance < forceRadius) {
          this.angle = Math.atan2(this.dy, this.dx);
          this.force = -forceRadius / this.distance;

          // Add randomness to angle for "scatter" effect
          const randomAngle = this.angle + (Math.random() - 0.5) * 1.5;

          const pushX = Math.cos(randomAngle) * this.force * 2;
          const pushY = Math.sin(randomAngle) * this.force * 2;

          this.vx += pushX;
          this.vy += pushY;
        }

        // Return to origin
        this.x += (this.originX - this.x) * this.ease;
        this.y += (this.originY - this.y) * this.ease;

        // Jitter
        this.x += (Math.random() - 0.5) * 0.5;
        this.y += (Math.random() - 0.5) * 0.5;

        this.x += this.vx;
        this.y += this.vy;

        this.vx *= this.friction;
        this.vy *= this.friction;
      }
    }

    const init = () => {
      particles = [];
      const width = canvas.width;
      const height = canvas.height;

      const fontSize = Math.min(Math.max(width / 10, 50), 150);
      ctx.font = `100 ${fontSize}px sans-serif`;
      ctx.fillStyle = theme === 'day' ? 'black' : 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const text = "이공일 李空一 Gong Il Lee";
      textWidth = ctx.measureText(text).width;

      // We need a temporary canvas to sample text that might be wider than screen
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      // Make temp canvas large enough
      tempCanvas.width = Math.max(width, textWidth + 200);
      tempCanvas.height = height;

      tempCtx.font = `100 ${fontSize}px sans-serif`;
      tempCtx.fillStyle = theme === 'day' ? 'black' : 'white';
      tempCtx.textAlign = 'center';
      tempCtx.textBaseline = 'middle';

      // Draw text in center of temp canvas
      const centerX = tempCanvas.width / 2;
      const centerY = height / 2;
      tempCtx.fillText(text, centerX, centerY);

      const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, height);
      const gap = 3;

      // Offset to center the text block in the real world coordinates
      // We want the center of the text to be at width/2 of the real canvas
      const offsetX = (width / 2) - centerX;

      for (let y = 0; y < height; y += gap) {
        for (let x = 0; x < tempCanvas.width; x += gap) {
          const index = (y * tempCanvas.width + x) * 4;
          const alpha = imageData.data[index + 3];
          if (alpha > 0) {
            // Create particle with World Coordinate
            particles.push(new Particle(x + offsetX, y));
          }
        }
      }

      // Initial scroll: 0 (centered)
      scrollRef.current.x = 0;
      scrollRef.current.targetX = 0;
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Smooth scroll inertia
      scrollRef.current.x += (scrollRef.current.targetX - scrollRef.current.x) * 0.1;

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
      lastPos.current.x = clientX;

      // Also trigger interaction
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      mouseRef.current.x = clientX;
      mouseRef.current.y = clientY;

      clearTimeout(mouseTimeout);
      mouseTimeout = setTimeout(resetMouse, 500);
    };

    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      // Interaction
      mouseRef.current.x = clientX;
      mouseRef.current.y = clientY;
      clearTimeout(mouseTimeout);
      mouseTimeout = setTimeout(resetMouse, 500);

      // Panning
      if (isDragging.current) {
        const dx = clientX - lastPos.current.x;
        scrollRef.current.targetX += dx;
        lastPos.current.x = clientX;
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
