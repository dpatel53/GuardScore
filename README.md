# GuardScore

Cyber-hygiene monitoring for small businesses with no IT staff. Checks a
domain's uptime, page speed, SSL certificate, domain registration expiry,
email spoofing protection (SPF/DKIM/DMARC), website security headers,
blocklist status, and outdated CMS software, every day, and shows a
plain-English A-F grade. Built with Next.js (App Router) and Supabase.

Every check calls a real, public, keyless data source. Nothing here is
mocked:

- **Uptime** — a direct, timed fetch of the homepage
- **Page speed** — derived from that same fetch's timing, no extra request
- **SSL expiry** — crt.sh (Certificate Transparency log search)
- **Domain expiry** — RDAP (the modern HTTP-based replacement for WHOIS)
- **SPF / DMARC** — DNS-over-HTTPS TXT lookups (Cloudflare resolver)
- **SPF lookup limit** — recursively counts the DNS lookups an SPF record
  triggers (include/a/mx/ptr/exists/redirect) and flags domains over RFC
  7208's 10-lookup cap, where mail servers are supposed to treat the whole
  SPF record as broken
- **DKIM** — DNS-over-HTTPS TXT lookups against common selectors
- **BIMI** — DNS-over-HTTPS TXT lookup for a brand-logo-in-inbox record,
  cross-referenced against DMARC enforcement status since mailbox providers
  only honor BIMI once DMARC is enforcing
- **Security headers** — a direct fetch of the site's response headers
- **Blocklist status** — Spamhaus DBL, a free public DNS-based blocklist zone
- **CMS version** — WordPress's generator tag vs. api.wordpress.org's latest

The check logic lives in `src/lib/checks.ts`. Uptime is the flagship check:
unlike the others, which only flag every few months, it's something that
genuinely benefits from continuous monitoring, which is the core pitch for
why this should be a subscription rather than a one-time scan.

Every check, without exception, only monitors and explains — never modifies
a customer's DNS, website, or hosting. See the plain-English "why it matters"
/ "what to do" copy per check in `src/lib/checkInfo.ts`.

## Beyond the core checks

A few features layered on top of the monitoring, all reusing the same data
or the same "graceful no-op if unconfigured" pattern as Stripe/Resend:

- **Score history** (`src/components/ScoreSparkline.tsx`) — a small trend
  line per domain, computed from check history already in the database, no
  extra query or integration needed.
- **Shareable trust badge** (`src/app/badge/[domain]/`,
  `src/app/api/badge/[domain]/`) — a public, embeddable badge
  (`<img src=".../api/badge/yourdomain.com">`) any customer can put on their
  own site. It intentionally exposes ONLY the letter grade, never which
  specific check is failing — publishing "this business has no DMARC record"
  to the entire internet would be handing attackers a map. See the comment
  in `src/lib/badge.ts`.
