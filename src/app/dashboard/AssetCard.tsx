'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import StatusBadge from '@/components/StatusBadge'
import ScoreSparkline from '@/components/ScoreSparkline'
import { recheckAsset, removeAsset, pauseAlerts, resumeAlerts } from './actions'
import { CHECK_INFO } from '@/lib/checkInfo'
import { scoreToGrade, type CheckStatus, type CheckType } from '@/lib/checks'
import type { ScoreHistoryPoint, ThemeSummary } from '@/lib/dashboardData.server'
import ThematicReports from './ThematicReports'

const PAUSE_OPTIONS = [
  { label: '1 hour', hours: 1 },
  { label: '4 hours', hours: 4 },
  { label: '24 hours', hours: 24 },
  { label: '1 week', hours: 24 * 7 },
]

const GRADE_STYLES: Record<string, string> = {
  A: 'bg-success-bg text-success-text',
  B: 'bg-success-bg text-success-text',
  C: 'bg-warning-bg text-warning-text',
  D: 'bg-warning-bg text-warning-text',
  F: 'bg-danger-bg text-danger-text',
}

export interface LatestCheck {
  check_type: CheckType
  status: CheckStatus
  summary: string
  checked_at: string
}

// Rows worth surfacing (needs attention / to review) show their summary line
// right away, stacked under the label. Everything else stays collapsed to a
// single line — the point in both cases is that no row wraps a sentence of
// text next to a pill, which is what made a long check list feel cluttered.
function CheckRow({ check, showSummary = false }: { check: LatestCheck; showSummary?: boolean }) {
  const [open, setOpen] = useState(false)
  const info = CHECK_INFO[check.check_type]

  return (
    <div className="border-t border-border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start justify-between gap-3 py-2.5 text-left"
      >
        <span className="flex flex-col gap-0.5">
          <span className="text-sm">{info.label}</span>
          {showSummary && <span className="text-xs text-muted">{check.summary}</span>}
        </span>
        <span className="flex shrink-0 items-center gap-3 pt-0.5">
          <StatusBadge status={check.status} />
          <span
            className={`text-xs text-muted transition-transform ${open ? 'rotate-90' : ''}`}
            aria-hidden="true"
          >
            ▶
          </span>
        </span>
      </button>
      {open && (
        <div className="pb-3 pl-1 pr-1 text-sm">
          {!showSummary && <p className="mb-2 text-muted">{check.summary}</p>}
          <p className="mb-2">
            <span className="font-medium">Why it matters: </span>
            <span className="text-muted">{info.whyItMatters}</span>
          </p>
          <p>
            <span className="font-medium">What to do: </span>
            <span className="text-muted">{info.whatToDo}</span>
          </p>
        </div>
      )}
    </div>
  )
}

