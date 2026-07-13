// Every actual check implementation for GuardScore. Every check here calls
// a real, keyless, HTTP-reachable data source — nothing here is mocked or
// faked. Split out from checks.ts (which holds only the shared types and
// pure logic) specifically because this file imports Node's `tls` module
// for the TLS strength check, which can't be bundled for the browser —
// this file must only ever be imported from server-side code (server
// actions, route handlers), never a Client Component.
//
//  - Uptime:           a direct, timed fetch of the homepage
//  - SSL expiry:      crt.sh certificate transparency log search
//  - TLS strength:     a direct TLS handshake with the server itself
//  - Domain expiry:   RDAP (the modern, HTTP-based replacement for WHOIS)
//  - SPF / DMARC:     DNS-over-HTTPS TXT lookups (Cloudflare resolver)
//  - DKIM:            DNS-over-HTTPS TXT lookups against common selectors
//  - Security headers: a direct fetch of the site's homepage response headers
//  - Blocklist:       Spamhaus DBL, a public DNS-based blocklist zone
//  - CMS version:     WordPress generator tag vs. api.wordpress.org's latest
//  - CAA:              DNS CAA record, restricting which CAs can issue certs
//  - DNSSEC:           DNS-over-HTTPS DNSKEY lookup + the resolver's AD flag

import tls from 'node:tls'
import { derivePageSpeedCheck, type CheckResult, type CheckStatus } from './checks'

const FETCH_TIMEOUT_MS = 9000

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
}

// ---------------------------------------------------------------------------
// Website uptime — a direct, timed fetch of the homepage. This is the one
// check that genuinely benefits from running more often than once a day;
// see checkUptime's usage in the dedicated fast cron route.
// ---------------------------------------------------------------------------
const SLOW_RESPONSE_MS = 5000

export async function checkUptime(domain: string): Promise<CheckResult> {
  const startedAt = Date.now()
  try {
    const res = await fetchWithTimeout(`https://${domain}`, { redirect: 'follow' })
    const responseTimeMs = Date.now() - startedAt

    if (res.status >= 500) {
      return {
        check_type: 'uptime',
        status: 'red',
        summary: `Site responded with a server error (HTTP ${res.status}).`,
        detail: { httpStatus: res.status, responseTimeMs },
      }
    }
    if (res.status >= 400) {
      return {
        check_type: 'uptime',
        status: 'yellow',
        summary: `Site is reachable but returned an error page (HTTP ${res.status}).`,
        detail: { httpStatus: res.status, responseTimeMs },
      }
    }
    if (responseTimeMs > SLOW_RESPONSE_MS) {
      return {
        check_type: 'uptime',
        status: 'yellow',
        summary: `Site is up but responded slowly (${(responseTimeMs / 1000).toFixed(1)}s).`,
        detail: { httpStatus: res.status, responseTimeMs },
      }
    }
    return {
      check_type: 'uptime',
      status: 'green',
      summary: `Site is up, responded in ${responseTimeMs}ms.`,
      detail: { httpStatus: res.status, responseTimeMs },
    }
  } catch (err) {
    return {
      check_type: 'uptime',
      status: 'red',
      summary: "Site did not respond. It may be down, or too slow to load.",
      detail: { error: String(err), responseTimeMs: Date.now() - startedAt },
    }
  }
}

// ---------------------------------------------------------------------------
// SSL certificate expiry, via crt.sh (Certificate Transparency log search)
// ---------------------------------------------------------------------------
export async function checkSslExpiry(domain: string): Promise<CheckResult> {
  try {
    const res = await fetchWithTimeout(
      `https://crt.sh/?q=${encodeURIComponent(domain)}&output=json`,
      { headers: { accept: 'application/json' } },
    )
    if (!res.ok) throw new Error(`crt.sh responded ${res.status}`)

    const rows = (await res.json()) as Array<{ not_before: string; not_after: string }>
    if (!rows.length) {
      return {
        check_type: 'ssl',
        status: 'unknown',
        summary: 'No certificate found in public transparency logs.',
        detail: {},
      }
    }

    const latest = rows.reduce((a, b) =>
      new Date(a.not_before) > new Date(b.not_before) ? a : b,
    )
    const expiresAt = new Date(latest.not_after)
    const daysLeft = daysBetween(new Date(), expiresAt)

    let status: CheckStatus = 'green'
    if (daysLeft < 0) status = 'red'
    else if (daysLeft < 14) status = 'red'
    else if (daysLeft < 30) status = 'yellow'

    const summary =
      daysLeft < 0
        ? `Certificate expired ${Math.abs(daysLeft)} days ago.`
        : `Valid, expires in ${daysLeft} days.`

    return { check_type: 'ssl', status, summary, detail: { expiresAt: latest.not_after, daysLeft } }
  } catch (err) {
    return {
      check_type: 'ssl',
      status: 'unknown',
      summary: 'Could not reach the certificate log to check SSL status.',
      detail: { error: String(err) },
    }
  }
}

