import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'
import { planById, type PlanId } from '@/lib/plans'

const PRICE_ID_ENV: Record<PlanId, string | undefined> = {
  starter: process.env.STRIPE_PRICE_ID_STARTER,
  business: process.env.STRIPE_PRICE_ID_BUSINESS,
  pro: process.env.STRIPE_PRICE_ID_PRO,
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

  const stripe = getStripe()
  const priceId = PRICE_ID_ENV[plan.id]
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  if (!stripe || !priceId) {
    return NextResponse.json(
      {
        ok: false,
        code: 'billing_not_configured',
        message: `Add STRIPE_SECRET_KEY and STRIPE_PRICE_ID_${plan.id.toUpperCase()} to your environment to enable billing.`,
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
    metadata: { supabase_user_id: user.id, plan: plan.id },
  })

  return NextResponse.json({ ok: true, url: session.url })
}
