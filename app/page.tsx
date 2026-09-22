import { Package, ShieldCheck, Shirt, Truck } from 'lucide-react';

import { BuyBar } from '@/components/buy-bar';
import { MockupViewer } from '@/components/mockup-viewer';
import { PRICE_LABEL, PRODUCT } from '@/lib/product';

const VALUE_PROPS = [
  {
    icon: Shirt,
    label: 'Heavyweight cotton',
    detail: '240 GSM, 100% ringspun. Boxy fit, no drape.',
  },
  {
    icon: Package,
    label: 'One batch only',
    detail: `${PRODUCT.batchSize} units. No restock, no second colorway.`,
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
  ['Fabric', '240 GSM ringspun cotton'],
  ['Print', 'Full-back tour list, water-based screen print'],
  ['Fit', 'Boxy — size down for a standard fit'],
  ['Run size', `${PRODUCT.batchSize} units`],
  ['Price', `${PRICE_LABEL} + tax, US shipping included`],
] as const;

export default function Home() {
  return (
    <>
      <div className="border-b border-zinc-800 bg-zinc-900/40">
        <p className="mx-auto max-w-6xl px-5 py-2.5 text-center font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-400">
          Pre-order open · {PRODUCT.batchSize} units · {PRODUCT.shipWindow}
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
              <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
                {PRODUCT.name}
              </h1>
              <p className="max-w-md text-lg leading-7 text-zinc-400 text-pretty">
                Every war, every mission accomplished, every total and complete
                victory — printed on the back like a tour that never lost a
                date. {PRODUCT.batchSize} made, then the screens come down.
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
              <span className="font-mono text-zinc-600">01 </span>
              You pay {PRICE_LABEL} plus tax now and lock a unit in the
              run.
            </li>
            <li>
              <span className="font-mono text-zinc-600">02 </span>
              The batch goes to print once the run sells through.
            </li>
            <li>
              <span className="font-mono text-zinc-600">03 </span>
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
        <p className="border-t border-zinc-900 pt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-600">
          Payments by Stripe · US shipping only · Tax at checkout
        </p>
      </footer>

      {/* Clears the fixed mobile drawer. */}
      <div aria-hidden className="h-52 lg:hidden" />
    </>
  );
}
