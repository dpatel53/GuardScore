import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPortfolioAnalytics } from '@/lib/dashboardData.server'
import { getUserPlan, hasAdvancedFeatures } from '@/lib/planAccess.server'
import { generateReportPdf } from '@/lib/reportPdf.server'

// On-demand PDF export for the Reports page's "Download PDF report" button.
// Authenticated like any other dashboard data fetch — no admin client, RLS
// on `assets`/`checks` already scopes this to the logged-in user's own data.
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ ok: false, code: 'unauthorized' }, { status: 401 })
  }

  // The Reports page (where this link lives) already hides itself from
  // Starter accounts, but the route stays gated too in case the URL is
  // hit directly.
  const plan = await getUserPlan(supabase, user.id)
  if (!hasAdvancedFeatures(plan)) {
    return NextResponse.json({ ok: false, code: 'plan_restricted' }, { status: 403 })
  }

  const analytics = await getPortfolioAnalytics(supabase, user.id)
  const pdfBytes = await generateReportPdf(analytics, user.email ?? 'your account')

  return new Response(new Uint8Array(pdfBytes), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': 'attachment; filename="guardscore-report.pdf"',
      'cache-control': 'no-store',
    },
  })
}
