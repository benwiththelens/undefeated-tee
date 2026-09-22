import type { ReactNode } from 'react';
import Link from 'next/link';

import { PRICE_LABEL_FULL, PRODUCT, STORE } from '@/lib/product';

export const metadata = {
  title: 'Policies & Contact',
  description: `Refund, shipping, return and privacy policies for ${PRODUCT.name}.`,
};

function SupportLink() {
  return (
    <a
      href={`mailto:${STORE.supportEmail}`}
      className="text-zinc-100 underline underline-offset-4 hover:text-white"
    >
      {STORE.supportEmail}
    </a>
  );
}

const REFUND_DAYS = PRODUCT.refundWindow.replace('-day', ' days');

const SECTIONS: Array<{ id: string; heading: string; body: ReactNode }> = [
  {
    id: 'contact',
    heading: 'Contact us',
    body: (
      <>
        <p>
          Email <SupportLink /> with any question about an order, a return, a
          refund, or sizing. A real person answers, normally within{' '}
          {STORE.responseWindow}.
        </p>
        <p>
          Include the order number from your emailed receipt and we can find
          your order immediately.
        </p>
      </>
    ),
  },
  {
    id: 'what-you-are-buying',
    heading: 'What you are buying',
    body: (
      <>
        <p>
          {PRODUCT.name}. A 240 GSM 100% ringspun cotton t-shirt, boxy fit, with
          a water-based screen print on the back and a smaller print on the
          front. Sizes S through 3XL. The garment is black; the print is cream,
          gold and red.
        </p>
        <p>
          The price is{' '}
          <strong className="text-zinc-100">{PRICE_LABEL_FULL}</strong> per
          shirt. All prices on this site are in United States dollars. US
          shipping is included in that price. Sales tax, where it applies, is
          calculated and shown at checkout before you pay.
        </p>
      </>
    ),
  },
  {
    id: 'pre-order',
    heading: 'This is a pre-order',
    body: (
      <>
        <p>
          The shirt is not in stock today. You are reserving a unit in a
          single production run. Your card is charged when you order, and the
          run goes to print after pre-orders close on {PRODUCT.closesLabel},
          2026 at 11:59pm Pacific.
        </p>
        <p>
          Estimated shipping: the week of November 16, 2026. If that date moves,
          everyone who ordered is emailed with the new date and offered a full
          refund.
        </p>
      </>
    ),
  },
  {
    id: 'shipping',
    heading: 'Shipping policy',
    body: (
      <>
        <p>
          We ship to the United States only. Addresses outside the US cannot be
          selected at checkout.
        </p>
        <p>
          Shipping is free — it is included in the {PRICE_LABEL_FULL} price.
          Orders ship together as one batch via USPS Ground Advantage once
          production finishes, with delivery normally 3&ndash;7 business days
          after that. You receive tracking by email when your parcel ships.
        </p>
      </>
    ),
  },
  {
    id: 'refunds',
    heading: 'Refund and cancellation policy',
    body: (
      <>
        <p>
          <strong className="text-zinc-100">
            Cancel any time before the batch ships and get a full refund.
          </strong>{' '}
          No reason needed, no fee. Email <SupportLink /> and we cancel the
          order and refund the full {PRICE_LABEL_FULL}.
        </p>
        <p>
          After delivery you have {REFUND_DAYS} from the day the parcel arrives
          to request a refund or an exchange for a different size.
        </p>
        <p>
          Refunds go back to the original payment method. Stripe typically posts
          them within 5&ndash;10 business days, depending on your bank.
        </p>
      </>
    ),
  },
  {
    id: 'returns',
    heading: 'Return policy and process',
    body: (
      <>
        <p>
          Unworn, unwashed shirts can be returned within {REFUND_DAYS} of
          delivery. Email us first — we send a prepaid return label, so returns
          cost you nothing.
        </p>
        <p>
          If the shirt arrives damaged, misprinted, or in the wrong size, tell
          us and send a photo. We replace it or refund it in full, your choice,
          and you do not need to send the original back.
        </p>
        <p>There are no in-store returns; this is an online-only shop.</p>
      </>
    ),
  },
  {
    id: 'privacy',
    heading: 'Privacy policy',
    body: (
      <>
        <p>
          We collect only what is needed to send you a shirt: your name,
          shipping address, and email address. Those are stored in our order
          database so we can fulfil, ship, and support your order.
        </p>
        <p>
          We never see or store your card details. Payment is handled entirely
          by Stripe, and card data goes directly to Stripe without touching our
          servers. See{' '}
          <a
            href="https://stripe.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-100 underline underline-offset-4 hover:text-white"
          >
            Stripe&rsquo;s privacy policy
          </a>
          .
        </p>
        <p>
          We do not sell, rent, or share your information beyond what is needed
          to ship the order — our payment processor and the shipping carrier. We
          run no advertising trackers on this site.
        </p>
        <p>
          Email <SupportLink /> at any time to get a copy of your data or have
          it deleted. Order records are kept only as long as tax and accounting
          rules require.
        </p>
      </>
    ),
  },
  {
    id: 'security',
    heading: 'Payment security',
    body: (
      <>
        <p>
          This site is served entirely over HTTPS. Payments are processed by{' '}
          <a
            href="https://stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-100 underline underline-offset-4 hover:text-white"
          >
            Stripe
          </a>
          , a PCI Service Provider Level 1 — the strictest certification level in
          the payments industry.
        </p>
        <p>
          Your card number never reaches our servers. You enter it on
          Stripe&rsquo;s own hosted checkout page, so card data is handled solely
          by Stripe. We accept Visa, Mastercard, American Express and Discover,
          plus Apple Pay and Google Pay where your device supports them.
        </p>
      </>
    ),
  },
  {
    id: 'restrictions',
    heading: 'Restrictions',
    body: (
      <p>
        Shipping is limited to addresses within the United States. This is a
        single printing. Pre-orders close on {PRODUCT.closesLabel}, 2026 and
        the design will not be reprinted afterwards. The design is a satirical
        work of commentary, sold as apparel only.
      </p>
    ),
  },
];

export default function PoliciesPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-16">
      <Link
        href="/"
        className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500 transition-colors duration-150 hover:text-zinc-300"
      >
        &larr; Back to the drop
      </Link>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
        Policies &amp; Contact
      </h1>
      <p className="mt-3 text-sm text-zinc-500">
        {STORE.name} — everything about ordering, shipping, refunds and your
        data, in plain language.
      </p>

      <nav className="mt-8 flex flex-wrap gap-x-4 gap-y-2 border-y border-zinc-900 py-4">
        {SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="font-mono text-[11px] uppercase tracking-[0.15em] text-zinc-500 transition-colors duration-150 hover:text-zinc-200"
          >
            {section.heading}
          </a>
        ))}
      </nav>

      <div className="mt-10 flex flex-col gap-10">
        {SECTIONS.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-8">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-100">
              {section.heading}
            </h2>
            <div className="mt-3 flex flex-col gap-3 text-sm leading-6 text-zinc-400 text-pretty">
              {section.body}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