export default function AssetCard({
  assetId,
  domain,
  score,
  checks,
  lastCheckedAt,
  scoreHistory,
  alertsPausedUntil,
  uptimePercent30d,
  themes,
  hasAdvancedFeatures = true,
}: {
  assetId: string
  domain: string
  score: number
  checks: LatestCheck[]
  lastCheckedAt: string | null
  scoreHistory: ScoreHistoryPoint[]
  alertsPausedUntil: string | null
  uptimePercent30d: number | null
  themes: ThemeSummary[]
  // Shareable trust badge and maintenance windows (pause alerts) are
  // Business/Pro only. Defaults to true so nothing else calling this
  // component needs to change.
  hasAdvancedFeatures?: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [removing, setRemoving] = useState(false)
  const [pauseHours, setPauseHours] = useState(PAUSE_OPTIONS[1].hours)
  const [pausing, setPausing] = useState(false)
  const [showOther, setShowOther] = useState(false)

  const grade = scoreToGrade(score)
  const isPaused = alertsPausedUntil ? new Date(alertsPausedUntil) > new Date() : false

  // Group by severity so the things worth acting on float to the top and
  // aren't buried in a long, uniformly-styled list of 10+ checks.
  const attention = checks.filter((c) => c.status === 'red')
  const review = checks.filter((c) => c.status === 'yellow')
  const other = checks.filter((c) => c.status === 'green' || c.status === 'unknown')
  const otherGoodCount = other.filter((c) => c.status === 'green').length
  const otherUnknownCount = other.length - otherGoodCount

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="mb-1 flex items-center justify-between">
        <div>
          <p className="text-base font-semibold">{domain}</p>
          <p className="text-xs text-muted">
            {lastCheckedAt ? `Last checked ${new Date(lastCheckedAt).toLocaleString()}` : 'Not checked yet'}
            {uptimePercent30d !== null && ` · ${uptimePercent30d}% uptime, last 30 days`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`flex h-11 w-11 items-center justify-center rounded-full text-lg font-extrabold ${GRADE_STYLES[grade]}`}
          >
            {grade}
          </span>
          <span className="text-xs text-muted">{score}/100</span>
        </div>
      </div>

      <div className="mb-2">
        <ScoreSparkline points={scoreHistory} />
      </div>

      <ThematicReports themes={themes} />

      {isPaused && (
        <div className="mb-3 flex items-center justify-between rounded-lg bg-warning-bg px-3 py-2 text-xs text-warning-text">
          <span>
            Alerts paused until {new Date(alertsPausedUntil as string).toLocaleString()}. We&apos;re still
            checking and recording history, just not notifying you.
          </span>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await resumeAlerts(assetId)
                router.refresh()
              })
            }
            className="ml-3 shrink-0 font-medium underline disabled:opacity-60"
          >
            Resume alerts
          </button>
        </div>
      )}

      {attention.length > 0 || review.length > 0 ? (
        <div className="mb-1 flex flex-wrap gap-2">
          {attention.length > 0 && (
            <span className="rounded-full bg-danger-bg px-2.5 py-1 text-xs font-medium text-danger-text">
              {attention.length} need{attention.length === 1 ? 's' : ''} attention
            </span>
          )}
          {review.length > 0 && (
            <span className="rounded-full bg-warning-bg px-2.5 py-1 text-xs font-medium text-warning-text">
              {review.length} to review
            </span>
          )}
        </div>
      ) : (
        <div className="mb-1">
          <span className="rounded-full bg-success-bg px-2.5 py-1 text-xs font-medium text-success-text">
            All checks passing
          </span>
        </div>
      )}

      <div>
        {attention.map((c) => (
          <CheckRow key={c.check_type} check={c} showSummary />
        ))}
        {review.map((c) => (
          <CheckRow key={c.check_type} check={c} showSummary />
        ))}

        {other.length > 0 && (
          <div className="border-t border-border">
            <button
              type="button"
              onClick={() => setShowOther((o) => !o)}
              className="flex w-full items-center justify-between gap-3 py-2.5 text-left text-sm text-muted"
            >
              <span>
                {other.length} other check{other.length === 1 ? '' : 's'}
                {otherGoodCount > 0 && ` · ${otherGoodCount} good`}
                {otherUnknownCount > 0 && ` · ${otherUnknownCount} unknown`}
              </span>
              <span
                className={`text-xs transition-transform ${showOther ? 'rotate-90' : ''}`}
                aria-hidden="true"
              >
                ▶
              </span>
            </button>
            {showOther && other.map((c) => <CheckRow key={c.check_type} check={c} />)}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(async () => {
            await recheckAsset(assetId)
            router.refresh()
          })}
          className="rounded-full border border-border px-3.5 py-1.5 text-xs font-medium disabled:opacity-60"
        >
          {pending ? 'Checking…' : 'Re-check now'}
        </button>
        {hasAdvancedFeatures ? (
          <a
            href={`/badge/${domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-border px-3.5 py-1.5 text-xs font-medium"
          >
            Share badge
          </a>
        ) : (
          <a
            href="/billing"
            className="rounded-full border border-dashed border-border px-3.5 py-1.5 text-xs font-medium text-muted"
            title="Shareable trust badge is available on the Business and Pro plans"
          >
            Share badge 🔒
          </a>
        )}
        {!isPaused && hasAdvancedFeatures && (
          <div className="flex items-center gap-1.5">
            <select
              value={pauseHours}
              onChange={(e) => setPauseHours(Number(e.target.value))}
              className="rounded-full border border-border bg-surface px-2.5 py-1.5 text-xs font-medium"
              aria-label="Pause alerts duration"
            >
              {PAUSE_OPTIONS.map((opt) => (
                <option key={opt.hours} value={opt.hours}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={pausing}
              onClick={() => {
                setPausing(true)
                startTransition(async () => {
                  await pauseAlerts(assetId, pauseHours)
                  setPausing(false)
                  router.refresh()
                })
              }}
              className="rounded-full border border-border px-3.5 py-1.5 text-xs font-medium disabled:opacity-60"
            >
              Pause alerts
            </button>
          </div>
        )}
        {!isPaused && !hasAdvancedFeatures && (
          <a
            href="/billing"
            className="rounded-full border border-dashed border-border px-3.5 py-1.5 text-xs font-medium text-muted"
            title="Maintenance windows are available on the Business and Pro plans"
          >
            Pause alerts 🔒
          </a>
        )}
        <button
          type="button"
          disabled={removing}
          onClick={() => {
            setRemoving(true)
            startTransition(async () => {
              await removeAsset(assetId)
              router.refresh()
            })
          }}
          className="ml-auto text-xs text-muted hover:text-danger-text disabled:opacity-60"
        >
          Remove
        </button>
      </div>
    </div>
  )
}
