import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserAssetsWithChecks } from '@/lib/dashboardData.server'
import { getUserPlan, hasAdvancedFeatures } from '@/lib/planAccess.server'
import AddAssetForm from '../AddAssetForm'
import AssetCard from '../AssetCard'

export default async function DomainsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [assets, plan] = await Promise.all([
    getUserAssetsWithChecks(supabase, user.id),
    getUserPlan(supabase, user.id),
  ])
  const advanced = hasAdvancedFeatures(plan)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Domains</h1>
        <p className="mt-1 text-sm text-muted">Everything you monitor, and its current grade.</p>
      </div>

      <AddAssetForm />

      {!assets.length && (
        <p className="rounded-2xl border border-border bg-surface p-6 text-sm text-muted">
          No domains yet. Add one above to see its grade.
        </p>
      )}

      {assets.map((asset) => (
        <AssetCard
          key={asset.id}
          assetId={asset.id}
          domain={asset.domain}
          score={asset.score}
          checks={asset.checks}
          lastCheckedAt={asset.lastCheckedAt}
          scoreHistory={asset.scoreHistory}
          alertsPausedUntil={asset.alertsPausedUntil}
          uptimePercent30d={asset.uptimePercent30d}
          themes={asset.themes}
          hasAdvancedFeatures={advanced}
        />
      ))}
    </div>
  )
}
