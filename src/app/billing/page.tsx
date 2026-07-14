import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { planById } from '@/lib/plans'
import { ShieldCheckIcon } from '@/components/icons'
import BillingPlanCards from './BillingPlanCards'

export default async function BillingPage() {
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
  const currentPlan = subscription?.status === 'active' ? planById(subscription.plan) : null

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
        <div className="rounded-2xl border border-border bg-surface p-6">
          <p className="mb-1 text-sm font-semibold">Current plan</p>
          <p className="text-sm text-muted">
            Status: <span className="font-medium text-foreground">{status}</span>
            {currentPlan && <> — {currentPlan.name} ({currentPlan.domainLimit} domains)</>}
            {status === 'trialing' && trialEndsAt && (
              <> — trial ends {new Date(trialEndsAt).toLocaleDateString()}</>
            )}
          </p>
        </div>

        <div>
          <h1 className="mb-6 text-2xl font-extrabold tracking-tight">Plans</h1>
          <BillingPlanCards currentPlanId={currentPlan?.id ?? null} />
        </div>
      </main>
    </div>
  )
}
