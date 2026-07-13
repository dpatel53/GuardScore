'use client'

import { useActionState } from 'react'
import { updateAlertPhone } from '../actions'

export default function AlertPhoneForm({ currentPhone }: { currentPhone: string | null }) {
  const [state, formAction, pending] = useActionState(updateAlertPhone, { error: null })

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="alertPhone" className="mb-1.5 block text-xs text-muted">
            Phone number for text alerts
          </label>
          <input
            id="alertPhone"
            name="alertPhone"
            type="tel"
            placeholder="+15551234567"
            defaultValue={currentPhone ?? ''}
            className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Save'}
        </button>
      </div>
      {state?.error && <p className="text-sm text-danger-text">{state.error}</p>}
    </form>
  )
}
