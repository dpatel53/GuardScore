import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { planById } from '@/lib/plans'
import { getUserPlan, hasAdvancedFeatures } from '@/lib/planAccess.server'
import UpgradeNotice from '@/components/UpgradeNotice'
import AlertPhoneForm from './AlertPhoneForm'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: subscription }, { data: notificationSettings }, currentPlan] = await Promise.all([
    supabase.from('subscriptions').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('notification_settings').select('alert_phone').eq('user_id', user.id).maybeSingle(),
    getUserPlan(supabase, user.id),
  ])

  const status = subscription?.status ?? 'trialing'
  const plan = subscription?.status === 'active' ? planById(subscription.plan) : null
  const advanced = hasAdvancedFeatures(currentPlan)

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

      {advanced ? (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <p className="mb-1 text-sm font-semibold">Text message alerts</p>
          <p className="mb-4 text-sm text-muted">
            Optional. We&apos;ll text this number if a check gets worse, in addition to email. Leave
            blank to only get email alerts.
          </p>
          <AlertPhoneForm currentPhone={notificationSettings?.alert_phone ?? null} />
        </div>
      ) : (
        <UpgradeNotice feature="SMS alerts" />
      )}
    </div>
  )
}
