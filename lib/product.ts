/**
 * Single source of truth for the drop. The landing page renders from this and
 * the checkout route prices from this, so the client can never dictate money.
 */

export const SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL'] as const;

export type Size = (typeof SIZES)[number];

export function isSize(value: unknown): value is Size {
  return typeof value === 'string' && (SIZES as readonly string[]).includes(value);
}

export const PRODUCT = {
  slug: 'undefeated_tee',
  name: 'The Undefeated World Tour Tee',
  priceCents: 3400,
  currency: 'usd',
  // From Stripe's canonical tax code list, not invented:
  // "Clothing & Footwear — apparel and footwear for people made for general
  // use." Chosen over General Tangible Goods so the states that exempt
  // clothing (PA, NJ, MN, MA in part) are not over-collected from.
  // https://docs.stripe.com/tax/tax-codes
  taxCode: 'txcd_30011000',
  // Tax is added on top of $34 at checkout, not backed out of it.
  taxBehavior: 'exclusive',
  // A deadline, not a unit count. We print what is ordered by this date, so
  // the run can never oversell and there is no cap to enforce.
  closesAt: '2026-10-18T23:59:59-07:00',
  closesLabel: 'Sunday, October 18',
  shipWindow: 'Ships the week of November 16, 2026',
  refundWindow: '30-day',
} as const;

export const PRICE_LABEL = `$${(PRODUCT.priceCents / 100).toFixed(0)}`;
// Card network rules want the currency stated, not just the symbol.
export const PRICE_LABEL_FULL = `${PRICE_LABEL} USD`;

/** Storefront identity. Stripe's review crawls the site for these. */
export const STORE = {
  name: 'Undefeated Drop',
  supportEmail: 'undefeateddrop@gmail.com',
  responseWindow: '2 business days',
} as const;

export function lineItemName(size: Size): string {
  return `${PRODUCT.name} - Size ${size}`;
}
