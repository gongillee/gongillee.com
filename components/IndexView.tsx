import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PROJECTS_DATA, getMediaUrl, getThumbUrl } from '../constants';

type Medium = 'all' | 'image' | 'video' | 'audio';

const MEDIUM_LABEL: Record<string, string> = {
  image: '사진',
  video: '영상',
  audio: '음악',
};

// paper & ink tokens (kept in sync with index.css)
const INK = '#2b2a27';
const PAPER = '#f9f8f5';
const MUTED = '#8a877e';

const LOUPE_SCALE = 2.4;
const LOUPE_RADIUS = 85;
const GAP = 10;

interface IndexViewProps {
  onOpen: (projectIndices: number[], position: number) => void;
}

interface CellRect {
  x: number;
  y: number; // world y (before scroll)
  w: number;
  h: number; // photo area height (label sits below)
}

const IndexView: React.FC<IndexViewProps> = ({ onOpen }) => {
  const [medium, setMedium] = useState<Medium>('all');
  const [resizeTick, setResizeTick] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const scroll = useRef({ y: 0, target: 0, max: 0 });
  const pointer = useRef({ x: -9999, y: -9999, ex: -9999, ey: -9999 });
  const loupeOn = useRef(false); // desktop: hover; mobile: press & hold
  const holdTimer = useRef<number>(0);
  const isTouch = useRef(false);
  const touchInfo = useRef({ x: 0, y: 0, t: 0, moved: 0 });
  const animFrame = useRef(0);
  const imagesRef = useRef(new Map<number, { img: HTMLImageElement; loaded: boolean }>());
  // video/audio cells: explicit thumbSrc image, or an auto frame from the video preview
  const mediaThumbsRef = useRef(new Map<number, { src: HTMLImageElement | HTMLVideoElement; loaded: boolean } | null>());
  const layoutRef = useRef({ cols: 1, cw: 100, ph: 133, cellH: 150, left: 20, top: 170 });

  const entries = useMemo(() => PROJECTS_DATA.map((p, i) => ({ p, i })), []);
  const filtered = useMemo(
    () => (medium === 'all' ? entries : entries.filter(({ p }) => p.mediaType === medium)),
    [entries, medium]
  );

  const counts = useMemo(() => {
    const c = { image: 0, video: 0, audio: 0 };
    for (const { p } of entries) c[p.mediaType]++;
    return c;
  }, [entries]);

  const filters: { key: Medium; label: string }[] = [
    { key: 'all', label: `All ${entries.length}` },
    { key: 'image', label: `Image ${counts.image}` },
    { key: 'video', label: `Video ${counts.video}` },
    { key: 'audio', label: `Audio ${counts.audio}` },
  ];

  // Layout + scroll bounds, recomputed on filter/resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const isMobile = W < 768;
    const left = isMobile ? 16 : 32;
    const cols = Math.max(3, Math.round((W - left * 2) / (isMobile ? 116 : 136)));
    const cw = (W - left * 2 - GAP * (cols - 1)) / cols;
    const ph = cw * 4 / 3;
    const cellH = ph + 18; // label strip below the frame
    const top = isMobile ? 150 : 168; // clear of HUD + filter chips
    layoutRef.current = { cols, cw, ph, cellH, left, top };

    const rows = Math.ceil(filtered.length / cols);
    const sheetH = top + rows * (cellH + GAP) + 110; // bottom clearance for HUD/marquee
    scroll.current.max = Math.max(0, sheetH - H);
    scroll.current.target = Math.min(scroll.current.target, scroll.current.max);
    scroll.current.y = Math.min(scroll.current.y, scroll.current.max);
  }, [filtered, resizeTick]);

  useEffect(() => {
    const onResize = () => setResizeTick(t => t + 1);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Lazy image loading for a project index
  const ensureImage = (projIdx: number) => {
    const store = imagesRef.current;
    if (store.has(projIdx)) return store.get(projIdx)!;
    const p = PROJECTS_DATA[projIdx];
    const rec = { img: new Image(), loaded: false };
    rec.img.crossOrigin = 'anonymous';
    rec.img.onload = () => { rec.loaded = true; };
    rec.img.onerror = () => {
      const full = getMediaUrl('image', projIdx, p.src);
      if (full && !rec.img.src.endsWith(full)) rec.img.src = full;
    };
    rec.img.src = getThumbUrl(p.src) || getMediaUrl('image', projIdx, p.src);
    store.set(projIdx, rec);
    return rec;
  };

  // Thumbnail source for video/audio cells (null → typographic frame)
  const ensureMediaThumb = (projIdx: number) => {
    const store = mediaThumbsRef.current;
    if (store.has(projIdx)) return store.get(projIdx)!;
    const p = PROJECTS_DATA[projIdx];

    if (p.thumbSrc) {
      const rec = { src: new Image(), loaded: false };
      (rec.src as HTMLImageElement).onload = () => { rec.loaded = true; };
      (rec.src as HTMLImageElement).src = getThumbUrl(p.thumbSrc);
      store.set(projIdx, rec);
      return rec;
    }

    if (p.mediaType === 'video') {
      // no explicit thumb: grab a frame from the (local) preview clip
      const url = getMediaUrl('video', projIdx, p.previewSrc || p.src);
      if (url) {
        const vid = document.createElement('video');
        vid.muted = true;
        vid.playsInline = true;
        vid.preload = 'auto';
        vid.crossOrigin = 'anonymous';
        const rec = { src: vid, loaded: false };
        vid.onloadeddata = () => {
          // seek past a possibly black first frame
          try { vid.currentTime = Math.min(0.5, (vid.duration || 1) / 2); } catch { rec.loaded = true; }
        };
        vid.onseeked = () => { rec.loaded = true; };
        vid.src = url;
        store.set(projIdx, rec);
        return rec;
      }
    }

    store.set(projIdx, null);
    return null;
  };

  const cellRect = (pos: number): CellRect => {
    const { cols, cw, ph, cellH, left, top } = layoutRef.current;
    const col = pos % cols;
    const row = Math.floor(pos / cols);
    return { x: left + col * (cw + GAP), y: top + row * (cellH + GAP), w: cw, h: ph };
  };

  const cellAtPoint = (px: number, py: number): number | null => {
    const { cols, cw, cellH, left, top } = layoutRef.current;
    const wy = py + scroll.current.y;
    if (px < left || wy < top) return null;
    const col = Math.floor((px - left) / (cw + GAP));
    if (col < 0 || col >= cols || px > left + col * (cw + GAP) + cw) return null;
    const row = Math.floor((wy - top) / (cellH + GAP));
    if (row < 0) return null;
    const pos = row * cols + col;
    return pos < filtered.length ? pos : null;
  };

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw one cell into an arbitrary screen rect (shared by sheet & loupe passes)
    const drawCell = (pos: number, rx: number, ry: number, rw: number, rh: number, scale: number, alpha: number) => {
      const { p, i } = filtered[pos];
      ctx.globalAlpha = alpha;

      // cover-crop any image-like source into the cell rect
      const drawCover = (src: CanvasImageSource, iw: number, ih: number) => {
        const ia = iw / ih;
        const ca = rw / rh;
        let sw: number, sh: number, sx: number, sy: number;
        if (ia > ca) { sh = ih; sw = sh * ca; sx = (iw - sw) / 2; sy = 0; }
        else { sw = iw; sh = sw / ca; sx = 0; sy = (ih - sh) / 2; }
        ctx.drawImage(src, sx, sy, sw, sh, rx, ry, rw, rh);
      };
      const drawGlyph = (badge: boolean) => {
        // ▷ for film, bars for sound — full-cell glyph or small corner badge
        const gx = badge ? rx + rw - 13 * scale : rx + rw / 2;
        const gy = badge ? ry + rh - 13 * scale : ry + rh / 2;
        const gs = badge ? 5 * scale : Math.min(rw, rh) * 0.2;
        if (badge) {
          ctx.fillStyle = PAPER;
          ctx.fillRect(rx + rw - 22 * scale, ry + rh - 22 * scale, 22 * scale, 22 * scale);
        }
        ctx.strokeStyle = INK;
        ctx.lineWidth = scale;
        if (p.mediaType === 'video') {
          ctx.beginPath();
          ctx.moveTo(gx - gs * 0.6, gy - gs);
          ctx.lineTo(gx + gs, gy);
          ctx.lineTo(gx - gs * 0.6, gy + gs);
          ctx.closePath();
          ctx.stroke();
        } else {
          const bw = Math.max(1.5 * scale, gs * 0.16);
          [0.5, 1, 0.66].forEach((h, k) => {
            const bh = gs * 2 * h;
            ctx.fillStyle = INK;
            ctx.fillRect(gx + (k - 1) * bw * 2.4 - bw / 2, gy - bh / 2, bw, bh);
          });
        }
      };

      if (p.mediaType === 'image') {
        const rec = ensureImage(i);
        if (rec.loaded) {
          drawCover(rec.img, rec.img.naturalWidth, rec.img.naturalHeight);
        } else {
          ctx.fillStyle = '#efede5';
          ctx.fillRect(rx, ry, rw, rh);
        }
      } else {
        const rec = ensureMediaThumb(i);
        if (rec && rec.loaded) {
          const iw = rec.src instanceof HTMLVideoElement ? rec.src.videoWidth : rec.src.naturalWidth;
          const ih = rec.src instanceof HTMLVideoElement ? rec.src.videoHeight : rec.src.naturalHeight;
          drawCover(rec.src, iw, ih);
          drawGlyph(true); // corner badge keeps the medium readable
        } else {
          // no thumbnail: typographic frame
          ctx.fillStyle = PAPER;
          ctx.fillRect(rx, ry, rw, rh);
          drawGlyph(false);
        }
      }

      // frame + label
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = 'rgba(43,42,39,0.55)';
      ctx.lineWidth = scale;
      ctx.strokeRect(rx, ry, rw, rh);
      ctx.fillStyle = MUTED;
      ctx.font = `${9 * scale}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(`no.${String(i + 1).padStart(3, '0')}`, rx, ry + rh + 12 * scale);
      ctx.globalAlpha = 1;
    };

    const animate = () => {
      const W = window.innerWidth;
      const H = window.innerHeight;

      // ease scroll & loupe position
      scroll.current.y += (scroll.current.target - scroll.current.y) * 0.16;
      const pt = pointer.current;
      if (pt.x > -999) {
        if (pt.ex < -999) { pt.ex = pt.x; pt.ey = pt.y; }
        pt.ex += (pt.x - pt.ex) * 0.3;
        pt.ey += (pt.y - pt.ey) * 0.3;
      } else {
        pt.ex = -9999; pt.ey = -9999;
      }

      ctx.clearRect(0, 0, W, H);

      const { cols, cellH, top } = layoutRef.current;
      const sy = scroll.current.y;
      const rowH = cellH + GAP;
      const firstRow = Math.max(0, Math.floor((sy - top) / rowH));
      const lastRow = Math.ceil((sy + H - top) / rowH);

      // sheet pass (slightly dimmed — the loupe "reveals")
      for (let row = firstRow; row <= lastRow; row++) {
        for (let col = 0; col < cols; col++) {
          const pos = row * cols + col;
          if (pos >= filtered.length) break;
          const r = cellRect(pos);
          drawCell(pos, r.x, r.y - sy, r.w, r.h, 1, 0.86);
        }
      }

      // loupe pass
      if (loupeOn.current && pt.ex > -999) {
        const lx = pt.ex;
        const ly = pt.ey;
        ctx.save();
        ctx.beginPath();
        ctx.arc(lx, ly, LOUPE_RADIUS, 0, 6.2832);
        ctx.clip();
        ctx.fillStyle = PAPER;
        ctx.fillRect(lx - LOUPE_RADIUS, ly - LOUPE_RADIUS, LOUPE_RADIUS * 2, LOUPE_RADIUS * 2);
        for (let row = firstRow; row <= lastRow; row++) {
          for (let col = 0; col < cols; col++) {
            const pos = row * cols + col;
            if (pos >= filtered.length) break;
            const r = cellRect(pos);
            // magnify around the loupe center
            const zx = lx + (r.x - lx) * LOUPE_SCALE;
            const zy = ly + (r.y - sy - ly) * LOUPE_SCALE;
            const zw = r.w * LOUPE_SCALE;
            const zh = r.h * LOUPE_SCALE;
            if (zx > lx + LOUPE_RADIUS || zx + zw < lx - LOUPE_RADIUS || zy > ly + LOUPE_RADIUS || zy + zh < ly - LOUPE_RADIUS) continue;
            drawCell(pos, zx, zy, zw, zh, LOUPE_SCALE, 1);
          }
        }
        ctx.restore();

        // ring
        ctx.strokeStyle = INK;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(lx, ly, LOUPE_RADIUS, 0, 6.2832);
        ctx.stroke();

        // caption tag for the cell under the pointer
        const pos = cellAtPoint(pt.x, pt.y);
        if (pos !== null) {
          const { p, i } = filtered[pos];
          const label = `no.${String(i + 1).padStart(3, '0')} · ${p.year} · ${p.type}${p.title && p.mediaType !== 'image' ? ` — ${p.title}` : ''}`;
          ctx.font = '10px "JetBrains Mono", monospace';
          const tw = ctx.measureText(label).width + 14;
          const tagY = Math.min(ly + LOUPE_RADIUS + 8, H - 60);
          ctx.fillStyle = INK;
          ctx.fillRect(lx - tw / 2, tagY, tw, 18);
          ctx.fillStyle = PAPER;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, lx, tagY + 9.5);
        }
      }

      animFrame.current = requestAnimationFrame(animate);
    };

    animFrame.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame.current);
  }, [filtered]);

  // Interaction
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      scroll.current.target = Math.max(0, Math.min(scroll.current.max, scroll.current.target + e.deltaY));
    };
    const onMouseMove = (e: MouseEvent) => {
      if (isTouch.current) return;
      pointer.current.x = e.clientX;
      pointer.current.y = e.clientY;
      loupeOn.current = true;
    };
    const onMouseLeave = () => {
      pointer.current = { x: -9999, y: -9999, ex: -9999, ey: -9999 };
      loupeOn.current = false;
    };
    const onClick = (e: MouseEvent) => {
      if (isTouch.current) return;
      const pos = cellAtPoint(e.clientX, e.clientY);
      if (pos !== null) onOpen(filtered.map(f => f.i), pos);
    };

    const onTouchStart = (e: TouchEvent) => {
      isTouch.current = true;
      const t = e.touches[0];
      touchInfo.current = { x: t.clientX, y: t.clientY, t: Date.now(), moved: 0 };
      pointer.current.x = t.clientX;
      pointer.current.y = t.clientY;
      // press & hold turns the finger into the loupe
      holdTimer.current = window.setTimeout(() => { loupeOn.current = true; }, 280);
      e.preventDefault();
    };
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      const dy = t.clientY - pointer.current.y;
      touchInfo.current.moved += Math.abs(t.clientX - pointer.current.x) + Math.abs(dy);
      pointer.current.x = t.clientX;
      pointer.current.y = t.clientY;
      if (!loupeOn.current) {
        if (touchInfo.current.moved > 12) {
          clearTimeout(holdTimer.current);
          scroll.current.target = Math.max(0, Math.min(scroll.current.max, scroll.current.target - dy));
        }
      }
      e.preventDefault();
    };
    const onTouchEnd = () => {
      clearTimeout(holdTimer.current);
      const quickTap = Date.now() - touchInfo.current.t < 300 && touchInfo.current.moved < 10 && !loupeOn.current;
      if (quickTap) {
        const pos = cellAtPoint(pointer.current.x, pointer.current.y);
        if (pos !== null) onOpen(filtered.map(f => f.i), pos);
      }
      loupeOn.current = false;
      pointer.current = { x: -9999, y: -9999, ex: -9999, ey: -9999 };
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);
    return () => {
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }, [filtered, onOpen]);

  return (
    <div className="absolute inset-0 touch-none">
      <canvas ref={canvasRef} className="block h-full w-full cursor-none" style={{ cursor: 'crosshair' }} />

      {/* Filter chips */}
      <div className="pointer-events-auto absolute left-4 top-24 z-30 flex flex-wrap gap-2 font-mono text-[11px] tracking-[0.08em] text-ink md:left-8 md:top-28">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setMedium(f.key)}
            className={`px-3 py-1 transition-colors ${medium === f.key
                ? 'border border-solid border-ink bg-ink text-paper'
                : 'border border-dotted border-ink bg-paper opacity-70 hover:opacity-100'
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default IndexView;