// ---------------------------------------------------------------------------
// TLS connection strength — separate from certificate expiry above. A raw
// TLS handshake with the server itself, checked two ways in parallel:
//  1. What protocol version does it negotiate normally?
//  2. Will it still accept the old, deprecated TLS 1.0/1.1 protocols?
// Most cyber insurance policies and PCI-style standards now require 1.0/1.1
// disabled outright, even if the "normal" connection already uses 1.2/1.3.
// ---------------------------------------------------------------------------
const TLS_CONNECT_TIMEOUT_MS = 7000

function tlsConnect(
  domain: string,
  options: tls.ConnectionOptions,
): Promise<{ protocol: string | null; cipherName: string | null }> {
  return new Promise((resolve, reject) => {
    let settled = false
    const socket = tls.connect({
      host: domain,
      port: 443,
      servername: domain,
      timeout: TLS_CONNECT_TIMEOUT_MS,
      // We're checking protocol/cipher strength here, not certificate
      // trust — that's the separate crt.sh-based SSL check above, so an
      // untrusted/self-signed cert shouldn't fail this specific check.
      rejectUnauthorized: false,
      ...options,
    })

    function finish(fn: () => void) {
      if (settled) return
      settled = true
      fn()
    }

    socket.once('timeout', () => finish(() => {
      socket.destroy()
      reject(new Error('TLS connection timed out'))
    }))
    socket.once('error', (err) => finish(() => reject(err)))
    socket.once('secureConnect', () => finish(() => {
      const protocol = socket.getProtocol()
      const cipher = socket.getCipher()
      socket.end()
      resolve({ protocol, cipherName: cipher?.name ?? null })
    }))
  })
}

export async function checkTlsStrength(domain: string): Promise<CheckResult> {
  const [normalResult, oldTlsResult] = await Promise.allSettled([
    tlsConnect(domain, {}),
    tlsConnect(domain, { minVersion: 'TLSv1', maxVersion: 'TLSv1.1' }),
  ])

  if (normalResult.status === 'rejected') {
    return {
      check_type: 'tls_strength',
      status: 'unknown',
      summary: 'Could not establish a TLS connection to check connection strength.',
      detail: { error: String(normalResult.reason) },
    }
  }

  const { protocol, cipherName } = normalResult.value
  const acceptsOldTls = oldTlsResult.status === 'fulfilled'

  if (!protocol) {
    return {
      check_type: 'tls_strength',
      status: 'unknown',
      summary: 'Connected, but could not determine which TLS version was used.',
      detail: {},
    }
  }

  if (acceptsOldTls) {
    return {
      check_type: 'tls_strength',
      status: 'red',
      summary: `Server still accepts outdated TLS 1.0/1.1 connections (currently negotiating ${protocol} normally). These old versions have known weaknesses and most modern security standards require them disabled.`,
      detail: { protocol, cipher: cipherName, acceptsOldTls },
    }
  }

  if (protocol === 'TLSv1.3' || protocol === 'TLSv1.2') {
    return {
      check_type: 'tls_strength',
      status: 'green',
      summary: `Using ${protocol}, a modern and secure connection standard, with outdated versions correctly disabled.`,
      detail: { protocol, cipher: cipherName },
    }
  }

  return {
    check_type: 'tls_strength',
    status: 'yellow',
    summary: `Connecting over ${protocol}, an older standard. Ask your host to enable TLS 1.2 or 1.3.`,
    detail: { protocol, cipher: cipherName },
  }
}

