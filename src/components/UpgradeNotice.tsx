import Link from 'next/link'

export default function UpgradeNotice({ feature }: { feature: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface p-6 text-center">
      <p className="mb-1 text-sm font-semibold">{feature} is available on the Business and Pro plans</p>
      <p className="mb-4 text-sm text-muted">
        Upgrade to unlock it, along with more domains and priority support.
      </p>
      <Link
        href="/billing"
        className="inline-flex rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground"
      >
        View plans
      </Link>
    </div>
  )
}
