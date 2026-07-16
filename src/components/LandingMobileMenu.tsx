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

// The floating pill navbar's Features/Why/Pricing links are hidden below md
// with no replacement, so a phone visitor had no way to reach those sections
// other than scrolling. This adds a simple toggle + dropdown. The toggle
// button sits inside the dark navbar pill itself, so it uses light/white
// styling to stay visible there; the dropdown panel below it is a normal
// light card, matching the rest of the site.
export default function LandingMobileMenu() {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative md:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        className="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"
      >
        {open ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-3 w-56 rounded-2xl border border-border bg-surface p-3 shadow-xl">
          <nav className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted hover:bg-pill hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
            <a
              href="mailto:guardscore1@gmail.com?subject=Demo%20request"
              onClick={() => setOpen(false)}
              className="mt-1 rounded-full border border-[#2F6FED] px-3 py-2.5 text-center text-sm font-semibold text-[#2F6FED]"
            >
              Get a Demo
            </a>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted hover:bg-pill hover:text-foreground"
            >
              Login
            </Link>
          </nav>
        </div>
      )}
    </div>
  )
}