- **SMS alerts** — optional, via Twilio (`src/lib/sms.server.ts`). A customer
  opts in with their own number on `/dashboard/settings`; set
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER` to
  actually send them, otherwise the setting is saved but nothing sends.
- **Maintenance windows** — a "Pause alerts" control on each domain
  (`assets.alerts_paused_until`). Checks keep running and history keeps
  building while paused; only the email/SMS send is skipped, in both cron
  routes. Meant for "I know I'm redesigning the site right now, don't page
  me."
- **30-day uptime %** — a rollup of existing uptime check history
  (`getUserAssetsWithChecks` in `src/lib/dashboardData.server.ts`), no new
  data source. Counts a check as "up" if the server responded at all (green
  or yellow); only "red" (no response / 5xx) counts against it.
- **Reports page** (`src/app/dashboard/reports/`) — a portfolio-wide view
  built entirely from `getPortfolioAnalytics` in `dashboardData.server.ts`,
  no second query against the checks table: a 30-day average-score trend
  chart, a score-by-domain bar chart, and an issues-by-severity breakdown,
  all hand-rolled SVG (no chart library dependency, same pattern as
  `ScoreSparkline`).
  - **Weekly email report** — opt-in per account
    (`notification_settings.weekly_report_enabled`). Rather than a second
    cron route (and the Vercel Hobby-plan scheduling complexity that would
    add), the existing daily `run-all-checks` cron just checks "is today
    Monday" after it finishes the day's checks and emails digests then. See
    `src/lib/reportEmail.server.ts`.
  - **Downloadable PDF report** — on-demand, via `src/lib/reportPdf.server.ts`
    (uses `pdf-lib`, a pure-JS library with no headless-browser dependency,
    so it stays cheap on serverless) and `src/app/api/reports/pdf/`.

## Deliverability note

The weekly email report is HTML (a proper Resend `html` body, not just
`text`), unlike the plain-text alert emails. If you see it landing in spam
during testing, that's usually about your sending domain's own DMARC/SPF
setup on Resend's side, not a bug in this code — the same authentication
this product checks for other people's domains applies to whichever domain
you send `ALERTS_FROM_EMAIL` from.

## Deliberately not built yet

**Multi-user / team accounts.** The Pro tier is priced for agencies managing
many domains, but there's no way yet for an account owner to invite a
teammate or give a client read-only access. This needs its own row-level
security policies (checking "is this user a member of this account," not
just "is this user the owner") and is easy to get subtly wrong on a security
product, so it deserves its own focused pass rather than being rushed in
alongside everything else here.

## What's already live

A real Supabase project was provisioned for this build (auth + Postgres
database, with row-level security so each user only sees their own data).
The connection details are already in `.env.local`, so the app runs
out of the box. Supabase project: `guardscore` in your MeepMeep org
(id `mhxqjrkmscuedpblurzi`).

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Sign up for an account, add a domain, and you'll
see a real grade within a few seconds — no setup needed beyond `npm install`.
This has been tested end to end against real domains and confirmed working.

## Pricing tiers

Three tiers, defined in `src/lib/plans.ts` (single source of truth for the
landing page, the billing page, and the domain-limit enforcement in
`src/app/dashboard/actions.ts`):

| Plan | Price | Domain limit |
|---|---|---|
| Starter | $29/mo | 1 |
| Business | $59/mo | 5 |
| Pro | $99/mo | 20 |

Accounts with no active subscription (i.e. still in trial) get the
Business-tier limit (5 domains) so they can properly evaluate the product.

## What still needs your input before this can take paying customers

1. **Service role key** — `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` is
   blank. Get it from the Supabase dashboard → this project → Settings →
   API → `service_role` key. Required for the daily cron check and the
   Stripe webhook (both run with no logged-in user, so they need to bypass
   row-level security).
2. **Stripe** — `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and one price
   id per tier (`STRIPE_PRICE_ID_STARTER`, `STRIPE_PRICE_ID_BUSINESS`,
   `STRIPE_PRICE_ID_PRO`) are blank. Create three recurring prices in your
   Stripe dashboard matching the table above (test mode is fine to start).
   The billing page shows "not configured" per tier until its price id is
   set. Checkout: `src/app/api/stripe/checkout/route.ts`. Webhook:
   `src/app/api/stripe/webhook/route.ts`.
3. **Daily automated checks** — `vercel.json` schedules
   `/api/cron/run-all-checks` once a day via Vercel Cron once deployed
   there. Set `CRON_SECRET` to a random string in your environment; Vercel
   sends it automatically as a bearer token when calling scheduled routes on
   a paid Vercel plan (Cron on the Hobby plan is once/day max, which matches
   this build).