// ---------------------------------------------------------------------------
// Domain registration expiry, via RDAP (rdap.org bootstrap)
// ---------------------------------------------------------------------------
export async function checkDomainExpiry(domain: string): Promise<CheckResult> {
  try {
    const res = await fetchWithTimeout(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
      headers: { accept: 'application/rdap+json' },
    })
    if (!res.ok) throw new Error(`RDAP responded ${res.status}`)

    const data = (await res.json()) as {
      events?: Array<{ eventAction: string; eventDate: string }>
    }
    const expirationEvent = data.events?.find((e) => e.eventAction === 'expiration')

    if (!expirationEvent) {
      return {
        check_type: 'domain_expiry',
        status: 'unknown',
        summary: "Registry didn't publish an expiration date for this domain.",
        detail: {},
      }
    }

    const expiresAt = new Date(expirationEvent.eventDate)
    const daysLeft = daysBetween(new Date(), expiresAt)

    let status: CheckStatus = 'green'
    if (daysLeft < 0) status = 'red'
    else if (daysLeft < 14) status = 'red'
    else if (daysLeft < 30) status = 'yellow'

    const summary =
      daysLeft < 0
        ? `Domain registration expired ${Math.abs(daysLeft)} days ago.`
        : `Renewed, expires in ${daysLeft} days.`

    return {
      check_type: 'domain_expiry',
      status,
      summary,
      detail: { expiresAt: expirationEvent.eventDate, daysLeft },
    }
  } catch (err) {
    return {
      check_type: 'domain_expiry',
      status: 'unknown',
      summary: 'Could not reach the domain registry to check expiry.',
      detail: { error: String(err) },
    }
  }
}

// ---------------------------------------------------------------------------
// DNS lookups via DNS-over-HTTPS (Cloudflare resolver, no key required)
// ---------------------------------------------------------------------------
interface DohAnswer {
  name: string
  type: number
  data: string
}

interface DohResponse {
  Status: number
  // Whether the response was DNSSEC-authenticated end to end — used by the
  // DNSSEC check below, not just the Answer records.
  AD?: boolean
  Answer?: DohAnswer[]
}

async function dohQueryRaw(name: string, type: string): Promise<DohResponse> {
  const res = await fetchWithTimeout(
    `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`,
    { headers: { accept: 'application/dns-json' } },
  )
  if (!res.ok) throw new Error(`DNS-over-HTTPS responded ${res.status}`)
  return (await res.json()) as DohResponse
}

async function dohQuery(name: string, type: string): Promise<DohAnswer[]> {
  const data = await dohQueryRaw(name, type)
  return data.Answer ?? []
}

async function dohTxtLookup(name: string): Promise<string[]> {
  const answers = await dohQuery(name, 'TXT')
  return answers.map((a) => a.data.replace(/^"|"$/g, ''))
}

export async function checkSpf(emailDomain: string): Promise<CheckResult> {
  try {
    const records = await dohTxtLookup(emailDomain)
    const spf = records.find((r) => r.toLowerCase().startsWith('v=spf1'))

    if (!spf) {
      return {
        check_type: 'spf',
        status: 'red',
        summary: 'No SPF record found. Anyone can send email pretending to be from your domain.',
        detail: {},
      }
    }

    const isPermissive = /[~?]all\s*$/.test(spf) === false && /-all\s*$/.test(spf)
    return {
      check_type: 'spf',
      status: isPermissive ? 'green' : 'yellow',
      summary: isPermissive
        ? 'SPF record found and set to hard-fail unauthorized senders.'
        : 'SPF record found but not set to hard-fail (allows some spoofing).',
      detail: { record: spf },
    }
  } catch (err) {
    return {
      check_type: 'spf',
      status: 'unknown',
      summary: 'Could not look up SPF records.',
      detail: { error: String(err) },
    }
  }
}

// ---------------------------------------------------------------------------
// SPF lookup limit — RFC 7208 caps SPF evaluation at 10 DNS "lookup"
// mechanisms (include / a / mx / ptr / exists / redirect). Go over that and
// mail servers are supposed to treat the ENTIRE SPF record as broken
// (a "permerror"), silently canceling out the protection SPF is meant to
// provide. This is easy to hit by accident: every marketing tool, CRM, or
// helpdesk that sends mail "as you" typically adds its own "include:", and
// each one recursively pulls in whatever lookups ITS record uses too.
// ---------------------------------------------------------------------------
const SPF_LOOKUP_LIMIT = 10
const SPF_LOOKUP_MAX_DEPTH = 10

