import Link from 'next/link'
import {
  ActivityIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  LockIcon,
  RefreshIcon,
  ShieldCheckIcon,
  ScissorsIcon,
  WrenchIcon,
  UtensilsIcon,
  CartIcon,
  BriefcaseIcon,
  BuildingIcon,
} from '@/components/icons'
import PricingCards from '@/components/PricingCards'
import LandingMobileMenu from '@/components/LandingMobileMenu'

const BUSINESS_TYPES = [
  { icon: ScissorsIcon, label: 'Salons & spas' },
  { icon: WrenchIcon, label: 'Contractors & trades' },
  { icon: UtensilsIcon, label: 'Restaurants & cafés' },
  { icon: CartIcon, label: 'Online shops' },
  { icon: BriefcaseIcon, label: 'Law & accounting' },
  { icon: BuildingIcon, label: 'Local services' },
]

const FEATURE_CARDS = [
  {
    icon: ActivityIcon,
    title: 'Website uptime',
    body: 'Most owners only find out their site is down when a customer mentions it. We check around the clock and tell you first.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Email deliverability',
    body: 'We check your SPF, DKIM, and DMARC records to ensure your business emails reach the inbox, not the spam folder.',
  },
  {
    icon: LockIcon,
    title: 'Website security',
    body: 'Never miss an SSL renewal again. We monitor your certificate, connection strength, security headers, and DNS protections to keep visitor data safe.',
  },
  {
    icon: RefreshIcon,
    title: 'Continuous monitoring',
    body: 'Security isn\'t a one-time check. We re-scan your domains automatically and alert you if something needs attention.',
  },
]

