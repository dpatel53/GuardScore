import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPortfolioAnalytics } from '@/lib/dashboardData.server'
import { getUserPlan, hasAdvancedFeatures } from '@/lib/planAccess.server'
import PortfolioTrendChart from '@/components/PortfolioTrendChart'
import DomainScoreBars from '@/components/DomainScoreBars'
import SeverityBreakdownBar from '@/components/SeverityBreakdownBar'
import UpgradeNotice from '@/components/UpgradeNotice'
import ReportSettingsForm from './ReportSettingsForm'

export default async function ReportsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const plan = await getUserPlan(supabase, user.id)
  if (!hasAdvancedFeatures(plan)) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Reports</h1>
          <p className="mt-1 text-sm text-muted">Trends across everything you monitor.</p>
        </div>
        <UpgradeNotice feature="The Reports dashboard" />
      </div>
    )
  }

  const [analytics, { data: notificationSettings }] = await Promise.all([
    getPortfolioAnalytics(supabase, user.id),
    supabase.from('notification_settings').select('weekly_report_enabled').eq('user_id', user.id).maybeSingle(),
  ])

  const avgScore = analytics.domainScores.length
    ? Math.round(
        analytics.domainScores.reduce((sum, d) => sum + d.score, 0) / analytics.domainScores.length,
      )
    : null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Reports</h1>
          <p className="mt-1 text-sm text-muted">Trends across everything you monitor.</p>
        </div>
        <a
          href="/api/reports/pdf"
          className="rounded-full border border-border px-4 py-2 text-sm font-medium"
        >
          Download PDF report
        </a>
      </div>

      {!analytics.domainScores.length ? (
        <p className="rounded-2xl border border-border bg-surface p-6 text-sm text-muted">
          Add a domain on the Domains page to start seeing trends here.
        </p>
      ) : (
        <>
          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold">Portfolio score trend</p>
              {avgScore !== null && (
                <span className="text-sm text-muted">
                  Average: <span className="font-semibold text-foreground">{avgScore}/100</span>
                </span>
              )}
            </div>
            <PortfolioTrendChart points={analytics.trend} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface p-6">
              <p className="mb-4 text-sm font-semibold">Score by domain</p>
              <DomainScoreBars domains={analytics.domainScores} />
            </div>

            <div className="rounded-2xl border border-border bg-surface p-6">
              <p className="mb-4 text-sm font-semibold">Issues by severity</p>
              <SeverityBreakdownBar severity={analytics.severity} />
            </div>
          </div>
        </>
      )}

      <div className="rounded-2xl border border-border bg-surface p-6">
        <p className="mb-1 text-sm font-semibold">Weekly email report</p>
        <p className="mb-4 text-sm text-muted">
          A Monday-morning summary of your portfolio average score and every domain&apos;s grade,
          sent to {user.email}.
        </p>
        <ReportSettingsForm weeklyReportEnabled={notificationSettings?.weekly_report_enabled ?? false} />
      </div>
    </div>
  )
}
