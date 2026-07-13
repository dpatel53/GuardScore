import type { SupabaseClient } from '@supabase/supabase-js'
import { computeOverallScore, scoreToGrade, type CheckStatus, type CheckType } from './checks'
import { planById } from './plans'
import { hasAdvancedFeatures } from './planAccess.server'
import { THEME_ORDER, THEME_CHECKS, type Theme } from './themes'

export const CHECK_ORDER: CheckType[] = [
  'uptime',
  'page_speed',
  'ssl',
  'tls_strength',
  'domain_expiry',
  'blocklist',
  'spf',
  'spf_lookup_limit',
  'dkim',
  'dmarc',
  'bimi',
  'headers',
  'cms_version',
  'caa',
  'dnssec',
]

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

// How far back to look for a "week ago" comparison point for each theme's
// trend arrow — matches the run closest to, but not after, this cutoff.
const WEEK_AGO_MS = 7 * 24 * 60 * 60 * 1000

export interface ThemeSummary {
  theme: Theme
  // null until at least one check in this theme has ever run for the asset.
  percent: number | null
  // null when there's no run from ~a week ago to compare against yet
  // (e.g. a domain added less than a week ago).
  deltaVsWeekAgo: number | null
  checks: LatestCheckRow[]
}

export interface LatestCheckRow {
  check_type: CheckType
  status: CheckStatus
  summary: string
  checked_at: string
}

export interface ScoreHistoryPoint {
  checkedAt: string
  score: number
}

export interface AssetWithChecks {
  id: string
  domain: string
  email_domain: string
  created_at: string
  checks: LatestCheckRow[]
  score: number
  lastCheckedAt: string | null
  scoreHistory: ScoreHistoryPoint[]
  alertsPausedUntil: string | null
  uptimePercent30d: number | null
  themes: ThemeSummary[]
}

// 30 instead of a tighter number so the same per-asset history can also
// back the 30-day portfolio trend chart on the Reports page, not just the
// small sparkline on each domain card.
const SCORE_HISTORY_LIMIT = 30

