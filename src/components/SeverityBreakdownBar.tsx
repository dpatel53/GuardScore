import type { SeverityCounts } from '@/lib/dashboardData.server'

const SEGMENTS: { key: keyof SeverityCounts; label: string; color: string }[] = [
  { key: 'attention', label: 'Needs attention', color: '#b91c1c' },
  { key: 'review', label: 'To review', color: '#b45309' },
  { key: 'good', label: 'Good', color: '#15803d' },
  { key: 'unknown', label: 'Unknown', color: '#94a3b8' },
]

export default function SeverityBreakdownBar({ severity }: { severity: SeverityCounts }) {
  const total = severity.attention + severity.review + severity.good + severity.unknown

  if (!total) {
    return <p className="text-sm text-muted">No checks recorded yet.</p>
  }

  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-pill">
        {SEGMENTS.map((s) => {
          const count = severity[s.key]
          if (!count) return null
          return (
            <div
              key={s.key}
              style={{ width: `${(count / total) * 100}%`, backgroundColor: s.color }}
              title={`${s.label}: ${count}`}
            />
          )
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted">
        {SEGMENTS.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label} ({severity[s.key]})
          </span>
        ))}
      </div>
    </div>
  )
}
