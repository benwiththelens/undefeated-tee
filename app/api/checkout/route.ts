import { NextResponse } from 'next/server';

import { PRODUCT, isSize, lineItemName } from '@/lib/product';
import { appUrl, stripe } from '@/lib/stripe';

export const runtime = 'nodejs';

// Tags every session so this checkout flow can be compared against others in
// the Stripe Dashboard. Fixed literal, not per-request, or the sessions do not
// group. Required format: a label plus an 8-letter suffix.
const INTEGRATION_ID = 'undefeated-drop-vvlceuex';

/**
 * Stripe Tax is opt-in by env because enabling it is not a no-op: without a
 * head office address on the account, `sessions.create` throws outright rather
 * than calculating zero, which would break every buy click. Flip this on once
 * Dashboard > Tax > Settings has a head office address AND there is an active
 * registration — with settings but no registration it succeeds and collects
 * nothing, which is the quieter failure.
 */
const AUTOMATIC_TAX = process.env.STRIPE_AUTOMATIC_TAX === 'true';

type CheckoutResponse = { url: string } | { error: string };

export async function POST(
  request: Request
): Promise<NextResponse<CheckoutResponse>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const size = (body as { size?: unknown } | null)?.size;
  if (!isSize(size)) {
    return NextResponse.json({ error: 'Invalid size' }, { status: 400 });
  }

  try {
    const origin = appUrl();

    // Price is read from PRODUCT, never from the request — the client picks a
    // size and nothing else.
    const session = await stripe().checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: PRODUCT.currency,
            unit_amount: PRODUCT.priceCents,
            tax_behavior: PRODUCT.taxBehavior,
            product_data: {
              name: lineItemName(size),
              description: PRODUCT.shipWindow,
              tax_code: PRODUCT.taxCode,
            },
          },
        },
      ],
      shipping_address_collection: { allowed_countries: ['US'] },
      // Checkout already collects the shipping address, which is the location
      // Stripe Tax bases the calculation on — no extra billing address needed.
      automatic_tax: { enabled: AUTOMATIC_TAX },
      integration_identifier: INTEGRATION_ID,
      metadata: { size, product: PRODUCT.slug },
      // Mirrored onto the PaymentIntent so the size survives a refund or
      // dispute lookup, where you only have the charge.
      payment_intent_data: { metadata: { size, product: PRODUCT.slug } },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: 'Stripe did not return a checkout URL' },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[checkout] session create failed', error);
    return NextResponse.json(
      { error: 'Could not start checkout' },
      { status: 500 }
    );
  }
}
