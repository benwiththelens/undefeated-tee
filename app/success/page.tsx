import Link from 'next/link';
import type Stripe from 'stripe';

import { PRODUCT } from '@/lib/product';
import { stripe } from '@/lib/stripe';

export const metadata = {
  title: 'Order confirmed',
  robots: { index: false, follow: false },
};

async function loadSession(
  id: string | undefined
): Promise<Stripe.Checkout.Session | null> {
  if (!id) return null;

  try {
    return await stripe().checkout.sessions.retrieve(id);
  } catch (error) {
    console.error('[success] could not retrieve session', id, error);
    return null;
  }
}

export default async function SuccessPage(props: PageProps<'/success'>) {
  const { session_id: sessionId } = await props.searchParams;
  const session = await loadSession(
    typeof sessionId === 'string' ? sessionId : undefined
  );

  const size = session?.metadata?.size ?? null;
  const email = session?.customer_details?.email ?? null;
  const shipping = session?.collected_information?.shipping_details ?? null;
  const paid = session?.payment_status === 'paid';

  const rows: Array<[string, string]> = [
    ['Item', PRODUCT.name],
    ...(size ? ([['Size', size]] as Array<[string, string]>) : []),
    ...(session?.amount_total != null
      ? ([
          ['Paid', `$${(session.amount_total / 100).toFixed(2)}`],
        ] as Array<[string, string]>)
      : []),
    ...(shipping
      ? ([
          [
            'Shipping to',
            [shipping.address.city, shipping.address.state]
              .filter(Boolean)
              .join(', '),
          ],
        ] as Array<[string, string]>)
      : []),
    ['Ships', PRODUCT.shipWindow],
  ];

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-5 py-20">
      <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">
        {paid ? 'Payment received' : 'Order placed'}
      </p>

      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        You&rsquo;re in the batch.
      </h1>

      <p className="mt-4 text-base leading-7 text-zinc-400 text-pretty">
        {email ? (
          <>
            A receipt is on its way to{' '}
            <span className="text-zinc-100">{email}</span>. Nothing else to do
            — the whole run ships at once.
          </>
        ) : (
          <>
            Your receipt is on its way by email. Nothing else to do — the whole
            run ships at once.
          </>
        )}
      </p>

      <dl className="mt-8 divide-y divide-zinc-900 rounded-2xl border border-zinc-800 bg-zinc-900/40 px-5">
        {rows.map(([term, value]) => (
          <div
            key={term}
            className="flex items-baseline justify-between gap-6 py-3.5"
          >
            <dt className="text-sm text-zinc-500">{term}</dt>
            <dd className="text-right text-sm text-zinc-100">{value}</dd>
          </div>
        ))}
      </dl>

      {session ? null : (
        <p className="mt-4 text-sm leading-6 text-zinc-500">
          We couldn&rsquo;t load your session details here, but if Stripe
          charged you the order is recorded. Your emailed receipt is the record.
        </p>
      )}

      <p className="mt-6 text-sm leading-6 text-zinc-500">
        Need a different size, or a refund? Reply to your receipt inside the{' '}
        {PRODUCT.refundWindow} window, any time before the batch ships.
      </p>

      <Link
        href="/"
        className="mt-10 inline-flex h-12 items-center justify-center rounded-xl border border-zinc-800 px-6 text-sm font-medium tracking-wide text-zinc-300 transition-colors duration-150 hover:border-zinc-600 hover:text-zinc-50"
      >
        Back to the drop
      </Link>
    </main>
  );
}
