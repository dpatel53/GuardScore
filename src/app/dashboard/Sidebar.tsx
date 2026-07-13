'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from './actions'
import {
  ShieldCheckIcon,
  GridIcon,
  GlobeIcon,
  BellIcon,
  ChartIcon,
  SettingsIcon,
  LogoutIcon,
  MenuIcon,
  CloseIcon,
} from '@/components/icons'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: GridIcon },
  { href: '/dashboard/domains', label: 'Domains', icon: GlobeIcon },
  { href: '/dashboard/alerts', label: 'Alerts', icon: BellIcon },
  { href: '/dashboard/reports', label: 'Reports', icon: ChartIcon },
  { href: '/dashboard/settings', label: 'Settings', icon: SettingsIcon },
]

// Shared between the always-visible desktop sidebar and the mobile
// off-canvas drawer, so nav items, sign-out, and the account row only need
// to be defined once. `onNavigate` closes the mobile drawer after a tap;
// it's a no-op on desktop.
function SidebarContent({ email, onNavigate }: { email: string; onNavigate?: () => void }) {
  const pathname = usePathname()
  const initial = email.charAt(0).toUpperCase()

  return (
    <>
      <nav className="flex flex-1 flex-col gap-1 border-t border-border pt-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? 'bg-accent text-accent-foreground' : 'text-muted hover:bg-pill hover:text-foreground'
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border pt-4">
        <div className="mb-2 flex items-center gap-3 px-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pill text-sm font-semibold">
            {initial}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium">User</p>
            <p className="truncate text-xs text-muted">{email}</p>
          </div>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted hover:bg-pill hover:text-foreground"
          >
            <LogoutIcon className="h-[18px] w-[18px]" />
            Sign out
          </button>
        </form>
      </div>
    </>
  )
}

export default function Sidebar({ email }: { email: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile top bar — the sidebar below is hidden below md, so this is
          the only way to reach navigation on a phone. */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2 text-base font-extrabold tracking-tight">
          <ShieldCheckIcon className="h-5 w-5" />
          GuardScore
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="rounded-lg p-2 text-muted hover:bg-pill hover:text-foreground"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile off-canvas drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <aside className="relative z-50 flex h-full w-72 max-w-[80vw] flex-col bg-surface px-4 py-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between px-2">
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 text-base font-extrabold tracking-tight"
              >
                <ShieldCheckIcon className="h-5 w-5" />
                GuardScore
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-1.5 text-muted hover:bg-pill hover:text-foreground"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent email={email} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      {/* Desktop sidebar — always visible at md and up, replaces the top bar. */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border px-4 py-6 md:flex">
        <Link href="/dashboard" className="mb-6 flex items-center gap-2 px-2 text-base font-extrabold tracking-tight">
          <ShieldCheckIcon className="h-5 w-5" />
          GuardScore
        </Link>
        <SidebarContent email={email} />
      </aside>
    </>
  )
}
