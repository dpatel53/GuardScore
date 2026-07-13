import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPublicScoreForDomain } from '@/lib/dashboardData.server'
import { ShieldCheckIcon } from '@/components/icons'
import BadgeEmbedSnippet from './BadgeEmbedSnippet'

const GRADE_STYLES: Record<string, string> = {
  A: 'bg-success-bg text-success-text',
  B: 'bg-success-bg text-success-text',
  C: 'bg-warning-bg text-warning-text',
  D: 'bg-warning-bg text-warning-text',
  F: 'bg-danger-bg text-danger-text',
}

export default async function PublicBadgePage({
  params,
}: {
  params: Promise<{ domain: string }>
}) {
  const { domain: rawDomain } = await params
  const domain = decodeURIComponent(rawDomain)

  const supabase = createAdminClient()
  const data = await getPublicScoreForDomain(supabase, domain)

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <Link href="/" className="mb-10 flex items-center gap-2 text-lg font-extrabold tracking-tight">
        <ShieldCheckIcon className="h-6 w-6" />
        GuardScore
      </Link>

      {data && !data.planRestricted ? (
        <>
          <span
            className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-extrabold ${GRADE_STYLES[data.grade]}`}
          >
            {data.grade}
          </span>
          <h1 className="mb-1 text-xl font-semibold">{data.domain}</h1>
          <p className="mb-8 text-sm text-muted">
            {data.lastCheckedAt
              ? `Security checked by GuardScore, last checked ${new Date(data.lastCheckedAt).toLocaleDateString()}.`
              : 'Security checked by GuardScore.'}
          </p>

          <div className="mb-8 w-full rounded-2xl border border-border bg-surface p-5 text-left">
            <p className="mb-2 text-sm font-semibold">Embed this on your site</p>
            <BadgeEmbedSnippet domain={data.domain} />
          </div>
        </>
      ) : data && data.planRestricted ? (
        <>
          <h1 className="mb-2 text-xl font-semibold">{data.domain} is monitored by GuardScore</h1>
          <p className="mb-8 text-sm text-muted">
            The shareable trust badge isn&apos;t included on this domain owner&apos;s current plan.
          </p>
        </>
      ) : (
        <>
          <h1 className="mb-2 text-xl font-semibold">{domain} isn&apos;t monitored yet</h1>
          <p className="mb-8 text-sm text-muted">
            This domain doesn&apos;t have a GuardScore grade. Any business can get one free.
          </p>
        </>
      )}

      <Link
        href="/login?mode=signup"
        className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground"
      >
        Get your own free score
      </Link>
    </div>
  )
}
