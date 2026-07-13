'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPortfolioAnalytics } from '@/lib/dashboardData.server'
import { sendWeeklyReportEmail } from '@/lib/reportEmail.server'
import { getUserPlan, hasAdvancedFeatures } from '@/lib/planAccess.server'

const UPGRADE_MESSAGE = 'Reports are available on the Business and Pro plans. Upgrade on the billing page to unlock them.'

export async function updateWeeklyReport(_prevState: { error: string | null }, formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const plan = await getUserPlan(supabase, user.id)
  if (!hasAdvancedFeatures(plan)) return { error: UPGRADE_MESSAGE }

  const enabled = formData.get('weeklyReportEnabled') === 'on'

  const { error } = await supabase
    .from('notification_settings')
    .upsert({ user_id: user.id, weekly_report_enabled: enabled }, { onConflict: 'user_id' })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/reports')
  return { error: null }
}

// Lets a user see exactly what the weekly digest looks like without waiting
// for Monday — reuses the same analytics + email builder the cron route
// uses, so the preview is never out of sync with the real thing.
export async function sendReportPreviewNow(): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!user.email) return { error: 'No email on file for your account.' }

  const plan = await getUserPlan(supabase, user.id)
  if (!hasAdvancedFeatures(plan)) return { error: UPGRADE_MESSAGE }

  const analytics = await getPortfolioAnalytics(supabase, user.id)
  if (!analytics.domainScores.length) {
    return { error: 'Add a domain first, there\'s nothing to report on yet.' }
  }

  await sendWeeklyReportEmail(user.email, analytics)
  return { error: null }
}
