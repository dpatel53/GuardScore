import type { PortfolioTrendPoint } from '@/lib/dashboardData.server'

const WIDTH = 640
const HEIGHT = 200
const PADDING_X = 14
const PADDING_TOP = 16
const PADDING_BOTTOM = 26

function colorFor(score: number): string {
  if (score >= 80) return '#15803d'
  if (score >= 50) return '#b45309'
  return '#b91c1c'
}

function formatDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// A bigger sibling of ScoreSparkline: same "one line, colored by current
// value" approach, just with gridlines and date labels since this is the
// headline chart on the Reports page rather than a small per-card glance.
export default function PortfolioTrendChart({ points }: { points: PortfolioTrendPoint[] }) {
  if (points.length < 2) {
    return (
      <p className="text-sm text-muted">
        Portfolio trend builds up once we&apos;ve run a few days of checks across your domains.
      </p>
    )
  }

  const usableWidth = WIDTH - PADDING_X * 2
  const usableHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM
  const step = usableWidth / (points.length - 1)

  const coords = points.map((p, i) => ({
    x: PADDING_X + i * step,
    y: PADDING_TOP + usableHeight * (1 - p.avgScore / 100),
  }))

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')
  const floorY = PADDING_TOP + usableHeight
  const areaPath = `${linePath} L${coords[coords.length - 1].x.toFixed(1)},${floorY} L${coords[0].x.toFixed(1)},${floorY} Z`
  const lastScore = points[points.length - 1].avgScore
  const color = colorFor(lastScore)

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={`Portfolio average score trend over ${points.length} days, currently ${lastScore}`}
    >
      {[0, 50, 100].map((mark) => {
        const y = PADDING_TOP + usableHeight * (1 - mark / 100)
        return (
          <g key={mark}>
            <line x1={PADDING_X} x2={WIDTH - PADDING_X} y1={y} y2={y} stroke="#e2e8f0" strokeWidth="1" />
            <text x={2} y={y - 3} fontSize="9" fill="#94a3b8">
              {mark}
            </text>
          </g>
        )
      })}
      <path d={areaPath} fill={color} fillOpacity="0.08" stroke="none" />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={i === coords.length - 1 ? 3 : 1.5} fill={color} />
      ))}
      <text x={PADDING_X} y={HEIGHT - 8} fontSize="10" fill="#64748b">
        {formatDate(points[0].date)}
      </text>
      <text x={WIDTH - PADDING_X} y={HEIGHT - 8} fontSize="10" fill="#64748b" textAnchor="end">
        {formatDate(points[points.length - 1].date)}
      </text>
    </svg>
  )
}
