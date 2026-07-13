import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runAllChecks } from '@/lib/checks.server'

// Browser-triggered recheck for a single asset. Kept as a real HTTP endpoint
// (in addition to the dashboard's server action) so the check logic is also
// reachable from outside the app shell if needed later.
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ ok: false, code: 'unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const assetId = body?.assetId
  if (!assetId || typeof assetId !== 'string') {
    return NextResponse.json({ ok: false, code: 'missing_asset_id' }, { status: 400 })
  }

  const { data: asset, error: assetError } = await supabase
    .from('assets')
    .select('*')
    .eq('id', assetId)
    .eq('user_id', user.id)
    .single()

  if (assetError || !asset) {
    return NextResponse.json({ ok: false, code: 'not_found' }, { status: 404 })
  }

  const results = await runAllChecks(asset.domain, asset.email_domain)

  const { error: insertError } = await supabase.from('checks').insert(
    results.map((r) => ({
      asset_id: asset.id,
      check_type: r.check_type,
      status: r.status,
      summary: r.summary,
      detail: r.detail,
    })),
  )

  if (insertError) {
    return NextResponse.json({ ok: false, code: 'insert_failed', message: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, results })
}
