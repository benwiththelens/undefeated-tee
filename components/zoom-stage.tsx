'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

/**
 * The lightbox image with its own pinch, pan and double-tap zoom. The back print's tour list is
 * only legible zoomed in on a phone, and the browser's page pinch-zoom both blurs (the image is
 * sized to the screen) and fights the swipe-to-page gesture.
 *
 * One pointer at 1x swipes between photos; two pointers pinch; one pointer while zoomed pans.
 * A gesture that ever had two fingers never counts as a swipe or a tap.
 */
const MIN = 1;
const MAX = 4;
const DOUBLE_TAP_SCALE = 2.5;
const SWIPE_PX = 40;
const TAP_SLOP_PX = 8;
const DOUBLE_TAP_MS = 300;

type Point = { x: number; y: number };
type Transform = { s: number; x: number; y: number };

export function ZoomStage({
  src,
  alt,
  width,
  height,
  onSwipe,
  onClose,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  onSwipe: (direction: 1 | -1) => void;
  onClose: () => void;
}) {
  const [t, setT] = useState<Transform>({ s: 1, x: 0, y: 0 });
  const [animate, setAnimate] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const pointers = useRef(new Map<number, Point>());
  const g = useRef({
    start: { x: 0, y: 0 } as Point, // single pointer start (stage-centre coords)
    startT: { s: 1, x: 0, y: 0 } as Transform,
    pinchDist: 0,
    pinchMid: { x: 0, y: 0 } as Point,
    multi: false, // this gesture had two fingers at some point
    moved: false,
    lastTap: { at: 0, p: { x: 0, y: 0 } as Point },
  });
  // Live transform for event handlers; always written through commit() alongside the state.
  const tRef = useRef(t);
  function commit(next: Transform) {
    tRef.current = next;
    setT(next);
  }

  // Stage-centre coordinates: the transform origin is the centre of the stage.
  function local(e: { clientX: number; clientY: number }): Point {
    const r = stageRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left - r.width / 2, y: e.clientY - r.top - r.height / 2 };
  }

  // Keep the scaled image covering its own box: no panning off into empty space.
  function clamp(next: Transform): Transform {
    const img = imgRef.current;
    const s = Math.min(MAX, Math.max(MIN, next.s));
    if (!img || s === 1) return { s, x: 0, y: 0 };
    const maxX = ((s - 1) * img.offsetWidth) / 2;
    const maxY = ((s - 1) * img.offsetHeight) / 2;
    return {
      s,
      x: Math.min(maxX, Math.max(-maxX, next.x)),
      y: Math.min(maxY, Math.max(-maxY, next.y)),
    };
  }

  // Scale to `s` keeping the image point under `at` fixed on screen.
  function zoomAround(at: Point, s: number, from: Transform = tRef.current): Transform {
    const img = { x: (at.x - from.x) / from.s, y: (at.y - from.y) / from.s };
    return clamp({ s, x: at.x - img.x * s, y: at.y - img.y * s });
  }

  function animateTo(next: Transform) {
    setAnimate(true);
    commit(next);
  }

  // Keyboard zoom for desktop: + / - / 0.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const c = { x: 0, y: 0 };
      if (e.key === '+' || e.key === '=') animateTo(zoomAround(c, tRef.current.s * 1.5));
      if (e.key === '-') animateTo(zoomAround(c, tRef.current.s / 1.5));
      if (e.key === '0') animateTo({ s: 1, x: 0, y: 0 });
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handlers read live state via refs
  }, []);

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    setAnimate(false);
    const p = local(e);
    pointers.current.set(e.pointerId, p);
    const gs = g.current;
    if (pointers.current.size === 1) {
      gs.multi = false;
      gs.moved = false;
      gs.start = p;
      gs.startT = tRef.current;
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gs.multi = true;
      gs.pinchDist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      gs.pinchMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      gs.startT = tRef.current;
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    const p = local(e);
    pointers.current.set(e.pointerId, p);
    const gs = g.current;

    if (pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const s = Math.min(MAX, Math.max(MIN, (gs.startT.s * dist) / gs.pinchDist));
      // The image point that was under the starting midpoint follows the fingers.
      const img = {
        x: (gs.pinchMid.x - gs.startT.x) / gs.startT.s,
        y: (gs.pinchMid.y - gs.startT.y) / gs.startT.s,
      };
      commit(clamp({ s, x: mid.x - img.x * s, y: mid.y - img.y * s }));
      return;
    }

    const dx = p.x - gs.start.x;
    const dy = p.y - gs.start.y;
    if (Math.hypot(dx, dy) > TAP_SLOP_PX) gs.moved = true;
    if (tRef.current.s > 1 && !gs.multi) {
      commit(clamp({ ...gs.startT, x: gs.startT.x + dx, y: gs.startT.y + dy }));
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    const p = local(e);
    pointers.current.delete(e.pointerId);
    const gs = g.current;

    if (pointers.current.size === 1) {
      // Pinch ended with one finger still down: re-anchor so the pan doesn't jump.
      const [rest] = [...pointers.current.values()];
      gs.start = rest;
      gs.startT = tRef.current;
      return;
    }
    if (pointers.current.size > 0 || gs.multi) return;

    const dx = p.x - gs.start.x;
    if (tRef.current.s === 1 && gs.moved && Math.abs(dx) > SWIPE_PX) {
      onSwipe(dx < 0 ? 1 : -1);
      return;
    }
    if (gs.moved) return;

    // A tap: double-tap toggles zoom around the tap; a single tap outside the image at 1x closes.
    const now = e.timeStamp;
    const last = gs.lastTap;
    if (now - last.at < DOUBLE_TAP_MS && Math.hypot(p.x - last.p.x, p.y - last.p.y) < 30) {
      gs.lastTap = { at: 0, p };
      animateTo(tRef.current.s > 1 ? { s: 1, x: 0, y: 0 } : zoomAround(p, DOUBLE_TAP_SCALE));
      return;
    }
    gs.lastTap = { at: now, p };
    if (tRef.current.s === 1 && imgRef.current) {
      const r = imgRef.current.getBoundingClientRect();
      const inside =
        e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) onClose();
    }
  }

  function onPointerCancel(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    g.current.multi = true; // an interrupted gesture is never a tap or swipe
  }

  return (
    <div
      ref={stageRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onClick={(e) => e.stopPropagation()}
      // The page must not pinch-zoom or scroll under these gestures.
      style={{ touchAction: 'none' }}
      className={`absolute inset-0 flex items-center justify-center overflow-hidden p-4 ${
        t.s > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
      }`}
    >
      <Image
        ref={imgRef}
        src={src}
        alt={alt}
        width={width}
        height={height}
        // Up to twice the screen width, so zooming in stays sharp (capped at the source size).
        sizes="200vw"
        draggable={false}
        style={{ transform: `translate(${t.x}px, ${t.y}px) scale(${t.s})` }}
        className={`max-h-full w-auto max-w-full select-none rounded-xl object-contain ${
          animate ? 'motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.2,0,0,1)]' : ''
        }`}
      />
      {t.s === 1 ? (
        <p className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 rounded-md bg-zinc-950/80 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-zinc-300 [@media(hover:hover)]:hidden">
          Pinch or double-tap to zoom
        </p>
      ) : null}
    </div>
  );
}
