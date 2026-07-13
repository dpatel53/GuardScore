import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { derivePageSpeedCheck, type CheckStatus } from '@/lib/checks'
import { checkUptime } from '@/lib/checks.server'
import { sendAlertEmail } from '@/lib/alerts.server'
import { sendAlertSms } from '@/lib/sms.server'
import { planById } from '@/lib/plans'
import { hasAdvancedFeatures } from '@/lib/planAccess.server'

// A deliberately lightweight, uptime-only sibling to /api/cron/run-all-checks:
// one fetch per domain instead of six, so it's cheap to call far more often
// than once a day. Vercel's free (Hobby) plan limits its own Cron Jobs to
// once per day, so on Hobby this route is meant to be triggered by a free
// external scheduler (cron-job.org, UptimeRobot's URL monitor, etc.) hitting
// this URL every few minutes with the same bearer token. On Vercel Pro you
// can instead add a second, more frequent entry to vercel.json.
export const maxDuration = 30

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

  const { data: notificationRows } = await supabase.from('notification_settings').select('user_id, alert_phone')
  const phoneByUser = new Map((notificationRows ?? []).map((r) => [r.user_id, r.alert_phone]))

  // SMS alerts are Business/Pro only — same reasoning as run-all-checks.
  const userIds = Array.from(new Set((assets ?? []).map((a) => a.user_id)))
  const { data: subRows } = userIds.length
    ? await supabase.from('subscriptions').select('user_id, plan').in('user_id', userIds)
    : { data: [] }
  const subPlanByUser = new Map((subRows ?? []).map((r) => [r.user_id, r.plan]))
  function userHasAdvancedFeatures(userId: string): boolean {
    return hasAdvancedFeatures(planById(subPlanByUser.get(userId) ?? 'business'))
  }

  let checked = 0
  let alertsSent = 0

  await Promise.all(
    (assets ?? []).map(async (asset) => {
      const { data: previousRow } = await supabase
        .from('checks')
        .select('status')
        .eq('asset_id', asset.id)
        .eq('check_type', 'uptime')
        .order('checked_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const result = await checkUptime(asset.domain)
      // Page speed is derived from the same fetch above, no extra request.
      const pageSpeed = derivePageSpeedCheck(result)
      await supabase.from('checks').insert([
        {
          asset_id: asset.id,
          check_type: result.check_type,
          status: result.status,
          summary: result.summary,
          detail: result.detail,
        },
        {
          asset_id: asset.id,
          check_type: pageSpeed.check_type,
          status: pageSpeed.status,
          summary: pageSpeed.summary,
          detail: pageSpeed.detail,
        },
      ])
      checked += 1

      const alertsPaused =
        asset.alerts_paused_until && new Date(asset.alerts_paused_until as string) > new Date()

      const previousStatus = previousRow?.status as CheckStatus | undefined
      const wentDown = result.status === 'red' && previousStatus !== undefined && previousStatus !== 'red'
      const ownerEmail = (asset as { users?: { email?: string } }).users?.email

      if (wentDown && !alertsPaused) {
        const subject = `GuardScore: ${asset.domain} appears to be down`
        const body = `${result.summary}\n\nWe'll keep checking and let you know if it's still down on the next pass.`

        if (ownerEmail) {
          await sendAlertEmail(ownerEmail, subject, body)
        }
        const phone = phoneByUser.get(asset.user_id)
        if (phone && userHasAdvancedFeatures(asset.user_id)) {
          // Downtime is the one alert worth waking someone up for, so SMS
          // matters most on this specific route.
          await sendAlertSms(phone, `${subject}\n${result.summary}`)
        }
        alertsSent += 1
      }
    }),
  )

  return NextResponse.json({ ok: true, checked, alertsSent })
}
