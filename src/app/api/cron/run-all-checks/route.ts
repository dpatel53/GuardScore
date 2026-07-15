import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { CheckStatus } from '@/lib/checks'
import { runAllChecks } from '@/lib/checks.server'
import { sendAlertEmail } from '@/lib/alerts.server'
import { getPortfolioAnalytics } from '@/lib/dashboardData.server'
import { sendWeeklyReportEmail } from '@/lib/reportEmail.server'
import { planById } from '@/lib/plans'
import { hasAdvancedFeatures, hasActiveAccess } from '@/lib/planAccess.server'

// Triggered daily by Vercel Cron (see vercel.json) or any external scheduler
// that can send an authorization header. Re-checks every asset on file and,
// when a check flips from a healthy state to a bad one, sends an email alert
// (only if RESEND_API_KEY is configured — otherwise this step is skipped,
// never faked). Uptime is included here too, but for real-time downtime
// detection see the dedicated /api/cron/check-uptime route, which is cheap
// enough to poll far more often than once a day.
//
// The weekly report digest also lives here rather than as its own cron
// route: Vercel's Hobby plan only guarantees this one daily trigger, so
// instead of requiring a second scheduled route (and the deploy complexity
// that comes with it), this route just checks "is today the scheduled
// report day" after it finishes the day's checks and sends digests then.
export const maxDuration = 60

const WEEKLY_REPORT_DAY = 1 // Monday (Date#getDay(): 0 = Sunday)

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, code: 'unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data: assets, error } = await supabase.from('assets').select('*, users:user_id(email)')
  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
  }

  // notification_settings has no direct foreign-key path from assets for
  // PostgREST to embed in the query above (both merely reference
  // auth.users), so it's loaded once here instead.
  const { data: notificationRows } = await supabase
    .from('notification_settings')
    .select('user_id, weekly_report_enabled')

  // Built from the same assets query above rather than a second lookup —
  // whichever asset happens to carry each user's email is enough.
  const emailByUser = new Map<string, string>()
  for (const asset of assets ?? []) {
    const email = (asset as { users?: { email?: string } }).users?.email
    if (email) emailByUser.set(asset.user_id, email)
  }

  // The weekly report is Business/Pro only. One query for every user's plan
  // here, rather than a lookup per asset in the loop below — someone who
  // enabled it and later downgraded to Starter should stop receiving it,
  // not just lose access to the settings UI.
  const userIds = Array.from(
    new Set([...(assets ?? []).map((a) => a.user_id), ...(notificationRows ?? []).map((r) => r.user_id)]),
  )
  const { data: subRows } = userIds.length
    ? await supabase.from('subscriptions').select('user_id, plan, status, trial_ends_at').in('user_id', userIds)
    : { data: [] }
  const subByUser = new Map((subRows ?? []).map((r) => [r.user_id, r]))
  const subPlanByUser = new Map((subRows ?? []).map((r) => [r.user_id, r.plan]))
  function userHasAdvancedFeatures(userId: string): boolean {
    return hasAdvancedFeatures(planById(subPlanByUser.get(userId) ?? 'business'))
  }
  function userHasAccess(userId: string): boolean {
    return hasActiveAccess(subByUser.get(userId))
  }

  let checked = 0
  let alertsSent = 0

  // An expired trial or lapsed subscription pauses monitoring entirely --
  // no new checks, no alerts -- until the customer subscribes again.
  const activeAssets = (assets ?? []).filter((asset) => userHasAccess(asset.user_id))

  for (const asset of activeAssets) {
    // Latest previous status per check_type, to detect a green/yellow -> red flip.
    const { data: previous } = await supabase
      .from('checks')
      .select('check_type, status')
      .eq('asset_id', asset.id)
      .order('checked_at', { ascending: false })
      .limit(20)

    const previousByType = new Map<string, CheckStatus>()
    for (const row of previous ?? []) {
      if (!previousByType.has(row.check_type)) previousByType.set(row.check_type, row.status as CheckStatus)
    }

    const results = await runAllChecks(asset.domain, asset.email_domain)
    await supabase.from('checks').insert(
      results.map((r) => ({
        asset_id: asset.id,
        check_type: r.check_type,
        status: r.status,
        summary: r.summary,
        detail: r.detail,
      })),
    )
    checked += 1

    const worsened = results.filter((r) => {
      const prev = previousByType.get(r.check_type)
      const rank: Record<CheckStatus, number> = { green: 0, yellow: 1, red: 2, unknown: 1 }
      return prev !== undefined && rank[r.status] > rank[prev]
    })

    const alertsPaused =
      asset.alerts_paused_until && new Date(asset.alerts_paused_until as string) > new Date()

    const ownerEmail = (asset as { users?: { email?: string } }).users?.email
    if (worsened.length && !alertsPaused) {
      const subject = `GuardScore: ${worsened.length} new issue${worsened.length > 1 ? 's' : ''} on ${asset.domain}`
      const body = worsened.map((r) => `- ${r.check_type}: ${r.summary}`).join('\n')

      if (ownerEmail) {
        await sendAlertEmail(ownerEmail, subject, body)
      }
      alertsSent += 1
    }
  }

  let weeklyReportsSent = 0
  if (new Date().getDay() === WEEKLY_REPORT_DAY) {
    const optedInUserIds = (notificationRows ?? [])
      .filter((r) => r.weekly_report_enabled && userHasAdvancedFeatures(r.user_id) && userHasAccess(r.user_id))
      .map((r) => r.user_id)

    for (const userId of optedInUserIds) {
      const email = emailByUser.get(userId)
      if (!email) continue // no assets to report on
      const analytics = await getPortfolioAnalytics(supabase, userId)
      await sendWeeklyReportEmail(email, analytics)
      weeklyReportsSent += 1
    }
  }

  return NextResponse.json({ ok: true, checked, alertsSent, weeklyReportsSent })
}
