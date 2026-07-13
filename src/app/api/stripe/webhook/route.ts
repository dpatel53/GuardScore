import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'
import type Stripe from 'stripe'

// Stripe sends events here with no logged-in user, so this route uses the
// service-role admin client (bypasses RLS) scoped only to the customer/user
// id embedded in the event by Stripe.
export async function POST(request: Request) {
  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripe || !webhookSecret) {
    return NextResponse.json({ ok: false, code: 'billing_not_configured' }, { status: 501 })
  }

  const signature = request.headers.get('stripe-signature')
  const rawBody = await request.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature ?? '', webhookSecret)
  } catch (err) {
    return NextResponse.json({ ok: false, message: `Invalid signature: ${String(err)}` }, { status: 400 })
  }

  const supabase = createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.supabase_user_id ?? session.client_reference_id
      const plan = session.metadata?.plan
      if (userId) {
        await supabase.from('subscriptions').upsert(
          {
            user_id: userId,
            stripe_customer_id: String(session.customer),
            stripe_subscription_id: String(session.subscription),
            status: 'active',
            ...(plan ? { plan } : {}),
          },
          { onConflict: 'user_id' },
        )
      }
      break
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const statusMap: Record<string, string> = {
        active: 'active',
        trialing: 'trialing',
        past_due: 'past_due',
        canceled: 'canceled',
        incomplete: 'incomplete',
        incomplete_expired: 'canceled',
        unpaid: 'past_due',
        paused: 'canceled',
      }
      await supabase
        .from('subscriptions')
        .update({
          status: statusMap[subscription.status] ?? 'incomplete',
          current_period_end: new Date(
            (subscription as unknown as { current_period_end: number }).current_period_end * 1000,
          ).toISOString(),
        })
        .eq('stripe_customer_id', String(subscription.customer))
      break
    }
    default:
      break
  }

  return NextResponse.json({ ok: true })
}
