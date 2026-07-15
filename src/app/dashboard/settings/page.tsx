import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { planById } from '@/lib/plans'

export default async function SettingsPage() {
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
  const plan = subscription?.status === 'active' ? planById(subscription.plan) : null

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted">Your account and plan.</p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6">
        <p className="mb-1 text-sm font-semibold">Account</p>
        <p className="text-sm text-muted">{user.email}</p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-sm font-semibold">Plan</p>
          <Link href="/billing" className="text-sm font-medium text-accent">
            Manage billing →
          </Link>
        </div>
        <p className="text-sm text-muted">
          Status: <span className="font-medium text-foreground">{status}</span>
          {plan && <> — {plan.name} ({plan.domainLimit} domains)</>}
        </p>
      </div>
    </div>
  )
}
