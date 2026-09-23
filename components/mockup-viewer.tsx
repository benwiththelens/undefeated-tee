'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

// Full-shirt shots, each followed by a close-up of its print: at gallery size a whole shirt makes
// the type a few pixels tall, and the type is the joke.
const VIEWS = [
  {
    id: 'back',
    src: '/mockup-back.jpg',
    label: 'Back',
    alt: 'Back of the tee: a tour-date list of American wars, each marked W',
  },
  {
    id: 'back-detail',
    src: '/detail-back.jpg',
    label: 'Back print, close-up',
    alt: 'Close-up of the back print: twelve tour dates from 1918 to 2026, each marked W with a quote declaring victory',
  },
  {
    id: 'front',
    src: '/mockup-front.jpg',
    label: 'Front',
    alt: 'Front of the tee: an engraved eagle landing over a chrome USA wordmark, gripping a ribbon',
  },
  {
    id: 'front-detail',
    src: '/detail-front.jpg',
    label: 'Front print, close-up',
    alt: 'Close-up of the front print: USA in chrome and fire lettering, an engraved eagle, and a ribbon reading Undefeated World Tour',
  },
] as const;

// Where "Read the list" goes: the close-up is the one view where every row is legible.
const LIST_VIEW = VIEWS.findIndex((v) => v.id === 'back-detail');
const SWIPE_PX = 40;

const arrowClass =
  'absolute top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-700/60 bg-zinc-950/70 text-zinc-100 backdrop-blur-sm transition-colors duration-150 hover:border-zinc-500 hover:bg-zinc-950/90 focus-visible:outline-2 focus-visible:outline-zinc-50';

export function MockupViewer() {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const touchX = useRef<number | null>(null);
  const swiped = useRef(false);

  const step = useCallback((delta: number) => {
    setActive((i) => (i + delta + VIEWS.length) % VIEWS.length);
  }, []);

  useEffect(() => {
    if (!zoomed) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setZoomed(false);
      if (event.key === 'ArrowRight') step(1);
      if (event.key === 'ArrowLeft') step(-1);
    };

    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [zoomed, step]);

  // Swipe to page on touch screens; a swipe must not also count as the tap that opens the zoom.
  const swipeHandlers = {
    onTouchStart: (e: React.TouchEvent) => {
      touchX.current = e.touches[0].clientX;
      swiped.current = false;
    },
    onTouchEnd: (e: React.TouchEvent) => {
      if (touchX.current === null) return;
      const dx = e.changedTouches[0].clientX - touchX.current;
      touchX.current = null;
      if (Math.abs(dx) > SWIPE_PX) {
        swiped.current = true;
        step(dx < 0 ? 1 : -1);
      }
    },
  };

  const view = VIEWS[active];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            if (swiped.current) {
              swiped.current = false;
              return;
            }
            setZoomed(true);
          }}
          {...swipeHandlers}
          aria-label={`Enlarge the ${view.label.toLowerCase()} of the tee`}
          className="relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900"
        >
          {VIEWS.map((item, index) => (
            <Image
              key={item.id}
              src={item.src}
              alt={item.alt}
              fill
              // `priority` is deprecated in Next 16; eager + high fetch priority is the replacement.
              loading={index === 0 ? 'eager' : undefined}
              fetchPriority={index === 0 ? 'high' : undefined}
              sizes="(min-width: 1024px) 560px, 100vw"
              // All stay mounted and cross-fade, so switching never flashes a blank frame
              // waiting on a decode.
              className={`object-cover transition-opacity duration-200 ${
                index === active ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
        </button>

        {/* Controls sit beside the zoom button, not inside it: nested buttons are invalid and
            every click inside would open the zoom. */}
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="Previous photo"
          className={`${arrowClass} left-3`}
        >
          <ChevronLeft aria-hidden className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => step(1)}
          aria-label="Next photo"
          className={`${arrowClass} right-3`}
        >
          <ChevronRight aria-hidden className="size-5" />
        </button>

        <button
          type="button"
          onClick={() => {
            setActive(LIST_VIEW);
            setZoomed(true);
          }}
          className="absolute right-3 bottom-3 z-10 rounded-md border border-zinc-700/60 bg-zinc-950/80 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-zinc-100 backdrop-blur-sm transition-colors duration-150 hover:border-zinc-500 hover:bg-zinc-950/95 focus-visible:outline-2 focus-visible:outline-zinc-50"
        >
          Read the list
        </button>

        <p className="sr-only" aria-live="polite">
          {`Photo ${active + 1} of ${VIEWS.length}: ${view.label}`}
        </p>
      </div>

      <div className="flex gap-2">
        {VIEWS.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActive(index)}
            aria-pressed={index === active}
            className={`relative h-16 w-16 overflow-hidden rounded-lg border transition-colors duration-150 ${
              index === active
                ? 'border-zinc-50'
                : 'border-zinc-800 hover:border-zinc-600'
            }`}
          >
            <Image
              src={item.src}
              alt=""
              fill
              sizes="64px"
              className="object-cover"
            />
            <span className="sr-only">{item.label}</span>
          </button>
        ))}
      </div>

      {zoomed ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={view.alt}
          onClick={() => setZoomed(false)}
          {...swipeHandlers}
          className="fixed inset-0 z-[60] flex cursor-zoom-out items-center justify-center bg-zinc-950/95 p-4 backdrop-blur-sm"
        >
          <Image
            src={view.src}
            alt={view.alt}
            width={1400}
            height={1400}
            sizes="100vw"
            className="max-h-full w-auto max-w-full rounded-xl object-contain"
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              step(-1);
            }}
            aria-label="Previous photo"
            className={`${arrowClass} left-4`}
          >
            <ChevronLeft aria-hidden className="size-5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              step(1);
            }}
            aria-label="Next photo"
            className={`${arrowClass} right-4`}
          >
            <ChevronRight aria-hidden className="size-5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