// Loads every domain for a user plus the latest result of each check type,
// server-side only (used by the dashboard overview, domains, and alerts
// pages so the query logic lives in one place).
export async function getUserAssetsWithChecks(
  supabase: SupabaseClient,
  userId: string,
): Promise<AssetWithChecks[]> {
  const { data: assets } = await supabase
    .from('assets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  const assetIds = (assets ?? []).map((a) => a.id)

  const { data: allChecks } = assetIds.length
    ? await supabase
        .from('checks')
        .select('*')
        .in('asset_id', assetIds)
        .order('checked_at', { ascending: false })
    : { data: [] }

  const latestByAsset = new Map<string, Map<CheckType, LatestCheckRow>>()
  // Every check in one cron/manual run is inserted in a single statement, so
  // rows from the same run share an identical checked_at — grouping by exact
  // timestamp reconstructs each historical "run" without a second query.
  // Keeping check_type alongside each status (not just the status) is what
  // lets a themed score be recomputed for any past run, for the trend arrow
  // on each theme card.
  const runsByAsset = new Map<string, Map<string, { check_type: CheckType; status: CheckStatus }[]>>()
  // Reuses the same already-fetched rows to compute a 30-day uptime %,
  // instead of a second query against the checks table.
  const uptimeRowsByAsset = new Map<string, { status: CheckStatus; checked_at: string }[]>()

  for (const row of allChecks ?? []) {
    const forAsset = latestByAsset.get(row.asset_id) ?? new Map<CheckType, LatestCheckRow>()
    if (!forAsset.has(row.check_type)) {
      forAsset.set(row.check_type, {
        check_type: row.check_type,
        status: row.status as CheckStatus,
        summary: row.summary,
        checked_at: row.checked_at,
      })
    }
    latestByAsset.set(row.asset_id, forAsset)

    const runs = runsByAsset.get(row.asset_id) ?? new Map<string, { check_type: CheckType; status: CheckStatus }[]>()
    const entries = runs.get(row.checked_at) ?? []
    entries.push({ check_type: row.check_type, status: row.status as CheckStatus })
    runs.set(row.checked_at, entries)
    runsByAsset.set(row.asset_id, runs)

    if (row.check_type === 'uptime') {
      const uptimeRows = uptimeRowsByAsset.get(row.asset_id) ?? []
      uptimeRows.push({ status: row.status as CheckStatus, checked_at: row.checked_at })
      uptimeRowsByAsset.set(row.asset_id, uptimeRows)
    }
  }

  return (assets ?? []).map((asset) => {
    const checksMap = latestByAsset.get(asset.id) ?? new Map<CheckType, LatestCheckRow>()
    const checks = CHECK_ORDER.map((t) => checksMap.get(t)).filter(
      (c): c is LatestCheckRow => c !== undefined,
    )
    const lastCheckedAt = checks.length
      ? checks.reduce((max, c) => (c.checked_at > max ? c.checked_at : max), checks[0].checked_at)
      : null

    const runs = runsByAsset.get(asset.id) ?? new Map<string, { check_type: CheckType; status: CheckStatus }[]>()
    const scoreHistory: ScoreHistoryPoint[] = Array.from(runs.entries())
      .map(([checkedAt, entries]) => ({
        checkedAt,
        score: computeOverallScore(entries),
      }))
      .sort((a, b) => (a.checkedAt < b.checkedAt ? -1 : 1))
      .slice(-SCORE_HISTORY_LIMIT)

    // The run closest to, but not after, ~7 days ago — used as the "before"
    // point for each theme's trend arrow below.
    const weekAgoCutoff = Date.now() - WEEK_AGO_MS
    let weekAgoEntries: { check_type: CheckType; status: CheckStatus }[] | null = null
    let weekAgoRunTime = -Infinity
    for (const [checkedAt, entries] of runs.entries()) {
      const t = new Date(checkedAt).getTime()
      if (t <= weekAgoCutoff && t > weekAgoRunTime) {
        weekAgoRunTime = t
        weekAgoEntries = entries
      }
    }

    const themes: ThemeSummary[] = THEME_ORDER.map((theme) => {
      const themeCheckTypes = THEME_CHECKS[theme]
      const themeChecks = checks.filter((c) => themeCheckTypes.includes(c.check_type))
      const percent = themeChecks.length ? computeOverallScore(themeChecks) : null

      let deltaVsWeekAgo: number | null = null
      if (percent !== null && weekAgoEntries) {
        const pastEntries = weekAgoEntries.filter((e) => themeCheckTypes.includes(e.check_type))
        if (pastEntries.length) {
          deltaVsWeekAgo = percent - computeOverallScore(pastEntries)
        }
      }

      return { theme, percent, deltaVsWeekAgo, checks: themeChecks }
    })

    // "Up" here means the site responded at all (green or yellow) — yellow
    // covers slow responses and 4xx error pages, both of which still mean
    // the server answered. Only "red" (no response / 5xx) counts as down.
    const cutoff = Date.now() - THIRTY_DAYS_MS
    const recentUptimeRows = (uptimeRowsByAsset.get(asset.id) ?? []).filter(
      (r) => new Date(r.checked_at).getTime() >= cutoff,
    )
    const uptimePercent30d = recentUptimeRows.length
      ? Math.round(
          (recentUptimeRows.filter((r) => r.status !== 'red').length / recentUptimeRows.length) * 1000,
        ) / 10
      : null

    return {
      id: asset.id,
      domain: asset.domain,
      email_domain: asset.email_domain,
      created_at: asset.created_at,
      checks,
      score: computeOverallScore(checks),
      lastCheckedAt,
      scoreHistory,
      alertsPausedUntil: (asset.alerts_paused_until as string | null) ?? null,
      uptimePercent30d,
      themes,
    }
  })
}

export interface PublicBadgeData {
  domain: string
  score: number
  grade: string
  lastCheckedAt: string | null
  // The shareable trust badge itself is a Business/Pro feature. The domain
  // may be monitored and have a real score, but if the owner is on Starter
  // this comes back true and callers should show a "not shareable on this
  // plan" state rather than the grade — never claim the domain isn't
  // monitored when it actually is.
  planRestricted: boolean
}

// Public lookup by domain name for the shareable trust badge — takes an
// admin (service-role) client since this is queried with no logged-in user.
// Returns ONLY the aggregate grade, deliberately never per-check detail; see
// src/lib/badge.ts for why.
export async function getPublicScoreForDomain(
  supabase: SupabaseClient,
  domain: string,
): Promise<PublicBadgeData | null> {
  const { data: asset } = await supabase
    .from('assets')
    .select('id, domain, user_id')
    .ilike('domain', domain)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!asset) return null

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', asset.user_id)
    .maybeSingle()
  const planRestricted = !hasAdvancedFeatures(planById(sub?.plan ?? 'business'))

  const { data: checkRows } = await supabase
    .from('checks')
    .select('check_type, status, checked_at')
    .eq('asset_id', asset.id)
    .order('checked_at', { ascending: false })

  const latestByType = new Map<CheckType, { status: CheckStatus; checked_at: string }>()
  for (const row of checkRows ?? []) {
    if (!latestByType.has(row.check_type)) {
      latestByType.set(row.check_type, { status: row.status as CheckStatus, checked_at: row.checked_at })
    }
  }

  const checks = Array.from(latestByType.values())
  if (!checks.length) return null

  const score = computeOverallScore(checks)
  const lastCheckedAt = checks.reduce(
    (max, c) => (c.checked_at > max ? c.checked_at : max),
    checks[0].checked_at,
  )

  return { domain: asset.domain, score, grade: scoreToGrade(score), lastCheckedAt, planRestricted }
}