async function countSpfLookups(domain: string, depth = 0, seen: Set<string> = new Set()): Promise<number> {
  const key = domain.toLowerCase()
  if (depth > SPF_LOOKUP_MAX_DEPTH || seen.has(key)) return 0
  seen.add(key)

  let records: string[]
  try {
    records = await dohTxtLookup(domain)
  } catch {
    return 0
  }
  const spf = records.find((r) => r.toLowerCase().startsWith('v=spf1'))
  if (!spf) return 0

  const terms = spf.trim().split(/\s+/).slice(1)
  let count = 0

  for (const term of terms) {
    const lower = term.toLowerCase()
    if (lower.startsWith('include:')) {
      count += 1
      count += await countSpfLookups(term.slice('include:'.length), depth + 1, seen)
    } else if (lower.startsWith('redirect=')) {
      count += 1
      count += await countSpfLookups(term.slice('redirect='.length), depth + 1, seen)
    } else if (lower === 'a' || lower.startsWith('a:') || lower.startsWith('a/')) {
      count += 1
    } else if (lower === 'mx' || lower.startsWith('mx:') || lower.startsWith('mx/')) {
      count += 1
    } else if (lower === 'ptr' || lower.startsWith('ptr:')) {
      count += 1
    } else if (lower.startsWith('exists:')) {
      count += 1
    }
    // "ip4:", "ip6:", "all", "-all", "~all", "?all" use no DNS lookup.
  }

  return count
}

export async function checkSpfLookupLimit(emailDomain: string): Promise<CheckResult> {
  try {
    const records = await dohTxtLookup(emailDomain)
    const spf = records.find((r) => r.toLowerCase().startsWith('v=spf1'))

    if (!spf) {
      return {
        check_type: 'spf_lookup_limit',
        status: 'unknown',
        summary: "No SPF record found, so there's no lookup count to check.",
        detail: {},
      }
    }

    const lookupCount = await countSpfLookups(emailDomain)

    let status: CheckStatus = 'green'
    if (lookupCount > SPF_LOOKUP_LIMIT) status = 'red'
    else if (lookupCount >= SPF_LOOKUP_LIMIT - 2) status = 'yellow'

    const summary =
      status === 'red'
        ? `SPF record triggers ${lookupCount} DNS lookups, over the 10-lookup limit. Mail servers may treat your entire SPF record as invalid.`
        : status === 'yellow'
          ? `SPF record triggers ${lookupCount} of the 10 allowed DNS lookups, getting close to the limit.`
          : `SPF record triggers ${lookupCount} of the 10 allowed DNS lookups.`

    return {
      check_type: 'spf_lookup_limit',
      status,
      summary,
      detail: { lookupCount, limit: SPF_LOOKUP_LIMIT },
    }
  } catch (err) {
    return {
      check_type: 'spf_lookup_limit',
      status: 'unknown',
      summary: 'Could not count SPF DNS lookups.',
      detail: { error: String(err) },
    }
  }
}

export async function checkDmarc(emailDomain: string): Promise<CheckResult> {
  try {
    const records = await dohTxtLookup(`_dmarc.${emailDomain}`)
    const dmarc = records.find((r) => r.toLowerCase().startsWith('v=dmarc1'))

    if (!dmarc) {
      return {
        check_type: 'dmarc',
        status: 'red',
        summary: 'No DMARC record. This is the single most common gap letting scammers spoof your domain.',
        detail: {},
      }
    }

    const policyMatch = dmarc.match(/p=(\w+)/i)
    const policy = policyMatch?.[1]?.toLowerCase()
    const status: CheckStatus = policy === 'reject' || policy === 'quarantine' ? 'green' : 'yellow'

    return {
      check_type: 'dmarc',
      status,
      summary:
        status === 'green'
          ? `DMARC record found with an enforcing policy (p=${policy}).`
          : `DMARC record found but policy is "p=${policy ?? 'none'}", which only monitors and doesn't block spoofed mail.`,
      detail: { record: dmarc, policy },
    }
  } catch (err) {
    return {
      check_type: 'dmarc',
      status: 'unknown',
      summary: 'Could not look up DMARC records.',
      detail: { error: String(err) },
    }
  }
}

