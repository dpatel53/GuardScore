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

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    customer: existingSub?.stripe_customer_id ?? undefined,
    customer_email: existingSub?.stripe_customer_id ? undefined : user.email,
    client_reference_id: user.id,
    success_url: `${siteUrl}/billing?checkout=success`,
    cancel_url: `${siteUrl}/billing?checkout=cancelled`,
    metadata: { supabase_user_id: user.id, plan: plan.id, interval: isAnnual ? 'annual' : 'monthly' },
  })

  return NextResponse.json({ ok: true, url: session.url })
}
