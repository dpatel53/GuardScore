'use client'

import { useState } from 'react'
import StatusBadge from '@/components/StatusBadge'
import ThemeDonut from '@/components/ThemeDonut'
import { CHECK_INFO } from '@/lib/checkInfo'
import { THEME_LABELS } from '@/lib/themes'
import type { ThemeSummary } from '@/lib/dashboardData.server'

// A quick, at-a-glance grouping of the same checks shown in the detailed
// list below — no new data collected, just the existing synthetic checks
// bucketed into named categories (Website Health, Site Security, Email
// Security, Domain) with a week-over-week trend, similar in spirit to a
// Site Audit tool's themed report cards.
function DeltaPill({ delta }: { delta: number | null }) {
  if (delta === null || delta === 0) return null
  const positive = delta > 0
  return (
    <span className={`text-xs font-medium ${positive ? 'text-success-text' : 'text-danger-text'}`}>
      {positive ? '+' : ''}
      {delta}%
    </span>
  )
}

export default function ThematicReports({ themes }: { themes: ThemeSummary[] }) {
  const [openTheme, setOpenTheme] = useState<string | null>(null)

  return (
    <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {themes.map((t) => {
        const isOpen = openTheme === t.theme
        return (
          <div key={t.theme} className="rounded-xl border border-border p-3">
            <p className="mb-2 text-xs font-medium text-muted">{THEME_LABELS[t.theme]}</p>
            <div className="flex items-center gap-2">
              <ThemeDonut percent={t.percent} />
              <DeltaPill delta={t.deltaVsWeekAgo} />
            </div>
            {t.checks.length > 0 ? (
              <button
                type="button"
                onClick={() => setOpenTheme(isOpen ? null : t.theme)}
                className="mt-2 text-xs font-medium text-accent"
              >
                {isOpen ? 'Hide details' : 'View details'}
              </button>
            ) : (
              <p className="mt-2 text-xs text-muted">Not checked yet</p>
            )}
            {isOpen && (
              <div className="mt-2 space-y-1.5 border-t border-border pt-2">
                {t.checks.map((c) => (
                  <div key={c.check_type} className="flex items-center justify-between gap-2">
                    <span className="text-xs">{CHECK_INFO[c.check_type].label}</span>
                    <StatusBadge status={c.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
