import type { Metadata } from 'next'
import Link from 'next/link'
import { ShieldCheckIcon } from '@/components/icons'
import ScanForm from './ScanForm'

export const metadata: Metadata = {
  title: 'Free Domain Scanner — GuardScore',
  description:
    'Scan any domain free, no account needed. Instantly check if a website is up and whether its SSL certificate and security headers are configured correctly.',
}

export default function ScanPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent">
              <ShieldCheckIcon className="h-3.5 w-3.5 text-accent-foreground" />
            </span>
            Guard<span className="text-[#2F6FED]">Score</span>
          </Link>
          <Link href="/" className="text-sm font-medium text-muted hover:text-foreground">
            Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-6 py-14">
        <h1 className="mb-3 text-center text-4xl font-extrabold tracking-tight">Free domain scanner</h1>
        <p className="mb-8 max-w-lg text-center text-muted">
          Enter any domain to check if it&apos;s up and whether its SSL certificate and security
          headers are set up correctly — free, no account needed.
        </p>

        <ScanForm />

        <p className="mt-6 max-w-lg text-center text-xs text-muted">
          Limited to a few free scans per visitor per day. GuardScore only reads publicly available
          information — it never modifies your site, DNS, or any other system.
        </p>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-3xl px-6 py-8 text-sm text-muted">
          GuardScore is a monitoring tool. It reports on public signals, it does not manage or fix
          your systems.
        </div>
      </footer>
    </div>
  )
}
