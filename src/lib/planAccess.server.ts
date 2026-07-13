import type { SupabaseClient } from '@supabase/supabase-js'
import { planById, type PlanTier } from './plans'

// Central plan lookup — used for the domain limit (dashboard/actions.ts) and
// now also for gating SMS alerts, the trust badge, maintenance windows, and
// the Reports page, all of which are Business/Pro only.
export async function getUserPlan(supabase: SupabaseClient, userId: string): Promise<PlanTier> {
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', userId)
    .maybeSingle()
  // No subscription row yet means the account is still in its trial window;
  // give trial users the Business-tier plan so they can properly evaluate
  // the product before picking a plan.
  return planById(sub?.plan ?? 'business')
}

export function hasAdvancedFeatures(plan: PlanTier): boolean {
  return plan.id !== 'starter'
}
