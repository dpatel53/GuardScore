import type { ScoreHistoryPoint } from '@/lib/dashboardData.server'

const WIDTH = 220
const HEIGHT = 44
const PADDING = 4

function colorFor(score: number): string {
  if (score >= 80) return '#15803d'
  if (score >= 50) return '#b45309'
  return '#b91c1c'
}

export default function ScoreSparkline({ points }: { points: ScoreHistoryPoint[] }) {
  if (points.length < 2) {
    return <p className="text-xs text-muted">Score history builds up as we run more checks.</p>
  }

  const usableWidth = WIDTH - PADDING * 2
  const usableHeight = HEIGHT - PADDING * 2
  const step = usableWidth / (points.length - 1)

  const coords = points.map((p, i) => {
    const x = PADDING + i * step
    const y = PADDING + usableHeight * (1 - p.score / 100)
    return { x, y }
  })

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')
  const lastPoint = coords[coords.length - 1]
  const lastScore = points[points.length - 1].score

  return (
    <div className="flex items-center gap-2">
      <svg
        width={WIDTH}
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Score trend over the last ${points.length} checks, currently ${lastScore}`}
      >
        <path d={linePath} fill="none" stroke={colorFor(lastScore)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={lastPoint.x} cy={lastPoint.y} r="2.5" fill={colorFor(lastScore)} />
      </svg>
      <span className="text-xs text-muted">last {points.length} checks</span>
    </div>
  )
}