// ---------------------------------------------------------------------------
// BIMI (Brand Indicators for Message Identification) — an optional DNS TXT
// record that puts a business's logo next to its emails in Gmail, Yahoo, and
// Apple Mail. It's not a security gap to skip, but mailbox providers only
// honor it once DMARC is enforcing (p=quarantine or p=reject), so this check
// looks up both records to explain WHY a logo might not show up, rather than
// just reporting "missing."
// ---------------------------------------------------------------------------
export async function checkBimi(emailDomain: string): Promise<CheckResult> {
  try {
    const [bimiRecords, dmarcRecords] = await Promise.all([
      dohTxtLookup(`default._bimi.${emailDomain}`),
      dohTxtLookup(`_dmarc.${emailDomain}`),
    ])

    const bimi = bimiRecords.find((r) => r.toLowerCase().startsWith('v=bimi1'))
    const dmarc = dmarcRecords.find((r) => r.toLowerCase().startsWith('v=dmarc1'))
    const dmarcPolicy = dmarc?.match(/p=(\w+)/i)?.[1]?.toLowerCase()
    const dmarcEnforcing = dmarcPolicy === 'reject' || dmarcPolicy === 'quarantine'

    if (bimi) {
      const hasLogo = /l=https:\/\/\S+\.svg/i.test(bimi)

      if (!hasLogo) {
        return {
          check_type: 'bimi',
          status: 'yellow',
          summary: "BIMI record found, but it's missing a valid logo link, so your logo likely won't show up in inboxes.",
          detail: { record: bimi },
        }
      }
      if (!dmarcEnforcing) {
        return {
          check_type: 'bimi',
          status: 'yellow',
          summary: "BIMI record found, but most inboxes won't show your logo until your DMARC policy is enforcing (see the DMARC check).",
          detail: { record: bimi },
        }
      }
      return {
        check_type: 'bimi',
        status: 'green',
        summary: 'BIMI record found and configured to show your logo in supporting inboxes.',
        detail: { record: bimi },
      }
    }

    if (dmarcEnforcing) {
      return {
        check_type: 'bimi',
        status: 'yellow',
        summary: 'No BIMI record. Your DMARC policy already qualifies, so you could add your logo to emails in Gmail, Yahoo, and Apple Mail.',
        detail: {},
      }
    }

    return {
      check_type: 'bimi',
      status: 'unknown',
      summary: 'No BIMI record. This is optional, and only works once your DMARC policy is enforcing.',
      detail: {},
    }
  } catch (err) {
    return {
      check_type: 'bimi',
      status: 'unknown',
      summary: 'Could not check for a BIMI record.',
      detail: { error: String(err) },
    }
  }
}

const COMMON_DKIM_SELECTORS = ['google', 'selector1', 'selector2', 'default', 'k1', 'dkim', 's1']

