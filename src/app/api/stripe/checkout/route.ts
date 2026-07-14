import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'
import { planById, type PlanId } from '@/lib/plans'

const MONTHLY_PRICE_ID_ENV: Record<PlanId, string | undefined> = {
  starter: process.env.STRIPE_PRICE_ID_STARTER,
  business: process.env.STRIPE_PRICE_ID_BUSINESS,
  pro: process.env.STRIPE_PRICE_ID_PRO,
}

const ANNUAL_PRICE_ID_ENV: Record<PlanId, string | undefined> = {
  starter: process.env.STRIPE_PRICE_ID_STARTER_ANNUAL,
  business: process.env.STRIPE_PRICE_ID_BUSINESS_ANNUAL,
  pro: process.env.STRIPE_PRICE_ID_PRO_ANNUAL,
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.email) {
    return NextResponse.json({ ok: false, code: 'unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const plan = planById(body?.plan)
  // Mirrors the Monthly/Annual toggle on the pricing page. Defaults to
  // monthly so any caller that doesn't send this (e.g. an older client) keeps
  // working exactly as it did before annual billing existed.
  const isAnnual = body?.interval === 'annual'

  const stripe = getStripe()
  const priceId = isAnnual ? ANNUAL_PRICE_ID_ENV[plan.id] : MONTHLY_PRICE_ID_ENV[plan.id]
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  if (!stripe || !priceId) {
    const envVar = `STRIPE_PRICE_ID_${plan.id.toUpperCase()}${isAnnual ? '_ANNUAL' : ''}`
    return NextResponse.json(
      {
        ok: false,
        code: 'billing_not_configured',
        message: `Add STRIPE_SECRET_KEY and ${envVar} to your environment to enable billing.`,
      },
      { status: 501 },
    )
  }

  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle()

  const storedCustomerId = existingSub?.stripe_customer_id ?? undefined

  const sessionParams = {
    mode: 'subscription' as const,
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: user.id,
    success_url: `${siteUrl}/billing?checkout=success`,
    cancel_url: `${siteUrl}/billing?checkout=cancelled`,
    metadata: { supabase_user_id: user.id, plan: plan.id, interval: isAnnual ? 'annual' : 'monthly' },
  }

  // Stripe throws (rather than returning a normal error object) for things
  // like a price ID from the wrong mode (test vs. live) or a stale/deleted
  // price. Without this try/catch, an unhandled throw here becomes a non-JSON
  // 500 response, which makes the client's res.json() call throw too — the
  // Upgrade button was found to hang forever on "Redirecting…" with no
  // visible error when this happened, instead of surfacing what went wrong.
  try {
    let session
    try {
      session = await stripe.checkout.sessions.create({
        ...sessionParams,
        customer: storedCustomerId,
        customer_email: storedCustomerId ? undefined : user.email,
      })
    } catch (err) {
      // A customer ID saved while testing in a Stripe sandbox (or one
      // deleted directly in the dashboard) won't exist under a live-mode
      // key. Rather than fail the whole checkout, drop the stale reference,
      // clear it so this doesn't repeat, and let Stripe create a fresh
      // customer from the email instead.
      const isStaleCustomer =
        storedCustomerId &&
        err instanceof Error &&
        'code' in err &&
        (err as { code?: string }).code === 'resource_missing' &&
        'param' in err &&
        (err as { param?: string }).param === 'customer'

      if (!isStaleCustomer) throw err

      await supabase.from('subscriptions').update({ stripe_customer_id: null }).eq('user_id', user.id)
      session = await stripe.checkout.sessions.create({
        ...sessionParams,
        customer_email: user.email,
      })
    }

    return NextResponse.json({ ok: true, url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error creating checkout session.'
    return NextResponse.json({ ok: false, code: 'stripe_error', message }, { status: 500 })
  }
}
