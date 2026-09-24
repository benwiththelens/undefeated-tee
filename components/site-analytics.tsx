'use client';

import { Analytics, type BeforeSendEvent } from '@vercel/analytics/next';

// Vercel Web Analytics records each page URL with its query string. The success page carries the
// buyer's Stripe checkout id (?session_id=cs_live_...), so strip it: no order is tied to a visit.
// (Client component because the layout, a server component, can't pass a function prop.)
function redact(event: BeforeSendEvent): BeforeSendEvent {
  const url = new URL(event.url);
  url.searchParams.delete('session_id');
  return { ...event, url: url.toString() };
}

export function SiteAnalytics() {
  return <Analytics beforeSend={redact} />;
}
