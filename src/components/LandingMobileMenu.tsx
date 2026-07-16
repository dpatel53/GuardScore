'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MenuIcon, CloseIcon } from '@/components/icons'

const LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#for-you', label: 'Built for you' },
  { href: '#why', label: 'Why GuardScore' },
  { href: '#pricing', label: 'Pricing' },
  { href: '/scan', label: 'Free scan' },
  { href: '/blog', label: 'Blog' },
]

// The header's Features/Why/Pricing nav is hidden below md with no
// replacement, so a phone visitor had no way to reach those sections other
// than scrolling. This adds a simple toggle + dropdown, matching the light
// header's own colors.
export default function LandingMobileMenu() {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        className="rounded-md p-2 text-muted hover:text-foreground"
      >
        {open ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
      </button>

      {open && (
        <div className="animate-dropdown-in absolute inset-x-0 top-full origin-top border-t border-border bg-background px-6 py-4">
          <nav className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2.5 text-sm font-medium text-muted hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
            <a
              href="mailto:guardscore1@gmail.com?subject=Demo%20request"
              className="mt-2 rounded-full border border-[#2F6FED] px-2 py-2.5 text-center text-sm font-semibold text-[#2F6FED]"
            >
              Get a Demo
            </a>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-2.5 text-sm font-medium text-muted hover:text-foreground"
            >
              Login
            </Link>
          </nav>
        </div>
      )}
    </div>
  )
}
