import type { SupabaseClient } from '@supabase/supabase-js'
import { planById, type PlanTier } from './plans'

export interface SubscriptionAccessRow {
  plan?: string | null
  status?: string | null
  trial_ends_at?: string | null
}

// True once a subscription is active, or still inside its 14-day trial
// window. False once that trial window has passed with no paid
// subscription, or the subscription is past_due/canceled/incomplete —
// in all of those cases the dashboard locks and monitoring pauses until
// the customer subscribes (or fixes payment) via /billing.
export function hasActiveAccess(sub: SubscriptionAccessRow | null | undefined): boolean {
  // No row yet means the DB trigger that creates one on signup hasn't run
  // yet — a brand-new signup shouldn't get locked out by that race, so
  // default to access rather than against it.
  if (!sub) return true
  const status = sub.status ?? 'trialing'
  if (status === 'active') return true
  if (status === 'trialing') {
    if (!sub.trial_ends_at) return true
    return new Date(sub.trial_ends_at) > new Date()
  }
  return false
}

export interface SubscriptionAccess {
  plan: PlanTier
  hasAccess: boolean
  status: string
  trialEndsAt: string | null
}

// Central subscription lookup — used for the domain limit
// (dashboard/actions.ts), gating SMS alerts / trust badge / maintenance
// windows / the Reports page (Business/Pro only), and now also for gating
// dashboard access itself once a trial expires or a subscription lapses.
export async function getSubscriptionAccess(
  supabase: SupabaseClient,
  userId: string,
): Promise<SubscriptionAccess> {
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, status, trial_ends_at')
    .eq('user_id', userId)
    .maybeSingle()

  return {
    // No subscription row yet means the account is still in its trial
    // window; give trial users the Business-tier plan so they can properly
    // evaluate the product before picking a plan.
    plan: planById(sub?.plan ?? 'business'),
    hasAccess: hasActiveAccess(sub),
    status: sub?.status ?? 'trialing',
    trialEndsAt: sub?.trial_ends_at ?? null,
  }
}

export async function getUserPlan(supabase: SupabaseClient, userId: string): Promise<PlanTier> {
  return (await getSubscriptionAccess(supabase, userId)).plan
}

export function hasAdvancedFeatures(plan: PlanTier): boolean {
  return plan.id !== 'starter'
}
