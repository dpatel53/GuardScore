import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'

// Creates a Stripe-hosted Customer Portal session so subscribers can update
// their payment method, view invoices, and cancel their subscription
// themselves — this is the only place in the app cancellation happens; there
// is no separate "Cancel subscription" button because Stripe's portal
// already includes that (on by default, configured in the Stripe dashboard
// under Settings > Billing > Customer portal).
export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ ok: false, code: 'unauthorized' }, { status: 401 })
  }

  const stripe = getStripe()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  if (!stripe) {
    return NextResponse.json(
      { ok: false, code: 'billing_not_configured', message: 'Add STRIPE_SECRET_KEY to your environment to enable billing.' },
      { status: 501 },
    )
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!subscription?.stripe_customer_id) {
    return NextResponse.json(
      {
        ok: false,
        code: 'no_subscription',
        message: "You don't have a paid plan yet, so there's nothing to manage. Pick a plan below to get started.",
      },
      { status: 400 },
    )
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${siteUrl}/billing`,
    })
    return NextResponse.json({ ok: true, url: session.url })
  } catch (err) {
    // Same stale-customer situation as the checkout route: a customer ID
    // saved while testing in a Stripe sandbox (or deleted directly in the
    // dashboard) won't exist under a live-mode key. There's no subscription
    // to manage in that case — clear it so this stops recurring, and send
    // the customer back to pick a plan instead of showing a raw Stripe error.
    const isStaleCustomer =
      err instanceof Error &&
      'code' in err &&
      (err as { code?: string }).code === 'resource_missing' &&
      'param' in err &&
      (err as { param?: string }).param === 'customer'

    if (isStaleCustomer) {
      // Same reasoning as the checkout route: use the service-role client so
      // this clear isn't silently blocked by RLS on the subscriptions table.
      const admin = createAdminClient()
      await admin.from('subscriptions').update({ stripe_customer_id: null }).eq('user_id', user.id)
      return NextResponse.json(
        {
          ok: false,
          code: 'no_subscription',
          message: "We couldn't find an active subscription to manage. Pick a plan below to get started.",
        },
        { status: 400 },
      )
    }

    const message = err instanceof Error ? err.message : 'Unknown error opening the billing portal.'
    return NextResponse.json({ ok: false, code: 'stripe_error', message }, { status: 500 })
  }
}
