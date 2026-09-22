import { NextResponse } from 'next/server';
import type Stripe from 'stripe';

import { notifyDiscord, orderFromSession, recordOrder } from '@/lib/orders';
import { requireEnv, stripe } from '@/lib/stripe';

// Signature verification needs Node crypto and the untouched request bytes.
export const runtime = 'nodejs';
// POST handlers are never cached in the App Router, so no `bodyParser: false`
// equivalent is needed here — but pin `force-dynamic` so no future segment
// config or Cache Components rollout can prerender this route.
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<NextResponse> {
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  // Must be the raw text. Calling `request.json()` here would re-serialize the
  // payload and the HMAC would never match.
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = await stripe().webhooks.constructEventAsync(
      payload,
      signature,
      requireEnv('STRIPE_WEBHOOK_SECRET')
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    console.error('[webhook] signature verification failed', message);
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    );
  }

  switch (event.type) {
    // A delayed-notification payment method completes the session while it is
    // still unpaid and settles hours or days later. Fulfilling on `completed`
    // alone would ship to people whose payment later fails, and never ship to
    // the ones whose payment succeeds.
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
      return fulfill(event, event.data.object);

    case 'checkout.session.async_payment_failed':
      console.warn(
        '[webhook] async payment failed, not fulfilling',
        event.data.object.id
      );
      break;
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

async function fulfill(
  event: Stripe.Event,
  session: Stripe.Checkout.Session
): Promise<NextResponse> {
  if (session.payment_status === 'unpaid') {
    // Settlement is still pending. `async_payment_succeeded` does the work.
    return NextResponse.json(
      { received: true, fulfilled: false },
      { status: 200 }
    );
  }

  const order = orderFromSession(event, session);

  let isNew: boolean;
  try {
    isNew = await recordOrder(order);
  } catch (error) {
    // 500 tells Stripe to retry. `recordOrder` dedupes on `event.id`, so a
    // retry after a partial success is safe.
    console.error('[webhook] failed to record order', order.sessionId, error);
    return NextResponse.json(
      { error: 'Failed to record order' },
      { status: 500 }
    );
  }

  // Only on a genuine insert — a Stripe retry must not ping twice. And the
  // order is already durable, so a dead Discord webhook must not cause Stripe
  // to retry a payment we have recorded.
  if (isNew) {
    try {
      await notifyDiscord(order);
    } catch (error) {
      console.error('[webhook] discord notification failed', error);
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
