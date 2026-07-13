import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserAssetsWithChecks } from '@/lib/dashboardData.server'
import { scoreToGrade } from '@/lib/checks'

const GRADE_STYLES: Record<string, string> = {
  A: 'bg-success-bg text-success-text',
  B: 'bg-success-bg text-success-text',
  C: 'bg-warning-bg text-warning-text',
  D: 'bg-warning-bg text-warning-text',
  F: 'bg-danger-bg text-danger-text',
}

export default async function DashboardOverviewPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const assets = await getUserAssetsWithChecks(supabase, user.id)

  const needsAttention = assets.reduce(
    (sum, a) => sum + a.checks.filter((c) => c.status === 'red').length,
    0,
  )
  const toReview = assets.reduce(
    (sum, a) => sum + a.checks.filter((c) => c.status === 'yellow').length,
    0,
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">An at-a-glance look at your security posture.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-2xl font-extrabold tracking-tight">{assets.length}</p>
          <p className="mt-1 text-sm text-muted">Domains monitored</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-2xl font-extrabold tracking-tight text-danger-text">{needsAttention}</p>
          <p className="mt-1 text-sm text-muted">Issues needing attention</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-2xl font-extrabold tracking-tight text-warning-text">{toReview}</p>
          <p className="mt-1 text-sm text-muted">Issues to review</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-base font-semibold">Your domains</p>
          <Link href="/dashboard/domains" className="text-sm font-medium text-accent">
            Manage domains →
          </Link>
        </div>

        {!assets.length ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-muted">
              You&apos;re not monitoring any domains yet.
            </p>
            <Link
              href="/dashboard/domains"
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground"
            >
              Add your first domain
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {assets.map((asset) => {
              const grade = scoreToGrade(asset.score)
              return (
                <Link
                  key={asset.id}
                  href="/dashboard/domains"
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-pill"
                >
                  <span className="text-sm font-medium">{asset.domain}</span>
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${GRADE_STYLES[grade]}`}
                  >
                    {grade}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
