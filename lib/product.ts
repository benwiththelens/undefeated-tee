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

/**
 * Extended sizes cost more wholesale, so they carry an upcharge on top of the base price.
 * Set from the DTG quotes; delete an entry (or set 0) to drop it. Checkout prices from
 * priceCentsFor(), so this is the only place the amount lives.
 */
export const SIZE_UPCHARGE_CENTS: Partial<Record<Size, number>> = {
  '2XL': 300,
  '3XL': 300,
};

export function priceCentsFor(size: Size): number {
  return PRODUCT.priceCents + (SIZE_UPCHARGE_CENTS[size] ?? 0);
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;
}

export const PRICE_LABEL = formatPrice(PRODUCT.priceCents);
// Card network rules want the currency stated, not just the symbol.
export const PRICE_LABEL_FULL = `${PRICE_LABEL} USD`;

/** "2XL and 3XL are $37", or null when no size carries an upcharge. */
export const EXTENDED_SIZES_NOTE: string | null = (() => {
  const extended = SIZES.filter((s) => (SIZE_UPCHARGE_CENTS[s] ?? 0) > 0);
  if (extended.length === 0) return null;
  const prices = new Set(extended.map(priceCentsFor));
  if (prices.size > 1) {
    return extended.map((s) => `${s} ${formatPrice(priceCentsFor(s))}`).join(', ');
  }
  const names =
    extended.length === 1
      ? extended[0]
      : `${extended.slice(0, -1).join(', ')} and ${extended[extended.length - 1]}`;
  return `${names} ${extended.length === 1 ? 'is' : 'are'} ${formatPrice(priceCentsFor(extended[0]))}`;
})();

/** Storefront identity. Stripe's review crawls the site for these. */
export const STORE = {
  name: 'Undefeated Drop',
  supportEmail: 'undefeateddrop@gmail.com',
  responseWindow: '2 business days',
} as const;

export function lineItemName(size: Size): string {
  return `${PRODUCT.name} - Size ${size}`;
}