const CLARITY_POINTS = [
  'Plain-English explanations for every issue',
  'Traffic-light color coding (green / yellow / red)',
  'Step-by-step remediation instructions',
  'A full history of every check we\'ve run',
]

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="bg-[#0E2A52] text-white">
        <div className="border-b border-white/10">
          <div className="mx-auto flex max-w-6xl items-center justify-end gap-4 px-6 py-2 text-xs text-white/70">
            <Link href="/login?mode=signup" className="hover:text-white">
              Check My Domain
            </Link>
            <span className="h-3 w-px bg-white/20" aria-hidden="true" />
            <a href="mailto:guardscore1@gmail.com" className="hover:text-white">
              Support
            </a>
            <span className="h-3 w-px bg-white/20" aria-hidden="true" />
            <Link href="/login" className="font-semibold hover:text-white">
              Login
            </Link>
          </div>
        </div>

        <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
            <ShieldCheckIcon className="h-6 w-6 text-[#2F6FED]" />
            GuardScore
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-white/85 md:flex">
            <a href="#features" className="hover:text-white">
              Features
            </a>
            <a href="#for-you" className="hover:text-white">
              Built for you
            </a>
            <a href="#why" className="hover:text-white">
              Why GuardScore
            </a>
            <a href="#pricing" className="hover:text-white">
              Pricing
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="mailto:guardscore1@gmail.com?subject=Demo%20request"
              className="hidden rounded-md border border-[#2F6FED] px-4 py-2 text-sm font-semibold text-[#2F6FED] transition hover:bg-[#2F6FED]/10 sm:inline-block"
            >
              Get a Demo
            </a>
            <Link
              href="/login?mode=signup"
              className="rounded-md bg-[#2F6FED] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1D4ED8]"
            >
              Get Started Free
            </Link>
            <LandingMobileMenu />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-6 pb-24 pt-16 text-center">
          <span className="mb-8 inline-flex items-center gap-2 rounded-full bg-pill px-4 py-1.5 text-sm">
            <span className="h-2 w-2 rounded-full bg-accent" />
            Cyber-hygiene made simple
          </span>
          <h1 className="mx-auto mb-6 max-w-3xl text-5xl font-extrabold leading-[1.05] tracking-tighter sm:text-6xl md:text-7xl">
            The credit score for your business security.
          </h1>
          <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-muted">
            Is your website even online right now? We monitor your uptime, SSL/TLS, email
            authentication, DNS security, and security headers, translating complex IT jargon into
            simple A-F grades.
          </p>
          <Link
            href="/login?mode=signup"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-medium text-accent-foreground"
          >
            Scan Your Domain Free
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </section>

        <section id="for-you" className="scroll-mt-20 border-t border-border bg-pill/40">
          <div className="mx-auto max-w-5xl px-6 py-20 text-center">
            <h2 className="mb-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Built for businesses like yours.
            </h2>
            <p className="mx-auto mb-12 max-w-xl text-base leading-relaxed text-muted">
              Not an enterprise security team. GuardScore is made for owners running things
              themselves, with no dedicated IT staff and no time to decode security jargon.
            </p>

            <div className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
              {BUSINESS_TYPES.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-6 text-center"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2F6FED]/10">
                    <Icon className="h-5 w-5 text-[#1D4ED8]" />
                  </span>
                  <span className="text-xs font-medium">{label}</span>
                </div>
              ))}
            </div>

            <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-7 text-left">
              <p className="text-lg font-semibold leading-snug sm:text-xl">
                52% of small businesses rely on untrained staff, or the owner personally, to handle
                cybersecurity.
              </p>
              <p className="mt-2 text-sm text-muted">
                That&apos;s exactly who GuardScore is built for — plain-English grades instead of a
                dashboard designed for security professionals.
              </p>
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-20 border-t border-border">
          <div className="mx-auto max-w-5xl px-6 py-20 text-center">
            <h2 className="mb-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              No IT degree required
            </h2>
            <p className="mx-auto mb-12 max-w-xl text-base leading-relaxed text-muted">
              We check the invisible things that protect your business reputation and customer
              trust, so you don&apos;t have to guess.
            </p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURE_CARDS.map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-border bg-surface p-6 text-left"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#2F6FED]/10">
                    <Icon className="h-5 w-5 text-[#1D4ED8]" />
                  </div>
                  <p className="mb-2 text-base font-semibold">{title}</p>
                  <p className="text-sm leading-relaxed text-muted">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="why" className="scroll-mt-20 border-t border-border">
          <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-12 px-6 py-20 md:grid-cols-2">
            <div>
              <h2 className="mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Clarity over anxiety.
              </h2>
              <p className="mb-7 max-w-md text-base leading-relaxed text-muted">
                Stop ignoring security warnings because you don&apos;t understand them. GuardScore
                gives you a clear A-F grade and simple, actionable steps to improve it.
              </p>
              <ul className="flex flex-col gap-3">
                {CLARITY_POINTS.map((point) => (
                  <li key={point} className="flex items-center gap-3 text-sm">
                    <CheckCircleIcon className="h-5 w-5 shrink-0 text-[#1D4ED8]" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">pdfsignstudio.com</p>
                  <p className="text-xs text-muted">Last checked: 2 hours ago</p>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-success-bg text-lg font-extrabold text-success-text">
                  A
                </span>
              </div>
              <div className="flex flex-col gap-2 border-t border-border pt-4">
                {[
                  { label: 'Website uptime', status: 'Online', tone: 'success' },
                  { label: 'SSL certificate', status: 'Valid (142 days)', tone: 'success' },
                  { label: 'DMARC record', status: 'Needs action', tone: 'warning' },
                  { label: 'SPF auth', status: 'Configured', tone: 'success' },
                ].map((row) => (
                  <div
                    key={row.label}
                    className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm ${
                      row.tone === 'success' ? 'bg-success-bg' : 'bg-warning-bg'
                    }`}
                  >
                    <span className={row.tone === 'success' ? 'text-success-text' : 'text-warning-text'}>
                      {row.label}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        row.tone === 'success'
                          ? 'bg-success-text/10 text-success-text'
                          : 'bg-warning-text/10 text-warning-text'
                      }`}
                    >
                      {row.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="scroll-mt-20 border-t border-border">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <div className="mb-3 text-center">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Simple, transparent pricing.
              </h2>
            </div>
            <p className="mx-auto mb-10 max-w-xl text-center text-base leading-relaxed text-muted">
              No contracts. No hidden fees. Cancel anytime. Every plan includes a 14-day free
              trial.
            </p>
            <PricingCards />
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-8 text-sm text-muted">
          GuardScore is a monitoring tool. It reports on public signals, it does not manage or fix
          your systems.
        </div>
      </footer>
    </div>
  )
}
