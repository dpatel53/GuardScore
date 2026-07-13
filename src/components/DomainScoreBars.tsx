import type { DomainScoreSummary } from '@/lib/dashboardData.server'

const GRADE_COLORS: Record<string, string> = {
  A: '#15803d',
  B: '#15803d',
  C: '#b45309',
  D: '#b45309',
  F: '#b91c1c',
}

export default function DomainScoreBars({ domains }: { domains: DomainScoreSummary[] }) {
  if (!domains.length) {
    return <p className="text-sm text-muted">Add a domain to see it here.</p>
  }

  const sorted = [...domains].sort((a, b) => a.score - b.score)

  return (
    <div className="flex flex-col gap-3">
      {sorted.map((d) => (
        <div key={d.domain} className="flex items-center gap-3">
          <span className="w-32 shrink-0 truncate text-sm" title={d.domain}>
            {d.domain}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-pill">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.max(d.score, 4)}%`, backgroundColor: GRADE_COLORS[d.grade] ?? '#64748b' }}
            />
          </div>
          <span className="w-16 shrink-0 text-right text-xs text-muted">{d.score}/100</span>
        </div>
      ))}
    </div>
  )
}
