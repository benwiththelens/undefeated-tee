'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

const VIEWS = [
  {
    id: 'back',
    src: '/mockup-back.jpg',
    label: 'Back',
    alt: 'Back of the tee: a tour-date list of American wars, each marked W',
  },
  {
    id: 'front',
    src: '/mockup-front.jpg',
    label: 'Front',
    alt: 'Front of the tee: an eagle crest under a USA wordmark',
  },
] as const;

export function MockupViewer() {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  // The back print is a tour-date list — the whole joke is in type too small
  // to read at column width, so the hero opens full-bleed.
  useEffect(() => {
    if (!zoomed) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setZoomed(false);
    };

    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [zoomed]);

  const view = VIEWS[active];

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setZoomed(true)}
        aria-label={`Enlarge the ${view.label.toLowerCase()} of the tee`}
        className="group relative aspect-square cursor-zoom-in overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900"
      >
        {VIEWS.map((item, index) => (
          <Image
            key={item.id}
            src={item.src}
            alt={item.alt}
            fill
            priority={index === 0}
            sizes="(min-width: 1024px) 560px, 100vw"
            // Both stay mounted and cross-fade, so switching never flashes a
            // blank frame waiting on a decode.
            className={`object-cover transition-opacity duration-200 ${
              index === active ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
        <span className="pointer-events-none absolute right-3 bottom-3 rounded-md bg-zinc-950/80 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-300 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          Read the list
        </span>
      </button>

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
        </div>
      ) : null}
    </div>
  );
}
