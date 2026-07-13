import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PLAN_TIERS, planById } from '@/lib/plans'
import { ShieldCheckIcon, CheckIcon } from '@/components/icons'
import UpgradeButton from './UpgradeButton'

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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {PLAN_TIERS.map((plan) => {
              const isCurrent = currentPlan?.id === plan.id
              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-2xl p-6 ${
                    plan.popular ? 'bg-accent text-accent-foreground' : 'border border-border bg-surface'
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-warning-bg px-3 py-1 text-xs font-medium text-warning-text">
                      Most popular
                    </span>
                  )}
                  <p className={`text-xs font-medium tracking-wide ${plan.popular ? 'text-white/60' : 'text-muted'}`}>
                    {plan.name.toUpperCase()}
                  </p>
                  <p className="mt-1 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold tracking-tight">${plan.price}</span>
                    <span className={plan.popular ? 'text-sm text-white/60' : 'text-sm text-muted'}>/mo</span>
                  </p>
                  <p className={`mt-1 mb-5 text-sm ${plan.popular ? 'text-white/70' : 'text-muted'}`}>
                    {plan.description}
                  </p>

                  {isCurrent ? (
                    <span className="rounded-lg border border-white/30 px-4 py-2.5 text-center text-sm font-medium">
                      Current plan
                    </span>
                  ) : (
                    <UpgradeButton plan={plan.id} variant={plan.popular ? 'light' : 'dark'} />
                  )}

                  <div
                    className={`mt-5 flex flex-col gap-2.5 border-t pt-5 text-sm ${
                      plan.popular ? 'border-white/15' : 'border-border'
                    }`}
                  >
                    {plan.features.map((f) => (
                      <div key={f} className="flex items-center gap-2">
                        <CheckIcon className={`h-4 w-4 shrink-0 ${plan.popular ? 'text-white' : 'text-foreground'}`} />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
