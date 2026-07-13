'use client'

import { useActionState } from 'react'
import { addAsset } from './actions'

export default function AddAssetForm() {
  const [state, formAction, pending] = useActionState(addAsset, { error: null })

  return (
    <form action={formAction} className="rounded-2xl border border-border bg-surface p-6">
      <p className="mb-3 text-base font-semibold">Add a domain to monitor</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="domain" className="mb-1.5 block text-xs text-muted">
            Website domain
          </label>
          <input
            id="domain"
            name="domain"
            required
            placeholder="pdfsignstudio.com"
            className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="emailDomain" className="mb-1.5 block text-xs text-muted">
            Email domain (if different)
          </label>
          <input
            id="emailDomain"
            name="emailDomain"
            placeholder="same as above"
            className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground disabled:opacity-60"
        >
          {pending ? 'Checking…' : 'Add and check'}
        </button>
      </div>
      {state?.error && <p className="mt-3 text-sm text-danger-text">{state.error}</p>}
    </form>
  )
}
