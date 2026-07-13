'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { runAllChecks } from '@/lib/checks.server'
import { getUserPlan, hasAdvancedFeatures } from '@/lib/planAccess.server'

const UPGRADE_MESSAGE = 'This feature is available on the Business and Pro plans. Upgrade on the billing page to unlock it.'

function normalizeDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
}

export async function addAsset(_prevState: { error: string | null }, formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const domain = normalizeDomain(String(formData.get('domain') ?? ''))
  const emailDomainRaw = String(formData.get('emailDomain') ?? '').trim()
  const emailDomain = emailDomainRaw ? normalizeDomain(emailDomainRaw) : domain

  if (!domain) return { error: 'Enter a domain.' }

  const [{ count: existingCount }, plan] = await Promise.all([
    supabase.from('assets').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    getUserPlan(supabase, user.id),
  ])
  const limit = plan.domainLimit

  if ((existingCount ?? 0) >= limit) {
    return { error: `Your plan allows up to ${limit} domain${limit === 1 ? '' : 's'}. Upgrade on the billing page to add more.` }
  }

  const { data: asset, error } = await supabase
    .from('assets')
    .insert({ user_id: user.id, domain, email_domain: emailDomain })
    .select()
    .single()

  if (error || !asset) {
    return { error: error?.message ?? 'Could not save that domain.' }
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

  revalidatePath('/dashboard')
  return { error: null }
}

export async function recheckAsset(assetId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: asset } = await supabase
    .from('assets')
    .select('*')
    .eq('id', assetId)
    .eq('user_id', user.id)
    .single()

  if (!asset) return { error: 'Domain not found.' }

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

  revalidatePath('/dashboard')
  return { error: null }
}

export async function removeAsset(assetId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase.from('assets').delete().eq('id', assetId).eq('user_id', user.id)
  revalidatePath('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

// Maintenance windows: mute alerts for a domain without stopping monitoring.
// Checks keep running and history keeps building — only the email/SMS send
// is skipped by the cron routes while alerts_paused_until is in the future.
const MAX_PAUSE_HOURS = 24 * 14 // 2 weeks, generous ceiling against a bad input

export async function pauseAlerts(assetId: string, hours: number) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const plan = await getUserPlan(supabase, user.id)
  if (!hasAdvancedFeatures(plan)) return { error: UPGRADE_MESSAGE }

  const clampedHours = Math.min(Math.max(hours, 1), MAX_PAUSE_HOURS)
  const pausedUntil = new Date(Date.now() + clampedHours * 60 * 60 * 1000).toISOString()

  const { error } = await supabase
    .from('assets')
    .update({ alerts_paused_until: pausedUntil })
    .eq('id', assetId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/domains')
  return { error: null }
}

export async function resumeAlerts(assetId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase
    .from('assets')
    .update({ alerts_paused_until: null })
    .eq('id', assetId)
    .eq('user_id', user.id)

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/domains')
}

export async function updateAlertPhone(_prevState: { error: string | null }, formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const raw = String(formData.get('alertPhone') ?? '').trim()
  const alertPhone = raw ? raw : null

  if (alertPhone && !/^\+?[1-9]\d{7,14}$/.test(alertPhone.replace(/[\s()-]/g, ''))) {
    return { error: 'Enter a phone number in international format, e.g. +15551234567.' }
  }

  // Clearing the number back to blank is always allowed, even on Starter —
  // only setting a new one requires an upgrade.
  if (alertPhone) {
    const plan = await getUserPlan(supabase, user.id)
    if (!hasAdvancedFeatures(plan)) return { error: UPGRADE_MESSAGE }
  }

  const { error } = await supabase
    .from('notification_settings')
    .upsert({ user_id: user.id, alert_phone: alertPhone }, { onConflict: 'user_id' })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings')
  return { error: null }
}
