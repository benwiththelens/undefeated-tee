'use client';

import { useEffect, useState } from 'react';

import { PRICE_LABEL, PRODUCT, SIZES, type Size } from '@/lib/product';

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
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkout() {
    if (!size || pending) return;

    setPending(true);
    setError(null);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ size }),
      });

      const data: { url?: string; error?: string } = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error ?? 'Checkout unavailable');
      }

      window.location.assign(data.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Checkout unavailable');
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-800 bg-zinc-950/95 px-5 pt-4 pb-safe backdrop-blur-md lg:static lg:rounded-2xl lg:border lg:border-zinc-800 lg:bg-zinc-900/40 lg:p-6 lg:backdrop-blur-none">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-3 lg:max-w-none">
        <div className="hidden items-baseline justify-between lg:flex">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">
            Select size
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">
            Closes {PRODUCT.closesLabel}
          </span>
        </div>

        <div
          role="radiogroup"
          aria-label="Size"
          className="grid grid-cols-6 gap-1.5"
        >
          {SIZES.map((option) => {
            const selected = option === size;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setSize(option)}
                className={`h-11 rounded-lg border font-mono text-sm tracking-wider transition-colors duration-150 ${
                  selected
                    ? 'border-zinc-50 bg-zinc-50 text-zinc-950'
                    : 'border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-zinc-50'
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={checkout}
          disabled={!size || pending}
          // The USA's fire, used once on the page: the only color on the shirt is the only color here.
          className="h-14 w-full rounded-xl bg-linear-to-b from-fire-top to-fire-mid text-sm font-semibold uppercase tracking-[0.15em] text-zinc-50 shadow-[inset_0_1px_0_rgb(247_147_30/0.45)] transition-[filter] duration-150 hover:brightness-110 disabled:cursor-not-allowed disabled:bg-none disabled:bg-zinc-800 disabled:text-zinc-500 disabled:shadow-none disabled:hover:brightness-100"
        >
          {pending
            ? 'Opening checkout…'
            : size
              ? `Pre-Order Now — ${PRICE_LABEL}`
              : 'Select your size'}
        </button>

        {error ? (
          <p role="alert" className="text-center text-xs text-red-400">
            {error}
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
