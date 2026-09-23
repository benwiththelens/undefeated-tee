'use client';

import { useEffect, useRef, useState } from 'react';

import {
  EXTENDED_SIZES_NOTE,
  PRODUCT,
  SIZES,
  STORE,
  formatPrice,
  priceCentsFor,
  type Size,
} from '@/lib/product';

/**
 * One instance, one piece of state. It is a fixed bottom drawer on mobile and
 * drops back into normal flow inside the hero column at `lg`.
 */
/**
 * Days left, computed in the browser. The page is statically prerendered, so a
 * server-rendered "closes in N days" would be frozen at build time and go
 * wrong the next morning. Null until mounted, so SSR and hydration agree.
 */
function useDaysLeft(): number | null {
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const ms = new Date(PRODUCT.closesAt).getTime() - Date.now();
      setDays(Math.max(0, Math.ceil(ms / 86_400_000)));
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  return days;
}

export function BuyBar() {
  const daysLeft = useDaysLeft();
  const [size, setSize] = useState<Size | null>(null);
  const [sizeMissing, setSizeMissing] = useState(false);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const sizesRef = useRef<HTMLFieldSetElement>(null);

  async function checkout() {
    if (pending) return;

    // The button stays enabled; a missing size is explained where it is fixed.
    if (!size) {
      setSizeMissing(true);
      sizesRef.current?.querySelector<HTMLInputElement>('input')?.focus();
      return;
    }

    setPending(true);
    setFailed(false);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ size }),
      });

      const data: { url?: string; error?: string } = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error ?? `checkout responded ${res.status}`);
      }

      window.location.assign(data.url);
    } catch (cause) {
      // The server's reason is for the log, not the buyer; they get a way forward instead.
      console.error('[checkout]', cause);
      setFailed(true);
      setPending(false);
    }
  }

  const price = formatPrice(size ? priceCentsFor(size) : PRODUCT.priceCents);

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-800 bg-zinc-950/95 px-5 pt-4 pb-safe backdrop-blur-md lg:static lg:rounded-2xl lg:border lg:border-zinc-800 lg:bg-zinc-900/40 lg:p-6 lg:backdrop-blur-none">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-3 lg:max-w-none">
        <fieldset
          ref={sizesRef}
          aria-describedby={sizeMissing ? 'size-missing' : undefined}
          className="flex min-w-0 flex-col gap-3"
        >
          {/* A legend only names its fieldset as the first child, so it's screen-reader only
              here and the visible label below is its hidden twin. */}
          <legend className="sr-only">Select size</legend>
          <div className="hidden items-baseline justify-between lg:flex">
            <span
              aria-hidden
              className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500"
            >
              Select size
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">
              Closes {PRODUCT.closesLabel}
            </span>
          </div>

          {/* Native radios: one Tab stop, arrow keys and checked state come from the platform. */}
          <div className="grid grid-cols-6 gap-1.5">
            {SIZES.map((option) => (
              <label key={option} className="relative">
                <input
                  type="radio"
                  name="size"
                  value={option}
                  checked={size === option}
                  onChange={() => {
                    setSize(option);
                    setSizeMissing(false);
                  }}
                  className="peer sr-only"
                />
                <span className="flex h-11 cursor-pointer items-center justify-center rounded-lg border border-zinc-700 font-mono text-sm tracking-wider text-zinc-300 transition-colors duration-150 hover:border-zinc-500 hover:text-zinc-50 peer-checked:border-zinc-50 peer-checked:bg-zinc-50 peer-checked:text-zinc-950 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-zinc-50">
                  {option}
                </span>
              </label>
            ))}
          </div>

          {sizeMissing ? (
            <p id="size-missing" className="text-center text-xs text-red-400">
              Choose a size to continue.
            </p>
          ) : EXTENDED_SIZES_NOTE ? (
            <p className="text-center font-mono text-[11px] uppercase tracking-[0.15em] text-zinc-500">
              {EXTENDED_SIZES_NOTE}
            </p>
          ) : null}
        </fieldset>

        <button
          type="button"
          onClick={checkout}
          disabled={pending}
          // The USA's fire, used once on the page: the only color on the shirt is the only color here.
          className="h-14 w-full rounded-xl bg-linear-to-b from-fire-top to-fire-deep text-sm font-semibold uppercase tracking-[0.15em] text-zinc-50 shadow-[inset_0_1px_0_rgb(247_147_30/0.45)] transition-[filter] duration-150 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-50 disabled:cursor-wait disabled:opacity-80 disabled:hover:brightness-100"
        >
          {pending ? 'Opening checkout…' : `Pre-order now — ${price}`}
        </button>

        {failed ? (
          <p role="alert" className="text-center text-xs leading-5 text-red-400">
            Unable to open checkout. Try again, or email{' '}
            <a
              href={`mailto:${STORE.supportEmail}`}
              className="underline underline-offset-2"
            >
              {STORE.supportEmail}
            </a>{' '}
            if it keeps happening.
          </p>
        ) : (
          <p className="text-center font-mono text-[11px] uppercase tracking-[0.15em] text-zinc-500">
            {daysLeft === null ? (
              <span className="lg:hidden">&nbsp;</span>
            ) : daysLeft > 0 ? (
              <span className="text-zinc-400">
                {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left to order
              </span>
            ) : (
              <span className="text-zinc-400">Pre-orders are closed</span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