export async function checkDkim(emailDomain: string): Promise<CheckResult> {
  try {
    const results = await Promise.allSettled(
      COMMON_DKIM_SELECTORS.map(async (selector) => {
        const records = await dohTxtLookup(`${selector}._domainkey.${emailDomain}`)
        const found = records.find((r) => /v=dkim1|p=/i.test(r))
        return found ? selector : null
      }),
    )
    const foundSelector = results.find(
      (r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled' && r.value !== null,
    )

    if (foundSelector) {
      return {
        check_type: 'dkim',
        status: 'green',
        summary: `DKIM record found (selector "${foundSelector.value}").`,
        detail: { selector: foundSelector.value },
      }
    }

    return {
      check_type: 'dkim',
      status: 'yellow',
      summary:
        'No DKIM record found on common selectors. If your mail provider uses a custom selector this may be a false alarm, worth confirming manually.',
      detail: { checkedSelectors: COMMON_DKIM_SELECTORS },
    }
  } catch (err) {
    return {
      check_type: 'dkim',
      status: 'unknown',
      summary: 'Could not look up DKIM records.',
      detail: { error: String(err) },
    }
  }
}

// ---------------------------------------------------------------------------
// Website security headers
// ---------------------------------------------------------------------------
const RECOMMENDED_HEADERS = [
  'strict-transport-security',
  'x-content-type-options',
  'content-security-policy',
  'x-frame-options',
]

export async function checkSecurityHeaders(domain: string): Promise<CheckResult> {
  try {
    const res = await fetchWithTimeout(`https://${domain}`, { redirect: 'follow' })
    const present = RECOMMENDED_HEADERS.filter((h) => res.headers.has(h))
    const missing = RECOMMENDED_HEADERS.filter((h) => !res.headers.has(h))

    let status: CheckStatus = 'green'
    if (present.length <= 1) status = 'red'
    else if (present.length <= 3) status = 'yellow'

    return {
      check_type: 'headers',
      status,
      summary: `${present.length} of ${RECOMMENDED_HEADERS.length} recommended headers present.`,
      detail: { present, missing },
    }
  } catch (err) {
    return {
      check_type: 'headers',
      status: 'unknown',
      summary: 'Could not reach the site to check response headers.',
      detail: { error: String(err) },
    }
  }
}

// ---------------------------------------------------------------------------
// Blocklist / reputation, via the Spamhaus Domain Block List (DBL) — a free,
// public DNS zone. Querying "<domain>.dbl.spamhaus.org" returns an A record
// (in the 127.0.1.x range) if the domain is flagged for spam, phishing,
// malware, or botnet activity; no answer means it's not listed. This is the
// same mechanism most free "is my domain blocklisted" tools use under the
// hood, just queried directly.
// ---------------------------------------------------------------------------
export async function checkBlocklist(domain: string): Promise<CheckResult> {
  try {
    const answers = await dohQuery(`${domain}.dbl.spamhaus.org`, 'A')

    if (!answers.length) {
      return {
        check_type: 'blocklist',
        status: 'green',
        summary: 'Not flagged on the Spamhaus blocklist.',
        detail: {},
      }
    }

    const code = answers[0].data
    const reasons: Record<string, string> = {
      '127.0.1.2': 'flagged for spam',
      '127.0.1.4': 'flagged for phishing',
      '127.0.1.5': 'flagged for malware',
      '127.0.1.6': 'flagged as a botnet controller',
    }
    const reason = reasons[code] ?? 'flagged as suspicious'

    return {
      check_type: 'blocklist',
      status: 'red',
      summary: `Domain is on a public blocklist (${reason}). This will badly hurt email deliverability and can get your site flagged by browsers.`,
      detail: { code },
    }
  } catch (err) {
    return {
      check_type: 'blocklist',
      status: 'unknown',
      summary: 'Could not check blocklist status.',
      detail: { error: String(err) },
    }
  }
}

// ---------------------------------------------------------------------------
// Outdated CMS detection — currently WordPress only, the most common small
// business CMS. Looks for the <meta name="generator"> tag WordPress adds by
// default, and compares it against the latest version from WordPress.org's
// own public, keyless version-check API. Sites that hide this tag (a common,
// reasonable security practice) or aren't WordPress both come back
// "unknown", never a false "red".
// ---------------------------------------------------------------------------
function parseVersion(v: string): number[] {
  return v.split('.').map((n) => parseInt(n, 10) || 0)
}

function isOlderVersion(a: number[], b: number[]): boolean {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const av = a[i] ?? 0
    const bv = b[i] ?? 0
    if (av !== bv) return av < bv
  }
  return false
}