4. **Frequent uptime polling (optional but recommended)** — the daily job
   above already checks uptime once a day, but the whole pitch of uptime
   monitoring is catching an outage within minutes, not within 24 hours.
   `src/app/api/cron/check-uptime/route.ts` is a separate, lightweight route
   (one fetch per domain) built to be called far more often. Vercel's free
   Hobby plan hard-caps its own Cron Jobs at once a day, so on Hobby, point a
   free external scheduler — [cron-job.org](https://cron-job.org) or an
   UptimeRobot "monitor a URL" check both work — at
   `https://yourapp.com/api/cron/check-uptime` every few minutes, sending
   `Authorization: Bearer <CRON_SECRET>`. On Vercel Pro you can instead add a
   second, more frequent entry to `vercel.json`.
5. **Email alerts** — optional. Set `RESEND_API_KEY` (resend.com) and
   `ALERTS_FROM_EMAIL` to send an email when a check gets worse, and to send
   the weekly report to anyone who opts in on `/dashboard/reports`. Without
   it, checks still run and save to the database, both are just skipped.
6. **SMS alerts** — optional. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`,
   and `TWILIO_FROM_NUMBER` (twilio.com) to actually send the text alerts
   customers opt into on `/dashboard/settings`. Without it, the phone number
   still saves, texts are just skipped.

## Deploy

The fastest path is Vercel, since `vercel.json` already declares the cron
schedule:

```bash
npm install -g vercel
vercel
```

Then in the Vercel project settings, add the environment variables from
`.env.local` (get fresh Supabase/Stripe values rather than copying test
secrets into a shared dashboard). Set `NEXT_PUBLIC_SITE_URL` to your real
deployed URL once you have one, and redeploy.

## Project structure

```
src/app/page.tsx              Landing page
src/app/login/page.tsx        Sign up / sign in (Supabase Auth)
src/app/dashboard/            The product: add a domain, see its grade
src/app/dashboard/settings/   Account, plan, and SMS alert phone number
src/app/dashboard/reports/    Portfolio charts + weekly report opt-in + PDF export
src/app/billing/              Subscription status + 3-tier Stripe checkout
src/app/badge/[domain]/       Public shareable trust badge page
src/app/api/badge/[domain]/   Public embeddable badge image (SVG)
src/app/api/checks/run/       Re-check a single domain (used by the dashboard)
src/app/api/reports/pdf/      On-demand PDF report download
src/app/api/cron/run-all-checks/  Daily full scan (all 12 checks) + alerts + weekly reports
src/app/api/cron/check-uptime/    Fast, uptime-only scan meant for frequent polling
src/app/api/stripe/           Checkout session + webhook
src/lib/checks.ts             All monitoring logic, no mocks
src/lib/plans.ts              Pricing tiers (shared by landing/billing/limits)
src/lib/checkInfo.ts          Plain-English "why it matters" / "what to do" copy
src/lib/badge.ts              Trust badge SVG rendering (grade only, see above)
src/lib/alerts.server.ts      Shared email-alert sender (used by both cron routes)
src/lib/sms.server.ts         Shared SMS-alert sender (used by both cron routes)
src/lib/reportEmail.server.ts Weekly HTML digest email builder + sender
src/lib/reportPdf.server.ts   On-demand PDF report builder (pdf-lib)
src/lib/dashboardData.server.ts  Shared "load a user's domains + latest checks" query,
                               plus getPortfolioAnalytics for the Reports page
src/lib/supabase/             Browser / server / admin Supabase clients
```

## Database schema

Four tables in the live Supabase project, all with row-level security so a
user can only read their own rows:

- `assets` — the domains a user monitors. Includes `alerts_paused_until`
  for maintenance windows.
- `checks` — every check result ever run, append-only (this is what powers
  score history).
- `subscriptions` — billing state, written only by the Stripe webhook via
  the service-role client. `subscriptions.plan` stores which tier
  (`starter` / `business` / `pro`) a paying customer is on.
- `notification_settings` — one row per user: `alert_phone` for SMS opt-in,
  `weekly_report_enabled` for the weekly digest email. Deliberately kept
  separate from `subscriptions`: if a user-editable field lived on the
  billing table, the RLS policy letting them edit it would also let them
  edit `plan`/`status` directly, i.e. grant themselves a paid plan for free.

Ran the Supabase security advisor after these migrations; no new
issues, RLS is in place everywhere it needs to be.
