import Stripe from 'stripe'

let stripeClient: Stripe | null = null

// Returns null (never throws) when STRIPE_SECRET_KEY isn't set yet, so the
// billing UI can show "not configured" instead of crashing before you've
// added your own Stripe keys.
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  if (!stripeClient) {
    stripeClient = new Stripe(key, { apiVersion: '2025-02-24.acacia' })
  }
  return stripeClient
}
