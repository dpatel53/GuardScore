import type { CheckStatus } from '@/lib/checks'

const STYLES: Record<CheckStatus, { bg: string; text: string; label: string }> = {
  green: { bg: 'bg-success-bg', text: 'text-success-text', label: 'Good' },
  yellow: { bg: 'bg-warning-bg', text: 'text-warning-text', label: 'Review' },
  red: { bg: 'bg-danger-bg', text: 'text-danger-text', label: 'Needs attention' },
  unknown: { bg: 'bg-surface', text: 'text-muted', label: 'Unknown' },
}

export default function StatusBadge({ status }: { status: CheckStatus }) {
  const s = STYLES[status]
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  )
}
