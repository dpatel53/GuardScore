import { createAdminClient } from '@/lib/supabase/admin'
import { getPublicScoreForDomain } from '@/lib/dashboardData.server'
import { renderGradeBadge, renderUnmonitoredBadge, renderPlanRestrictedBadge } from '@/lib/badge'

// Public, unauthenticated, embeddable badge: <img src="/api/badge/pdfsignstudio.com">.
// Deliberately returns only a letter grade — see src/lib/badge.ts.
export async function GET(_request: Request, { params }: { params: Promise<{ domain: string }> }) {
  const { domain: rawDomain } = await params
  const domain = decodeURIComponent(rawDomain).replace(/\.svg$/i, '')

  const supabase = createAdminClient()
  const data = await getPublicScoreForDomain(supabase, domain)

  const svg = !data
    ? renderUnmonitoredBadge()
    : data.planRestricted
      ? renderPlanRestrictedBadge()
      : renderGradeBadge(data.grade)

  return new Response(svg, {
    headers: {
      'content-type': 'image/svg+xml',
      'cache-control': 'public, max-age=3600',
    },
  })
}
