// Shared types and pure, no-I/O logic for GuardScore's checks. Deliberately
// free of any network calls or Node built-ins (like the `node:tls` used by
// the TLS strength check) so this file stays safe to import from Client
// Components (AssetCard.tsx uses scoreToGrade, for instance) — a real
// import here gets bundled for the browser, and Node built-ins can't be.
// All the actual check implementations (the ones that call out over the
// network) live in checks.server.ts instead.

export type CheckStatus = 'green' | 'yellow' | 'red' | 'unknown'

export type CheckType =
  | 'uptime'
  | 'page_speed'
  | 'ssl'
  | 'tls_strength'
  | 'domain_expiry'
  | 'spf'
  | 'spf_lookup_limit'
  | 'dkim'
  | 'dmarc'
  | 'headers'
  | 'blocklist'
  | 'cms_version'
  | 'bimi'
  | 'caa'
  | 'dnssec'

export interface CheckResult {
  check_type: CheckType
  status: CheckStatus
  summary: string
  detail: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Page speed — deliberately NOT a second fetch. It's derived from the timing
// already captured by checkUptime, so this check is free: no extra request
// to the customer's site. Uses tighter thresholds than uptime's "is it up at
// all" check, since a slow-but-technically-up homepage is its own problem
// (visitors leave, search rankings suffer) distinct from downtime.
// ---------------------------------------------------------------------------
const PAGE_SPEED_GOOD_MS = 1500
const PAGE_SPEED_OK_MS = 3500

export function derivePageSpeedCheck(uptime: CheckResult): CheckResult {
  const detail = uptime.detail as { responseTimeMs?: number; error?: string }
  const responseTimeMs = detail.responseTimeMs

  if (responseTimeMs === undefined || (uptime.status === 'red' && detail.error)) {
    return {
      check_type: 'page_speed',
      status: 'unknown',
      summary: "Couldn't measure page speed because the site didn't respond.",
      detail: {},
    }
  }

  let status: CheckStatus = 'green'
  if (responseTimeMs > PAGE_SPEED_OK_MS) status = 'red'
  else if (responseTimeMs > PAGE_SPEED_GOOD_MS) status = 'yellow'

  const seconds = (responseTimeMs / 1000).toFixed(1)
  const summary =
    status === 'green'
      ? `Homepage loads quickly, in ${seconds}s.`
      : status === 'yellow'
        ? `Homepage takes ${seconds}s to respond, noticeably slow for visitors.`
        : `Homepage takes ${seconds}s to respond. Many visitors leave before a page this slow finishes loading.`

  return { check_type: 'page_speed', status, summary, detail: { responseTimeMs } }
}

const STATUS_SCORE: Record<CheckStatus, number> = { green: 100, yellow: 60, red: 20, unknown: 50 }

export function computeOverallScore(results: Array<{ status: CheckStatus }>): number {
  if (!results.length) return 0
  const total = results.reduce((sum, r) => sum + STATUS_SCORE[r.status], 0)
  return Math.round(total / results.length)
}

export function scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A'
  if (score >= 75) return 'B'
  if (score >= 60) return 'C'
  if (score >= 40) return 'D'
  return 'F'
}
