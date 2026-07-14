'use client'

import { useState } from 'react'

// Sends the customer to Stripe's hosted Customer Portal, where they can
// update their payment method, view invoices, and cancel their subscription.
// This is the only cancellation path in the app — see api/stripe/portal.
export default function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json().catch(() => null)

      if (!data || !data.ok) {
        setError(data?.message ?? `Something went wrong (status ${res.status}). Please try again.`)
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
        className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-pill disabled:opacity-60"
      >
        {loading ? 'Opening…' : 'Manage or cancel subscription'}
      </button>
      {error && <p className="mt-2 text-xs text-danger-text">{error}</p>}
    </div>
  )
}
