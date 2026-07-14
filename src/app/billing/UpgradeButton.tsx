'use client'

import { useState } from 'react'
import type { PlanId } from '@/lib/plans'

export default function UpgradeButton({
  plan,
  annual = false,
  label = 'Start free trial',
  variant = 'dark',
}: {
  plan: PlanId
  annual?: boolean
  label?: string
  variant?: 'dark' | 'light'
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ plan, interval: annual ? 'annual' : 'monthly' }),
      })
      // A non-JSON response (an unhandled 500, a redirect to an HTML page,
      // etc.) would otherwise throw inside res.json() and, since that's
      // after setLoading(true), leave the button stuck on "Redirecting…"
      // forever with no visible error. Guard against that explicitly.
      const data = await res.json().catch(() => null)

      if (!data || !data.ok) {
        setError(
          data?.message ?? `Something went wrong (status ${res.status}). Please try again or contact support.`,
        )
        return
      }
      window.location.href = data.url
    } catch {
      setError('Could not reach the server. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`w-full rounded-lg px-4 py-2.5 text-center text-sm font-medium disabled:opacity-60 ${
          variant === 'dark' ? 'bg-accent text-accent-foreground' : 'bg-white text-accent'
        }`}
      >
        {loading ? 'Redirecting…' : label}
      </button>
      {error && <p className="mt-2 text-xs text-danger-text">{error}</p>}
    </div>
  )
}
