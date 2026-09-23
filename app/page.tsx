import { Package, ShieldCheck, Shirt, Truck } from 'lucide-react';

import { BuyBar } from '@/components/buy-bar';
import { MockupViewer } from '@/components/mockup-viewer';
import { TourList } from '@/components/tour-list';
import Link from 'next/link';

import { PRICE_LABEL, PRICE_LABEL_FULL, PRODUCT, STORE } from '@/lib/product';

const VALUE_PROPS = [
  {
    icon: Shirt,
    label: 'Heavyweight cotton',
    detail: '6.1 oz, 100% ring-spun. Garment-dyed and pre-shrunk, relaxed fit.',
  },
  {
    icon: Package,
    label: 'One batch only',
    detail: `Printed once, after ${PRODUCT.closesLabel}. No restock, no second colorway.`,
  },
  {
    icon: Truck,
    label: 'Ships together',
    detail: `${PRODUCT.shipWindow}. US shipping included.`,
  },
  {
    icon: ShieldCheck,
    label: `${PRODUCT.refundWindow} refund window`,
    detail: 'Cancel any time before the batch ships. Full refund.',
  },
] as const;

const SPECS = [
  ['Fabric', '6.1 oz (about 207 GSM) 100% ring-spun cotton, garment-dyed'],
  ['Color', 'Garment-dyed black: a soft, washed charcoal that varies slightly shirt to shirt'],
  ['Print', 'Front and back, direct-to-garment (DTG)'],
  ['Fit', 'Relaxed'],
  ['Pre-order closes', `${PRODUCT.closesLabel}, 11:59pm PT`],
  ['Price', `${PRICE_LABEL_FULL} + tax, US shipping included`],
] as const;

export default function Home() {
  return (
    <>
      <div className="border-b border-zinc-800 bg-zinc-900/40">
        <p className="mx-auto max-w-6xl px-5 py-2.5 text-center font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-400">
          Pre-order closes {PRODUCT.closesLabel} · {PRODUCT.shipWindow}
        </p>
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pt-10 lg:pt-16">
        <section className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <MockupViewer />

          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">
                Limited drop 001
              </p>
              <h1 className="font-display text-4xl leading-[1.05] text-balance text-zinc-50 sm:text-5xl lg:text-6xl">
                {PRODUCT.name}
              </h1>
              <p className="max-w-md text-lg leading-7 text-zinc-400 text-pretty">
                Every war, every mission accomplished, every total and complete
                victory — printed on the back like a tour that never lost a
                date. Ordering closes {PRODUCT.closesLabel}, then the batch
                goes to print.
              </p>
            </div>

            <BuyBar />

            <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
              {VALUE_PROPS.map(({ icon: Icon, label, detail }) => (
                <div key={label} className="flex gap-3">
                  <Icon
                    aria-hidden
                    className="mt-0.5 size-4 shrink-0 text-zinc-500"
                  />
                  <div>
                    <dt className="text-sm font-medium text-zinc-100">
                      {label}
                    </dt>
                    <dd className="mt-0.5 text-sm leading-6 text-zinc-500 text-pretty">
                      {detail}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <TourList />

        <section className="mt-20 border-t border-zinc-800 pt-10">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">
            The details
          </h2>
          <dl className="mt-6 divide-y divide-zinc-900">
            {SPECS.map(([term, value]) => (
              <div
                key={term}
                className="flex items-baseline justify-between gap-6 py-3.5"
              >
                <dt className="text-sm text-zinc-500">{term}</dt>
                <dd className="text-right text-sm text-zinc-200">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-16 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8">
          <h2 className="text-lg font-semibold tracking-tight">
            How a pre-order works
          </h2>
          <ol className="mt-4 grid gap-4 text-sm leading-6 text-zinc-400 sm:grid-cols-3">
            <li>
              <span className="font-mono text-zinc-500">01 </span>
              You pay {PRICE_LABEL} plus tax now and lock a unit in the
              run.
            </li>
            <li>
              <span className="font-mono text-zinc-500">02 </span>
              The batch goes to print once the run sells through.
            </li>
            <li>
              <span className="font-mono text-zinc-500">03 </span>
              Everything ships the same week. {PRODUCT.shipWindow}.
            </li>
          </ol>
          <p className="mt-5 text-sm leading-6 text-zinc-500">
            Change your mind before the batch ships and you get the full{' '}
            {PRICE_LABEL} back — email the address on your receipt.
          </p>
        </section>
      </main>

      <footer className="mx-auto mt-16 w-full max-w-6xl px-5 pb-12">
        <div className="flex flex-col gap-5 border-t border-zinc-900 pt-8">
          <div className="flex flex-col gap-2">
            <p className="text-sm leading-6 text-zinc-400">
              <span className="text-zinc-200">Questions, returns or refunds:</span>{' '}
              email{' '}
              <a
                href={`mailto:${STORE.supportEmail}`}
                className="text-zinc-100 underline underline-offset-4 hover:text-white"
              >
                {STORE.supportEmail}
              </a>{' '}
              — we reply within {STORE.responseWindow}.
            </p>
            <p className="text-sm leading-6 text-zinc-500">
              Cancel any time before the batch ships for a full refund, or
              return within {PRODUCT.refundWindow.replace('-day', ' days')} of
              delivery with a prepaid label.{' '}
              <Link
                href="/policies"
                className="text-zinc-300 underline underline-offset-4 hover:text-zinc-100"
              >
                Full policies
              </Link>
              .
            </p>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {[
              ['Contact', '/policies#contact'],
              ['Refunds', '/policies#refunds'],
              ['Shipping', '/policies#shipping'],
              ['Returns', '/policies#returns'],
              ['Privacy', '/policies#privacy'],
              ['Security', '/policies#security'],
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="font-mono text-[11px] uppercase tracking-[0.15em] text-zinc-500 transition-colors duration-150 hover:text-zinc-200"
              >
                {label}
              </Link>
            ))}
          </div>

          <p className="font-mono text-[11px] leading-5 uppercase tracking-[0.15em] text-zinc-500">
            All prices in {PRICE_LABEL_FULL.split(' ')[1]} · Ships to the US only ·
            Tax calculated at checkout
          </p>
          <p className="text-xs leading-5 text-zinc-500">
            Payments are processed over HTTPS by Stripe, a PCI Service Provider
            Level 1. Your card details never touch our servers. We accept Visa,
            Mastercard, American Express and Discover. &copy;{' '}
            {new Date().getFullYear()} {STORE.name}.
          </p>
        </div>
      </footer>

      {/* Clears the fixed mobile drawer. */}
      <div aria-hidden className="h-52 lg:hidden" />
    </>
  );
}