export async function checkCmsVersion(domain: string): Promise<CheckResult> {
  try {
    const res = await fetchWithTimeout(`https://${domain}`, { redirect: 'follow' })
    const html = await res.text()

    const match = html.match(/<meta\s+name=["']generator["']\s+content=["']WordPress\s+([\d.]+)["']/i)
    if (!match) {
      return {
        check_type: 'cms_version',
        status: 'unknown',
        summary: "Didn't detect a WordPress version tag. Normal if you're not on WordPress, or if it's hidden for security.",
        detail: {},
      }
    }

    const detected = match[1]
    const latestRes = await fetchWithTimeout('https://api.wordpress.org/core/version-check/1.7/')
    const latestData = (await latestRes.json()) as { offers?: Array<{ current?: string }> }
    const latest = latestData.offers?.[0]?.current

    if (!latest) {
      return {
        check_type: 'cms_version',
        status: 'unknown',
        summary: `Running WordPress ${detected}, but couldn't reach WordPress.org to check the latest version.`,
        detail: { detected },
      }
    }

    const behind = isOlderVersion(parseVersion(detected), parseVersion(latest))
    return {
      check_type: 'cms_version',
      status: behind ? 'red' : 'green',
      summary: behind
        ? `Running WordPress ${detected}, which is behind the current version (${latest}). Outdated WordPress installs are one of the most common ways small business sites get hacked.`
        : `Running WordPress ${detected}, up to date.`,
      detail: { detected, latest },
    }
  } catch (err) {
    return {
      check_type: 'cms_version',
      status: 'unknown',
      summary: 'Could not check the site for CMS version information.',
      detail: { error: String(err) },
    }
  }
}

// ---------------------------------------------------------------------------
// CAA (Certification Authority Authorization) — a DNS record that restricts
// which certificate authorities are allowed to issue SSL certificates for a
// domain. Optional, so a missing record is a caution, not a real gap; it's
// the same "recommended but not scored harshly" treatment as BIMI above.
// ---------------------------------------------------------------------------
export async function checkCaaRecord(domain: string): Promise<CheckResult> {
  try {
    const answers = await dohQuery(domain, 'CAA')
    if (!answers.length) {
      return {
        check_type: 'caa',
        status: 'yellow',
        summary:
          'No CAA record found. Optional, but it stops other certificate authorities from mistakenly or maliciously issuing an SSL certificate for your domain.',
        detail: {},
      }
    }
    return {
      check_type: 'caa',
      status: 'green',
      summary: 'CAA record found, restricting which certificate authorities can issue SSL certificates for your domain.',
      detail: { records: answers.map((a) => a.data) },
    }
  } catch (err) {
    return {
      check_type: 'caa',
      status: 'unknown',
      summary: 'Could not look up CAA records.',
      detail: { error: String(err) },
    }
  }
}

// ---------------------------------------------------------------------------
// DNSSEC — cryptographically signs DNS records so they can't be silently
// spoofed or redirected. Checked two ways: whether the domain publishes
// DNSKEY records at all, and whether Cloudflare's resolver actually
// validated the signature chain (the "AD" — Authenticated Data — flag on
// the DNS-over-HTTPS response). Like CAA, most small business domains don't
// have this set up, so it's treated as recommended hygiene, not a hard fail.
// ---------------------------------------------------------------------------
export async function checkDnssec(domain: string): Promise<CheckResult> {
  try {
    const data = await dohQueryRaw(domain, 'DNSKEY')
    const hasDnskey = (data.Answer ?? []).length > 0

    if (!hasDnskey) {
      return {
        check_type: 'dnssec',
        status: 'yellow',
        summary:
          "DNSSEC isn't enabled for this domain. Optional, but it cryptographically signs your DNS records so they can't be silently redirected or spoofed.",
        detail: {},
      }
    }

    if (!data.AD) {
      return {
        check_type: 'dnssec',
        status: 'yellow',
        summary: "DNSSEC keys are published, but the signature chain isn't validating correctly, so it may not be protecting you as intended.",
        detail: {},
      }
    }

    return {
      check_type: 'dnssec',
      status: 'green',
      summary: 'DNSSEC is enabled and validating, protecting your domain from DNS spoofing.',
      detail: {},
    }
  } catch (err) {
    return {
      check_type: 'dnssec',
      status: 'unknown',
      summary: 'Could not check DNSSEC status.',
      detail: { error: String(err) },
    }
  }
}

export async function runAllChecks(domain: string, emailDomain: string): Promise<CheckResult[]> {
  const [
    uptime,
    ssl,
    tlsStrength,
    domainExpiry,
    spf,
    spfLookupLimit,
    dkim,
    dmarc,
    bimi,
    headers,
    blocklist,
    cmsVersion,
    caa,
    dnssec,
  ] = await Promise.all([
    checkUptime(domain),
    checkSslExpiry(domain),
    checkTlsStrength(domain),
    checkDomainExpiry(domain),
    checkSpf(emailDomain),
    checkSpfLookupLimit(emailDomain),
    checkDkim(emailDomain),
    checkDmarc(emailDomain),
    checkBimi(emailDomain),
    checkSecurityHeaders(domain),
    checkBlocklist(domain),
    checkCmsVersion(domain),
    checkCaaRecord(domain),
    checkDnssec(domain),
  ])
  const pageSpeed = derivePageSpeedCheck(uptime)
  return [
    uptime,
    pageSpeed,
    ssl,
    tlsStrength,
    domainExpiry,
    spf,
    spfLookupLimit,
    dkim,
    dmarc,
    bimi,
    headers,
    blocklist,
    cmsVersion,
    caa,
    dnssec,
  ]
}
