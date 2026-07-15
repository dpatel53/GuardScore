'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import type { CheckType } from '@/lib/checks'
import { runPublicScan, initialPublicScanState } from './actions'

const CHECK_LABELS: Partial<Record<CheckType, string>> = {
  uptime: 'Website uptime',
  ssl: 'SSL certificate',
  headers: 'Security headers',
}

export default function ScanForm() {
  const [state, formAction, pending] = useActionState(runPublicScan, initialPublicScanState)

  return (
    <div className="w-full max-w-xl">
      <form
        action={formAction}
        className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label htmlFor="domain" className="mb-1.5 block text-xs text-muted">
            Website domain
          </label>
          <input
            id="domain"
            name="domain"
            required
            placeholder="yourbusiness.com"
            className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground disabled:opacity-60"
        >
          {pending ? 'Scanning…' : 'Scan for free'}
        </button>
      </form>

      {state.error && <p className="mt-4 text-sm text-danger-text">{state.error}</p>}

      {state.results && state.domain && (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
          <p className="mb-4 text-sm text-muted">
            Results for <span className="font-medium text-foreground">{state.domain}</span>
          </p>
          <div className="flex flex-col gap-3">
            {state.results.map((r) => (
              <div
                key={r.check_type}
                className="flex flex-col gap-2 border-b border-border pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="sm:max-w-[70%]">
                  <p className="text-sm font-medium">{CHECK_LABELS[r.check_type] ?? r.check_type}</p>
                  <p className="mt-0.5 text-sm text-muted">{r.summary}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl bg-accent px-5 py-4 text-accent-foreground">
            <p className="text-sm font-semibold">This is the bare minimum.</p>
            <p className="mt-1 text-sm text-accent-foreground/85">
              GuardScore&apos;s full report checks 15 things, including email spoofing protection,
              domain expiry, and outdated software, plus ongoing monitoring that alerts you the
              moment something breaks.
            </p>
            <Link
              href="/login?mode=signup"
              className="mt-3 inline-block rounded-full bg-white px-4 py-2 text-sm font-semibold text-accent"
            >
              Get the full report free
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
