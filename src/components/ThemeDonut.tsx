const SIZE = 68
const STROKE = 7

function colorFor(percent: number | null): string {
  if (percent === null) return '#94a3b8'
  if (percent >= 90) return '#15803d'
  if (percent >= 60) return '#b45309'
  return '#b91c1c'
}

// Same green/amber/red severity coloring used everywhere else in the app
// (StatusBadge, ScoreSparkline, DomainScoreBars) — so a glance at the ring
// color already tells you which theme needs attention, not just the number.
export default function ThemeDonut({ percent }: { percent: number | null }) {
  const r = (SIZE - STROKE) / 2
  const circumference = 2 * Math.PI * r
  const value = percent ?? 0
  const dash = (value / 100) * circumference
  const color = colorFor(percent)

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="shrink-0">
      <circle cx={SIZE / 2} cy={SIZE / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={STROKE} />
      {percent !== null && (
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      )}
      <text
        x={SIZE / 2}
        y={SIZE / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="15"
        fontWeight="700"
        fill={percent === null ? '#94a3b8' : '#0f172a'}
      >
        {percent === null ? '—' : `${percent}%`}
      </text>
    </svg>
  )
}
