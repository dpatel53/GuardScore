import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserAssetsWithChecks } from '@/lib/dashboardData.server'
import { CHECK_INFO } from '@/lib/checkInfo'
import StatusBadge from '@/components/StatusBadge'
import { BellIcon } from '@/components/icons'

export default async function AlertsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const assets = await getUserAssetsWithChecks(supabase, user.id)

  const alerts = assets
    .flatMap((asset) =>
      asset.checks
        .filter((c) => c.status === 'red' || c.status === 'yellow')
        .map((c) => ({ domain: asset.domain, ...c })),
    )
    .sort((a, b) => (a.status === 'red' ? -1 : 1) - (b.status === 'red' ? -1 : 1))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Alerts</h1>
        <p className="mt-1 text-sm text-muted">Recent changes to your security posture.</p>
      </div>

      {!alerts.length ? (
        <div className="rounded-2xl border border-dashed border-border p-16 text-center">
          <BellIcon className="mx-auto mb-4 h-8 w-8 text-muted" />
          <p className="text-lg font-semibold">All quiet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            You don&apos;t have any recent alerts. We&apos;ll let you know when something changes.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {alerts.map((alert, i) => (
            <div
              key={`${alert.domain}-${alert.check_type}-${i}`}
              className="rounded-2xl border border-border bg-surface p-5"
            >
              <div className="mb-1 flex items-center justify-between">
                <p className="text-sm font-semibold">
                  {alert.domain} — {CHECK_INFO[alert.check_type].label}
                </p>
                <StatusBadge status={alert.status} />
              </div>
              <p className="text-sm text-muted">{alert.summary}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
