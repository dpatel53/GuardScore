'use client'

import { useActionState, useState, useTransition } from 'react'
import { updateWeeklyReport, sendReportPreviewNow } from './actions'

export default function ReportSettingsForm({ weeklyReportEnabled }: { weeklyReportEnabled: boolean }) {
  const [state, formAction, pending] = useActionState(updateWeeklyReport, { error: null })
  const [checked, setChecked] = useState(weeklyReportEnabled)
  const [previewPending, startPreviewTransition] = useTransition()
  const [previewResult, setPreviewResult] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-3">
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            name="weeklyReportEnabled"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          Email me a weekly report every Monday
        </label>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground disabled:opacity-60"
          >
            {pending ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            disabled={previewPending}
            onClick={() => {
              setPreviewResult(null)
              startPreviewTransition(async () => {
                const result = await sendReportPreviewNow()
                setPreviewResult(result.error ?? 'Sent! Check your inbox.')
              })
            }}
            className="rounded-full border border-border px-5 py-2.5 text-sm font-medium disabled:opacity-60"
          >
            {previewPending ? 'Sending…' : 'Send me a preview now'}
          </button>
        </div>
        {state?.error && <p className="text-sm text-danger-text">{state.error}</p>}
      </form>
      {previewResult && <p className="text-sm text-muted">{previewResult}</p>}
    </div>
  )
}
