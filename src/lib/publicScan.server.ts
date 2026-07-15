// Support for the public, no-account "free scan" teaser at /scan. Kept
// separate from the authenticated dashboard flow (dashboard/actions.ts)
// because this endpoint has no login wall at all: anyone can point it at
// any domain. That means it needs its own input validation (to stop it
// being used as an SSRF proxy against internal network addresses) and its
// own abuse rate-limiting (since there's no account to throttle instead).

import crypto from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'

// ---------------------------------------------------------------------------
// Domain normalization + format validation
// ---------------------------------------------------------------------------
const DOMAIN_PATTERN = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.[a-z0-9-]{1,63})*\.[a-z]{2,}$/i

const BLOCKED_HOSTNAMES = new Set(['localhost', 'metadata.google.internal'])

export function normalizePublicDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '')
}

export function isWellFormedDomain(domain: string): boolean {
  if (!domain || domain.length > 253) return false
  if (BLOCKED_HOSTNAMES.has(domain)) return false
  if (domain.endsWith('.local') || domain.endsWith('.internal')) return false
  return DOMAIN_PATTERN.test(domain)
}

// ---------------------------------------------------------------------------
// SSRF guard -- resolves the domain via DNS-over-HTTPS and rejects it if any
// answer lands in a private, loopback, link-local, or cloud-metadata range
// (169.254.169.254 in particular) before any real check ever fetches it.
// Fails closed: anything we can't confidently verify as safe is rejected.
// ---------------------------------------------------------------------------
function isPrivateOrReservedIpv4(ip: string): boolean {
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true
  const [a, b] = parts
  if (a === 10) return true
  if (a === 127) return true
  if (a === 0) return true
  if (a === 169 && b === 254) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a === 100 && b >= 64 && b <= 127) return true
  return false
}

function isPrivateOrReservedIpv6(ip: string): boolean {
  const lower = ip.toLowerCase()
  if (lower === '::1') return true
  if (lower.startsWith('fe80:')) return true
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true
  if (lower.startsWith('::ffff:')) return isPrivateOrReservedIpv4(lower.replace('::ffff:', ''))
  return false
}

interface DohAnswer {
  data: string
}
interface DohResponse {
  Answer?: DohAnswer[]
}

async function dohLookup(domain: string, type: 'A' | 'AAAA'): Promise<string[]> {
  const res = await fetch(
    `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${type}`,
    { headers: { accept: 'application/dns-json' } },
  )
  if (!res.ok) return []
  const data = (await res.json()) as DohResponse
  return (data.Answer ?? []).map((a) => a.data)
}

export async function isSafeToScan(domain: string): Promise<boolean> {
  try {
    const [aRecords, aaaaRecords] = await Promise.all([
      dohLookup(domain, 'A'),
      dohLookup(domain, 'AAAA'),
    ])
    if (!aRecords.length && !aaaaRecords.length) return false
    if (aRecords.some(isPrivateOrReservedIpv4)) return false
    if (aaaaRecords.some(isPrivateOrReservedIpv6)) return false
    return true
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Rate limiting -- no Redis/Upstash in this stack, so this logs to a plain
// Supabase table (public_scan_log, written via the service-role admin
// client since there's no logged-in user to scope an RLS policy to) and
// counts rows in a rolling window. Keyed off a hash of the requester's IP,
// never the raw address. See the CREATE TABLE statement shared separately
// for the schema this depends on.
// ---------------------------------------------------------------------------
const RATE_LIMIT_MAX = 3
const RATE_LIMIT_WINDOW_HOURS = 24

export function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex')
}

export async function checkAndLogScan(ip: string, domain: string): Promise<{ allowed: boolean }> {
  const admin = createAdminClient()
  const ipHash = hashIp(ip)
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000).toISOString()

  const { count } = await admin
    .from('public_scan_log')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('created_at', windowStart)

  if ((count ?? 0) >= RATE_LIMIT_MAX) {
    return { allowed: false }
  }

  await admin.from('public_scan_log').insert({ ip_hash: ipHash, domain })
  return { allowed: true }
}
