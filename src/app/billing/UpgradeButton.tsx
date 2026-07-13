'use client'

import { useState } from 'react'
import type { PlanId } from '@/lib/plans'

export default function UpgradeButton({
  plan,
  label = 'Start free trial',
  variant = 'dark',
}: {
  plan: PlanId
  label?: string
  variant?: 'dark' | 'light'
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const data = await res.json()
    setLoading(false)

    if (!data.ok) {
      setError(data.message ?? 'Billing is not set up yet. Add your Stripe keys to enable this.')
      return
    }
    window.location.href = data.url
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
