import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PROJECTS_DATA, getMediaUrl, getThumbUrl } from '../constants';

interface StippleCanvasProps {
  onOpen: (projectIndex: number) => void;
  /** false while the modal is open — pauses keyboard navigation */
  active: boolean;
}

// paper & ink tokens (kept in sync with index.css)
const INK = '#2b2a27';

// Cursor-motion swell: dots near a MOVING cursor grow, then settle back
const SWELL_RADIUS = 110;
const SWELL_DECAY = 0.9;
const SWELL_GAIN = 0.65;
const SWELL_SCALE = 1.3; // max extra size at full energy
const EASE = 0.09; // morph easing between works

interface GridDot {
  ox: number;
  oy: number;
  x: number;
  y: number;
  e: number; // swell energy (0..1), fed by cursor motion
}

// Cover-crop an image-like source onto a w×h luminance grid (0..1)
const sampleLuma = (
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  gw: number,
  gh: number,
  scratch: HTMLCanvasElement
): Float32Array | null => {
  scratch.width = gw;
  scratch.height = gh;
  const ctx = scratch.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  const ia = srcW / srcH;
  const ca = gw / gh;
  let sw: number, sh: number, sx: number, sy: number;
  if (ia > ca) {
    sh = srcH; sw = sh * ca; sx = (srcW - sw) / 2; sy = 0;
  } else {
    sw = srcW; sh = sw / ca; sx = 0; sy = (srcH - sh) / 2;
  }
  try {
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, gw, gh);
    const d = ctx.getImageData(0, 0, gw, gh).data;
    const out = new Float32Array(gw * gh);
    for (let i = 0; i < gw * gh; i++) {
      out[i] = (0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2]) / 255;
    }
    return out;
  } catch {
    return null; // tainted canvas or decode issue
  }
};

// Waveform-style pattern for audio works (seeded, stable per work)
const audioPatternLuma = (gw: number, gh: number, seed: number): Float32Array => {
  const out = new Float32Array(gw * gh).fill(1); // start white
  const midY = gh / 2;
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  let amp = 0.2;
  for (let x = 0; x < gw; x++) {
    // random-walk amplitude with a gentle envelope
    amp = Math.max(0.06, Math.min(1, amp + (rand() - 0.5) * 0.35));
    const envelope = Math.sin((x / gw) * Math.PI) ** 0.6;
    const h = amp * envelope * (gh * 0.42);
    for (let y = 0; y < gh; y++) {
      const dist = Math.abs(y - midY);
      if (dist < h) {
        // darker near the center line
        out[y * gw + x] = Math.min(out[y * gw + x], 0.12 + (dist / h) * 0.55);
      }
    }
  }
  return out;
};