export interface PortfolioTrendPoint {
  date: string
  avgScore: number
}

export interface DomainScoreSummary {
  domain: string
  score: number
  grade: string
}

export interface SeverityCounts {
  attention: number
  review: number
  good: number
  unknown: number
}

export interface DomainIssue {
  checkType: CheckType
  status: CheckStatus
  summary: string
}

export interface DomainIssues {
  domain: string
  issues: DomainIssue[]
}

export interface PortfolioAnalytics {
  trend: PortfolioTrendPoint[]
  domainScores: DomainScoreSummary[]
  severity: SeverityCounts
  domainIssues: DomainIssues[]
}

const SEVERITY_RANK: Record<CheckStatus, number> = { red: 0, yellow: 1, unknown: 2, green: 3 }

const ANALYTICS_TREND_DAYS = 30

// Everything the Reports page needs, built entirely from
// getUserAssetsWithChecks's output — no second query against the checks
// table. The portfolio trend buckets each asset's per-run score history by
// calendar day (assets in the same cron pass don't share an exact
// timestamp, unlike checks within one asset's own run) and averages
// whatever domains have a data point that day.
export async function getPortfolioAnalytics(
  supabase: SupabaseClient,
  userId: string,
): Promise<PortfolioAnalytics> {
  const assets = await getUserAssetsWithChecks(supabase, userId)

  const domainScores: DomainScoreSummary[] = assets.map((a) => ({
    domain: a.domain,
    score: a.score,
    grade: scoreToGrade(a.score),
  }))

  const severity: SeverityCounts = { attention: 0, review: 0, good: 0, unknown: 0 }
  for (const asset of assets) {
    for (const check of asset.checks) {
      if (check.status === 'red') severity.attention += 1
      else if (check.status === 'yellow') severity.review += 1
      else if (check.status === 'green') severity.good += 1
      else severity.unknown += 1
    }
  }

  // Every non-green check, per domain, worst severity first — the same
  // "needs attention" / "to review" / "unknown" grouping the dashboard uses,
  // just flattened into a list for the report instead of collapsible cards.
  const domainIssues: DomainIssues[] = assets.map((asset) => ({
    domain: asset.domain,
    issues: asset.checks
      .filter((c) => c.status !== 'green')
      .sort((a, b) => SEVERITY_RANK[a.status] - SEVERITY_RANK[b.status])
      .map((c) => ({ checkType: c.check_type, status: c.status, summary: c.summary })),
  }))

  const byDay = new Map<string, number[]>()
  for (const asset of assets) {
    for (const point of asset.scoreHistory) {
      const day = point.checkedAt.slice(0, 10) // YYYY-MM-DD
      const scores = byDay.get(day) ?? []
      scores.push(point.score)
      byDay.set(day, scores)
    }
  }

  const cutoff = Date.now() - ANALYTICS_TREND_DAYS * 24 * 60 * 60 * 1000
  const trend: PortfolioTrendPoint[] = Array.from(byDay.entries())
    .filter(([day]) => new Date(day).getTime() >= cutoff)
    .map(([date, scores]) => ({
      date,
      avgScore: Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length),
    }))
    .sort((a, b) => (a.date < b.date ? -1 : 1))

  return { trend, domainScores, severity, domainIssues }
}
