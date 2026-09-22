import { appendFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import type Stripe from 'stripe';

import { PRODUCT, type Size } from './product';

export type Order = {
  /** Stripe event id. The dedupe key — Stripe retries and can deliver twice. */
  eventId: string;
  sessionId: string;
  createdAt: string;
  product: string;
  size: Size | 'unknown';
  amountTotal: number | null;
  currency: string | null;
  email: string | null;
  name: string | null;
  address: Stripe.Address | null;
};

const LEDGER_PATH = path.join(process.cwd(), 'data', 'orders.jsonl');

export function orderFromSession(
  event: Stripe.Event,
  session: Stripe.Checkout.Session
): Order {
  // Stripe API 2026-08-26 moved shipping off the session root:
  // `session.shipping_details` is now `session.collected_information.shipping_details`.
  const shipping = session.collected_information?.shipping_details ?? null;
  const size = session.metadata?.size;

  return {
    eventId: event.id,
    sessionId: session.id,
    createdAt: new Date(event.created * 1000).toISOString(),
    product: session.metadata?.product ?? PRODUCT.slug,
    size: (size as Size | undefined) ?? 'unknown',
    amountTotal: session.amount_total,
    currency: session.currency,
    email: session.customer_details?.email ?? null,
    name: shipping?.name ?? session.customer_details?.name ?? null,
    address: shipping?.address ?? null,
  };
}

/**
 * Appends to whichever sink is configured — Supabase when its env vars are
 * present, otherwise a local JSONL ledger. Both dedupe on `eventId`, and both
 * return false when the event was already recorded, so a Stripe retry does not
 * fire a second notification.
 *
 * The file ledger exists so `next dev` works with no database. It is refused
 * in production: serverless filesystems are ephemeral and Workers have none at
 * all, so a "successful" write there is a paid order that quietly disappears.
 * Throwing instead returns a 500, which makes Stripe retry and keeps the event
 * replayable from the Dashboard.
 */
export async function recordOrder(order: Order): Promise<boolean> {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && serviceKey) {
    return recordToSupabase(url, serviceKey, order);
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'No order sink configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. ' +
        'Refusing to write orders to an ephemeral filesystem.'
    );
  }

  if (await ledgerHasEvent(order.eventId)) return false;

  await mkdir(path.dirname(LEDGER_PATH), { recursive: true });
  await appendFile(LEDGER_PATH, `${JSON.stringify(order)}\n`, 'utf8');
  return true;
}

async function recordToSupabase(
  url: string,
  serviceKey: string,
  order: Order
): Promise<boolean> {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  // `ignoreDuplicates` is ON CONFLICT DO NOTHING, so the RETURNING clause
  // behind `.select()` yields a row only on a genuine insert.
  const { data, error } = await supabase
    .from('orders')
    .upsert(
      {
        event_id: order.eventId,
        session_id: order.sessionId,
        created_at: order.createdAt,
        product: order.product,
        size: order.size,
        amount_total: order.amountTotal,
        currency: order.currency,
        email: order.email,
        name: order.name,
        address: order.address,
      },
      { onConflict: 'event_id', ignoreDuplicates: true }
    )
    .select('event_id');

  if (error) {
    throw new Error(`Supabase insert failed: ${error.message}`);
  }

  return (data?.length ?? 0) > 0;
}

async function ledgerHasEvent(eventId: string): Promise<boolean> {
  try {
    const contents = await readFile(LEDGER_PATH, 'utf8');
    return contents.includes(`"eventId":${JSON.stringify(eventId)}`);
  } catch {
    return false;
  }
}

export async function notifyDiscord(order: Order): Promise<void> {
  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) return;

  const who = order.name ?? order.email ?? 'Someone';
  const where = [order.address?.city, order.address?.state]
    .filter(Boolean)
    .join(', ');

  const content = `🚨 New Pre-Order: ${who} bought ${order.size}${
    where ? ` to ${where}` : ''
  }`;

  const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    throw new Error(`Discord webhook returned ${res.status}`);
  }
}