const StippleCanvas: React.FC<StippleCanvasProps> = ({ onOpen, active }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cur, setCur] = useState(() => Math.floor(Math.random() * PROJECTS_DATA.length));
  const [resizeTick, setResizeTick] = useState(0);

  const dotsRef = useRef<GridDot[]>([]);
  const gridRef = useRef({ gw: 0, gh: 0, ox: 0, oy: 0, gap: 6 });
  const lumaRef = useRef<Float32Array | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scratchRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const pointer = useRef({ x: -9999, y: -9999 });
  const dragDist = useRef(0);
  const touchStart = useRef({ x: 0, y: 0 });
  const isTouch = useRef(false);
  const animFrame = useRef(0);
  const frameCount = useRef(0);

  const next = useCallback(() => setCur(c => (c + 1) % PROJECTS_DATA.length), []);
  const prev = useCallback(() => setCur(c => (c - 1 + PROJECTS_DATA.length) % PROJECTS_DATA.length), []);

  // Build the dot grid for a given aspect ratio, morphing from existing dots
  const buildGrid = useCallback((aspect: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width;
    const H = canvas.height;
    const isMobile = W < 768;
    const gap = isMobile ? 5 : 6;

    // stage area: clear of HUD (top) and caption + marquee (bottom)
    const marginX = isMobile ? 28 : 72;
    const marginTop = isMobile ? 90 : 110;
    const marginBottom = isMobile ? 130 : 150;
    const availW = W - marginX * 2;
    const availH = H - marginTop - marginBottom;
    let pw: number, ph: number;
    if (availW / availH > aspect) {
      ph = availH; pw = ph * aspect;
    } else {
      pw = availW; ph = pw / aspect;
    }
    const ox = (W - pw) / 2;
    const oy = marginTop + (availH - ph) / 2;
    const gw = Math.max(1, Math.floor(pw / gap));
    const gh = Math.max(1, Math.floor(ph / gap));

    const old = dotsRef.current;
    const dots: GridDot[] = new Array(gw * gh);
    for (let gy = 0; gy < gh; gy++) {
      for (let gx = 0; gx < gw; gx++) {
        const i = gy * gw + gx;
        const x = ox + gx * gap + gap / 2;
        const y = oy + gy * gap + gap / 2;
        const o = old.length ? old[i % old.length] : null;
        dots[i] = {
          ox: x, oy: y,
          x: o ? o.x : x + (Math.random() - 0.5) * 40,
          y: o ? o.y : y + (Math.random() - 0.5) * 40,
          e: 0,
        };
      }
    }
    dotsRef.current = dots;
    gridRef.current = { gw, gh, ox, oy, gap };
  }, []);

  // Load the current work's stipple source
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    lumaRef.current = null;
    // stop any previous video
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
      videoRef.current = null;
    }

    const p = PROJECTS_DATA[cur];
    const isMobile = canvas.width < 768;
    const maxR = (isMobile ? 5 : 6) * 0.52;

    if (p.mediaType === 'image') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const applyImage = () => {
        const aspect = img.naturalWidth / img.naturalHeight;
        buildGrid(aspect);
        const { gw, gh } = gridRef.current;
        lumaRef.current = sampleLuma(img, img.naturalWidth, img.naturalHeight, gw, gh, scratchRef.current);
      };
      img.onload = applyImage;
      img.onerror = () => {
        const full = getMediaUrl('image', cur, p.src);
        if (!img.src.endsWith(full)) img.src = full;
      };
      img.src = getThumbUrl(p.src) || getMediaUrl('image', cur, p.src);
    } else if (p.mediaType === 'video') {
      const url = getMediaUrl('video', cur, p.previewSrc || p.src);
      const vid = document.createElement('video');
      vid.muted = true;
      vid.loop = true;
      vid.playsInline = true;
      vid.crossOrigin = 'anonymous';
      vid.preload = 'auto';
      vid.onloadedmetadata = () => {
        buildGrid(vid.videoWidth / vid.videoHeight || 16 / 9);
        vid.play().catch(() => { /* autoplay blocked: first frame still samples */ });
      };
      vid.src = url;
      videoRef.current = vid;
    } else {
      // audio: seeded waveform pattern
      buildGrid(16 / 10);
      const { gw, gh } = gridRef.current;
      lumaRef.current = audioPatternLuma(gw, gh, cur * 7919 + 13);
    }

    // store maxR on the ref via closure for the render loop
    gridRef.current = { ...gridRef.current };
    (gridRef.current as any).maxR = maxR;
  }, [cur, resizeTick, buildGrid]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const RSQ = SWELL_RADIUS * SWELL_RADIUS;
    let prevX = -9999;
    let prevY = -9999;

    const animate = () => {
      frameCount.current++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // live-sample video frames (every other frame)
      const vid = videoRef.current;
      if (vid && vid.readyState >= 2 && frameCount.current % 2 === 0) {
        const { gw, gh } = gridRef.current;
        const luma = sampleLuma(vid, vid.videoWidth, vid.videoHeight, gw, gh, scratchRef.current);
        if (luma) lumaRef.current = luma;
      }

      const luma = lumaRef.current;
      const dots = dotsRef.current;
      const maxR = (gridRef.current as any).maxR || 3;
      const px = pointer.current.x;
      const py = pointer.current.y;

      // cursor speed feeds the swell — a still cursor adds no energy
      let speed = 0;
      if (px > -999 && prevX > -999) {
        speed = Math.min(Math.hypot(px - prevX, py - prevY), 40) / 40; // 0..1
      }
      prevX = px;
      prevY = py;

      ctx.fillStyle = INK;
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        const L = luma ? luma[i] : 1;
        const r = maxR * Math.pow(1 - L, 1.5);

        // settle into the grid (used for the morph between works)
        d.x += (d.ox - d.x) * EASE;
        d.y += (d.oy - d.y) * EASE;

        // pump energy into dots near the moving cursor, then let it drain
        if (speed > 0) {
          const dx = px - d.x;
          const dy = py - d.y;
          const q = dx * dx + dy * dy;
          if (q < RSQ) {
            const inf = 1 - q / RSQ;
            d.e = Math.min(1, d.e + inf * inf * speed * SWELL_GAIN);
          }
        }
        d.e *= SWELL_DECAY;

        const rr = r * (1 + d.e * SWELL_SCALE);
        if (rr < 0.32) continue;

        ctx.beginPath();
        ctx.arc(d.x, d.y, rr, 0, 6.2832);
        ctx.fill();
      }

      animFrame.current = requestAnimationFrame(animate);
    };

    animFrame.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame.current);
  }, []);

  // Resize: re-run the source loader so the grid is rebuilt at the new size
  useEffect(() => {
    const handleResize = () => setResizeTick(t => t + 1);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Pointer interaction
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMouseMove = (e: MouseEvent) => {
      if (isTouch.current) return;
      pointer.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseLeave = () => {
      pointer.current = { x: -9999, y: -9999 };
    };
    const onMouseDown = () => {
      dragDist.current = 0;
    };
    const onMouseUp = (e: MouseEvent) => {
      if (isTouch.current) return;
      if (dragDist.current < 5 && e.target === canvas) onOpen(cur);
    };
    const onMouseMoveTrack = (e: MouseEvent) => {
      dragDist.current += Math.abs(e.movementX) + Math.abs(e.movementY);
    };

    const onTouchStart = (e: TouchEvent) => {
      isTouch.current = true;
      const t = e.touches[0];
      touchStart.current = { x: t.clientX, y: t.clientY };
      dragDist.current = 0;
      pointer.current = { x: t.clientX, y: t.clientY };
      e.preventDefault();
    };
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      dragDist.current += 1;
      pointer.current = { x: t.clientX, y: t.clientY };
      e.preventDefault();
    };
    const onTouchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStart.current.x;
      const dy = t.clientY - touchStart.current.y;
      pointer.current = { x: -9999, y: -9999 };
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        // horizontal swipe → browse
        if (dx < 0) next(); else prev();
      } else if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
        onOpen(cur);
      }
    };

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mousemove', onMouseMoveTrack);
    canvas.addEventListener('mouseleave', onMouseLeave);
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);
    return () => {
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mousemove', onMouseMoveTrack);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }, [cur, next, prev, onOpen]);

  // Keyboard browse (disabled while modal is open)
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, next, prev]);

  // cleanup video on unmount
  useEffect(() => () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute('src');
    }
  }, []);

  return (
    <div className="relative h-full w-full">
      <canvas ref={canvasRef} className="block h-full w-full cursor-pointer" />
    </div>
  );
};

export default StippleCanvas;
