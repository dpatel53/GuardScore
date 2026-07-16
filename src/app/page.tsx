import Link from 'next/link'
import {
  ArrowRightIcon,
  CheckCircleIcon,
  GlobeIcon,
  LockIcon,
  PlayIcon,
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
import Reveal from '@/components/Reveal'

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
    icon: LockIcon,
    title: 'Website security',
    body: 'Never miss an SSL renewal again. We monitor your certificate, connection strength, and security headers to keep visitor data safe.',
  },
  {
    icon: GlobeIcon,
    title: 'DNS security',
    body: 'CAA and DNSSEC checks so your domain can\'t be quietly hijacked or misused.',
  },
  {
    icon: RefreshIcon,
    title: 'Continuous monitoring',
    body: 'Security isn\'t a one-time check. We re-scan your domains automatically and alert you if something needs attention.',
  },
  {
    icon: CheckCircleIcon,
    title: 'Blocklist checks',
    body: 'Know immediately if your domain or IP ends up on a spam or malware blocklist.',
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
    <div className="flex flex-1 flex-col bg-[#EEF0F6]">
      <header className="sticky top-0 z-30 px-4 pt-4 sm:px-6">
        <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full bg-accent py-2 pl-4 pr-2 shadow-lg shadow-accent/20">
          <Link href="/" className="flex items-center gap-2 text-base font-extrabold tracking-tight text-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
              <ShieldCheckIcon className="h-3.5 w-3.5 text-white" />
            </span>
            Guard<span className="text-[#7CA6FF]">Score</span>
          </Link>

          <nav className="hidden items-center gap-1 text-sm font-medium text-white/70 md:flex">
            <a href="#features" className="rounded-full px-3.5 py-2 transition hover:bg-white/10 hover:text-white">
              Features
            </a>
            <a href="#for-you" className="rounded-full px-3.5 py-2 transition hover:bg-white/10 hover:text-white">
              Built for you
            </a>
            <a href="#why" className="rounded-full px-3.5 py-2 transition hover:bg-white/10 hover:text-white">
              Why GuardScore
            </a>
            <a href="#pricing" className="rounded-full px-3.5 py-2 transition hover:bg-white/10 hover:text-white">
              Pricing
            </a>
            <Link href="/blog" className="rounded-full px-3.5 py-2 transition hover:bg-white/10 hover:text-white">
              Blog
            </Link>
          </nav>

          <div className="flex items-center gap-1.5">
            <Link
              href="/scan"
              className="hidden rounded-full px-3.5 py-2 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white lg:inline-block"
            >
              Free Scan
            </Link>
            <Link
              href="/login"
              className="hidden rounded-full px-3.5 py-2 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white sm:inline-block"
            >
              Login
            </Link>
            <Link
              href="/login?mode=signup"
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-accent transition hover:bg-white/90"
            >
              Get Started
            </Link>
            <LandingMobileMenu />
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
        <section className="mx-auto w-full max-w-6xl rounded-[32px] bg-surface p-8 shadow-sm sm:p-12 md:p-16">
          <div className="grid grid-cols-1 items-center gap-14 md:grid-cols-2">
            <div>
              <span className="animate-fade-in-up mb-7 inline-flex items-center gap-2 rounded-full bg-pill px-4 py-1.5 text-sm">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#2F6FED]" />
                Cyber-hygiene made simple
              </span>
              <h1
                className="animate-fade-in-up mb-6 text-5xl font-extrabold leading-[1.15] tracking-tighter sm:text-6xl"
                style={{ animationDelay: '90ms' }}
              >
                The credit score
                <br />
                for{' '}
                <span className="relative -mx-1 inline-flex items-center align-middle">
                  <span className="h-9 w-9 rounded-full bg-[#DCE6FB]" aria-hidden="true" />
                  <span className="-ml-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#2F6FED] text-white">
                    <ShieldCheckIcon className="h-4 w-4" />
                  </span>
                </span>{' '}
                your business
                <br />
                <span className="relative inline-block text-[#2F6FED]">
                  security
                  <svg
                    className="absolute -bottom-2 left-0 w-full"
                    height="14"
                    viewBox="0 0 300 14"
                    fill="none"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path d="M2 10C60 2 240 2 298 10" stroke="#93C5FD" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="ml-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent align-middle">
                  <CheckCircleIcon className="h-4 w-4 text-white" />
                </span>
                .
              </h1>
              <p
                className="animate-fade-in-up mb-9 max-w-md text-lg leading-relaxed text-muted"
                style={{ animationDelay: '180ms' }}
              >
                Is your website even online right now? We monitor your uptime, SSL/TLS, email
                authentication, DNS security, and security headers and translate the jargon into a
                simple A-F grade.
              </p>
              <div
                className="animate-fade-in-up flex flex-wrap items-center gap-4"
                style={{ animationDelay: '270ms' }}
              >
                <Link
                  href="/scan"
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-medium text-accent-foreground transition hover:scale-[1.03] hover:bg-[#1e293b] active:scale-[0.98]"
                >
                  Scan Your Domain Free
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
                <a
                  href="#why"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3.5 text-sm font-medium transition hover:scale-[1.03] hover:bg-pill active:scale-[0.98]"
                >
                  <PlayIcon className="h-4 w-4 text-[#2F6FED]" />
                  See a sample report
                </a>
              </div>
            </div>

            <div
              className="animate-fade-in-up relative mx-auto w-full max-w-sm md:max-w-none"
              style={{ animationDelay: '120ms' }}
            >
              <div
                className="absolute -inset-8 -z-10 rounded-[40px] bg-[#2F6FED]/10 blur-2xl"
                aria-hidden="true"
              />
              <a
                href="#why"
                aria-label="See a sample report"
                className="absolute -left-3 -top-3 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-accent text-white shadow-lg transition hover:scale-110 hover:bg-[#1e293b]"
              >
                <PlayIcon className="h-4 w-4" />
              </a>
              <div className="animate-float overflow-hidden rounded-3xl border border-border bg-surface shadow-xl transition hover:shadow-2xl">
                <div className="flex items-center gap-2 border-b border-border bg-pill/60 px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-danger-bg" />
                  <span className="h-2.5 w-2.5 rounded-full bg-warning-bg" />
                  <span className="h-2.5 w-2.5 rounded-full bg-success-bg" />
                  <span className="ml-3 rounded border border-border bg-surface px-3 py-1 text-xs text-muted">
                    guardscore.dev
                  </span>
                </div>
                <div className="p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">pdfsignstudio.com</p>
                      <p className="text-xs text-muted">Checked 2 hours ago</p>
                    </div>
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success-bg text-base font-extrabold text-success-text">
                      A
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-lg bg-success-bg px-3 py-2 text-xs text-success-text">
                      <span>Website uptime</span>
                      <span>Online</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-success-bg px-3 py-2 text-xs text-success-text">
                      <span>SSL certificate</span>
                      <span>Valid</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-warning-bg px-3 py-2 text-xs text-warning-text">
                      <span>DMARC record</span>
                      <span>Needs action</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="for-you" className="mx-auto w-full max-w-6xl scroll-mt-24 rounded-[32px] bg-surface p-8 sm:p-12 md:p-16">
          <Reveal className="mx-auto max-w-5xl text-center">
            <h2 className="mb-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Built for businesses like yours.
            </h2>
            <p className="mx-auto mb-12 max-w-xl text-base leading-relaxed text-muted">
              Not an enterprise security team. GuardScore is made for owners running things
              themselves, with no dedicated IT staff and no time to decode security jargon.
            </p>

            <div className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
              {BUSINESS_TYPES.map(({ icon: Icon, label }, i) => (
                <Reveal key={label} delayMs={i * 60}>
                  <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-background px-4 py-6 text-center transition hover:-translate-y-1 hover:shadow-md">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2F6FED]/10">
                      <Icon className="h-5 w-5 text-[#1D4ED8]" />
                    </span>
                    <span className="text-xs font-medium">{label}</span>
                  </div>
                </Reveal>
              ))}
            </div>

            <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-background p-7 text-left">
              <p className="text-lg font-semibold leading-snug sm:text-xl">
                52% of small businesses rely on untrained staff, or the owner personally, to handle
                cybersecurity.
              </p>
              <p className="mt-2 text-sm text-muted">
                That&apos;s exactly who GuardScore is built for — plain-English grades instead of a
                dashboard designed for security professionals.
              </p>
            </div>
          </Reveal>
        </section>

        <section className="mx-auto w-full max-w-6xl overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#2F6FED_0%,#1D4ED8_45%,#0F172A_100%)] p-8 sm:p-12 md:p-16">
          <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
            <Reveal className="text-white">
              <h2 className="mb-4 text-4xl font-extrabold tracking-tight">
                Everything that keeps your business online, watched.
              </h2>
              <p className="mb-10 max-w-md text-white/70">
                No dashboard-reading required just a grade, and what to do about it.
              </p>
              <div className="space-y-6">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
                  <p className="mb-1 font-semibold">Website uptime</p>
                  <p className="text-sm text-white/70">
                    Most owners only find out their site is down when a customer mentions it. We
                    check around the clock and tell you first.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
                  <p className="mb-1 font-semibold">Email deliverability</p>
                  <p className="text-sm text-white/70">
                    We check your SPF, DKIM, and DMARC records so business emails reach the inbox,
                    not the spam folder.
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal
              delayMs={120}
              className="overflow-hidden rounded-2xl border border-white/10 bg-surface shadow-2xl transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.25)]"
            >
              <div className="flex items-center gap-2 border-b border-border bg-pill/60 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-danger-bg" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning-bg" />
                <span className="h-2.5 w-2.5 rounded-full bg-success-bg" />
                <span className="ml-3 rounded border border-border bg-surface px-3 py-1 text-xs text-muted">
                  guardscore.dev/dashboard
                </span>
              </div>
              <div className="flex">
                <div className="w-32 shrink-0 space-y-3 border-r border-border p-4 text-xs text-muted">
                  <p className="font-semibold text-foreground">Dashboard</p>
                  <p>Domains</p>
                  <p>Alerts</p>
                  <p>Reports</p>
                  <p>Settings</p>
                </div>
                <div className="flex-1 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">pdfsignstudio.com</p>
                      <p className="text-xs text-muted">Checked 2 hours ago</p>
                    </div>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-success-bg text-sm font-extrabold text-success-text">
                      A
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-lg bg-success-bg px-3 py-2 text-xs text-success-text">
                      <span>Website uptime</span>
                      <span>Online</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-success-bg px-3 py-2 text-xs text-success-text">
                      <span>SSL certificate</span>
                      <span>Valid</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-warning-bg px-3 py-2 text-xs text-warning-text">
                      <span>DMARC record</span>
                      <span>Needs action</span>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section id="features" className="mx-auto w-full max-w-6xl scroll-mt-24 rounded-[32px] bg-surface p-8 sm:p-12 md:p-16">
          <Reveal className="mx-auto max-w-5xl text-center">
            <h2 className="mb-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              No IT degree required
            </h2>
            <p className="mx-auto mb-12 max-w-xl text-base leading-relaxed text-muted">
              We check the invisible things that protect your business reputation and customer
              trust, so you don&apos;t have to guess.
            </p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURE_CARDS.map(({ icon: Icon, title, body }, i) => (
                <Reveal key={title} delayMs={i * 70}>
                  <div className="h-full rounded-2xl border border-border bg-background p-6 text-left transition hover:-translate-y-1 hover:shadow-md">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#2F6FED]/10">
                      <Icon className="h-5 w-5 text-[#1D4ED8]" />
                    </div>
                    <p className="mb-2 text-base font-semibold">{title}</p>
                    <p className="text-sm leading-relaxed text-muted">{body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </Reveal>
        </section>

        <section id="why" className="mx-auto w-full max-w-6xl scroll-mt-24 rounded-[32px] bg-surface p-8 sm:p-12 md:p-16">
          <Reveal className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-12 md:grid-cols-2">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
                <p className="mb-2 text-xs text-muted">Grade history</p>
                <div className="flex h-20 items-end gap-1.5">
                  <div className="w-4 rounded bg-warning-bg" style={{ height: '40%' }} />
                  <div className="w-4 rounded bg-warning-bg" style={{ height: '55%' }} />
                  <div className="w-4 rounded bg-success-bg" style={{ height: '70%' }} />
                  <div className="w-4 rounded bg-success-bg" style={{ height: '78%' }} />
                  <div className="w-4 rounded bg-success-text/70" style={{ height: '92%' }} />
                  <div className="w-4 rounded bg-success-text" style={{ height: '100%' }} />
                </div>
                <p className="mt-2 text-xs text-muted">C → A over 6 weeks</p>
              </div>
              <div className="space-y-2 rounded-2xl border border-border bg-background p-5 shadow-sm">
                <p className="mb-1 text-xs text-muted">Check details</p>
                <div className="flex items-center justify-between rounded-lg bg-success-bg px-2.5 py-1.5 text-xs text-success-text">
                  <span>SPF</span>
                  <span>Pass</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-success-bg px-2.5 py-1.5 text-xs text-success-text">
                  <span>DKIM</span>
                  <span>Pass</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-danger-bg px-2.5 py-1.5 text-xs text-danger-text">
                  <span>DNSSEC</span>
                  <span>Off</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-success-bg px-2.5 py-1.5 text-xs text-success-text">
                  <span>Headers</span>
                  <span>Pass</span>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        <section className="mx-auto w-full max-w-6xl overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#2F6FED_0%,#1D4ED8_45%,#0F172A_100%)] px-6 py-16 text-center sm:p-16">
          <Reveal>
            <h2 className="mb-4 text-4xl font-extrabold tracking-tight text-white">
              Ready to know where you stand?
            </h2>
            <p className="mx-auto mb-8 max-w-md text-white/70">
              14-day free trial. No card required. Cancel anytime.
            </p>
            <Link
              href="/scan"
              className="inline-block rounded-full bg-white px-8 py-3.5 font-semibold text-accent transition hover:scale-[1.03] hover:bg-white/90 active:scale-[0.98]"
            >
              Scan Your Domain Free
            </Link>
          </Reveal>
        </section>

        <section id="pricing" className="mx-auto w-full max-w-6xl scroll-mt-24 rounded-[32px] bg-accent px-6 py-16 sm:p-16">
          <Reveal className="mx-auto max-w-5xl">
            <div className="mb-3 text-center">
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Simple, transparent pricing.
              </h2>
            </div>
            <p className="mx-auto mb-10 max-w-xl text-center text-base leading-relaxed text-white/60">
              No contracts. No hidden fees. Cancel anytime. Every plan includes a 14-day free
              trial.
            </p>
            <PricingCards />
          </Reveal>
        </section>

        <section className="mx-auto w-full max-w-6xl rounded-[32px] bg-[linear-gradient(120deg,#EEF4FF_0%,#F5F0FF_55%,#EAF6FF_100%)] p-8 sm:p-12 md:p-16">
          <Reveal className="mx-auto max-w-5xl">
            <h2 className="mb-3 text-3xl font-extrabold tracking-tight">Frequently asked questions</h2>
            <p className="mb-12 max-w-xl text-muted">The honest answers, no marketing spin.</p>
            <div className="grid gap-x-10 gap-y-8 text-sm md:grid-cols-3">
              <div>
                <p className="mb-2 font-semibold">Will GuardScore ever change my website or DNS?</p>
                <p className="text-muted">
                  No. GuardScore only monitors and explains — it never modifies your systems or
                  DNS.
                </p>
              </div>
              <div>
                <p className="mb-2 font-semibold">Do I need to install anything?</p>
                <p className="text-muted">
                  No software, no plugins. Just add your domain and we start checking public
                  signals immediately.
                </p>
              </div>
              <div>
                <p className="mb-2 font-semibold">What happens after my 14-day trial?</p>
                <p className="text-muted">
                  Pick a plan to keep monitoring active. If you don&apos;t, your dashboard locks
                  until you subscribe — your history is saved either way.
                </p>
              </div>
              <div>
                <p className="mb-2 font-semibold">Can I cancel anytime?</p>
                <p className="text-muted">
                  Yes, in one click from your billing page. No contracts, no retention calls.
                </p>
              </div>
              <div>
                <p className="mb-2 font-semibold">Which plan is right for my business?</p>
                <p className="text-muted">
                  Most small businesses with one site pick Starter. If you manage several domains
                  or want the trust badge and weekly reports, Business is the popular choice.
                </p>
              </div>
              <div>
                <p className="mb-2 font-semibold">What exactly gets checked?</p>
                <p className="text-muted">
                  Uptime, SSL/TLS strength, SPF/DKIM/DMARC, security headers, domain expiry,
                  CAA/DNSSEC, and blocklist status.
                </p>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="px-4 pb-6 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 rounded-[32px] bg-surface px-8 py-6 text-sm text-muted">
          <p>GuardScore is a monitoring tool. It reports on public signals, it does not manage or fix your systems.</p>
          <div className="flex shrink-0 items-center gap-4">
            <a href="mailto:guardscore1@gmail.com" className="font-medium hover:text-foreground">
              Support
            </a>
            <Link href="/blog" className="font-medium hover:text-foreground">
              Blog
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
