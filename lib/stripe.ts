import Stripe from 'stripe';

/**
 * Lazy singleton. Instantiating at module scope would throw during `next build`
 * when the route module is collected without runtime env vars present.
 */
let client: Stripe | null = null;

export function stripe(): Stripe {
  if (client) return client;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }

  client = new Stripe(key, {
    apiVersion: '2026-08-26.dahlia',
    appInfo: { name: 'undefeated-drop' },
  });

  return client;
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

export function appUrl(): string {
  return requireEnv('NEXT_PUBLIC_APP_URL').replace(/\/$/, '');
}
