import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { planById } from '@/lib/plans'
import { ShieldCheckIcon } from '@/components/icons'
import BillingPlanCards from './BillingPlanCards'
import ManageSubscriptionButton from './ManageSubscriptionButton'

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string }>
}) {
  const { expired } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  const status = subscription?.status ?? 'trialing'
  const trialEndsAt = subscription?.trial_ends_at
  const trialExpired = status === 'trialing' && !!trialEndsAt && new Date(trialEndsAt) <= new Date()
  const currentPlan = subscription?.status === 'active' ? planById(subscription.plan) : null
  const statusLabel = trialExpired
    ? 'Trial ended'
    : status === 'trialing'
      ? 'Trial'
      : status.charAt(0).toUpperCase() + status.slice(1)

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
            <ShieldCheckIcon className="h-5 w-5" />
            GuardScore
          </Link>
          <Link href="/dashboard" className="text-sm font-medium text-muted hover:text-foreground">
            Back to dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
        {(expired === '1' || trialExpired) && (
          <div className="rounded-2xl border border-warning-text/30 bg-warning-bg p-4 text-sm text-warning-text">
            Your 14-day trial has ended. Pick a plan below to unlock your dashboard again — your monitored
            domains and history are saved and will pick back up as soon as you subscribe.
          </div>
        )}

        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mb-1 text-sm font-semibold">Current plan</p>
              <p className="text-sm text-muted">
                Status: <span className="font-medium text-foreground">{statusLabel}</span>
                {currentPlan && <> — {currentPlan.name} ({currentPlan.domainLimit} domains)</>}
                {status === 'trialing' && trialEndsAt && !trialExpired && (
                  <> — trial ends {new Date(trialEndsAt).toLocaleDateString()}</>
                )}
                {trialExpired && trialEndsAt && <> — ended {new Date(trialEndsAt).toLocaleDateString()}</>}
              </p>
            </div>
            {subscription?.stripe_customer_id && <ManageSubscriptionButton />}
          </div>
        </div>

        <div>
          <h1 className="mb-6 text-2xl font-extrabold tracking-tight">Plans</h1>
          <BillingPlanCards currentPlanId={currentPlan?.id ?? null} />
        </div>
      </main>
    </div>
  )
}
