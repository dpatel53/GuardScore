'use server'

import { headers } from 'next/headers'
import { checkUptime, checkSslExpiry, checkSecurityHeaders } from '@/lib/checks.server'
import {
  normalizePublicDomain,
  isWellFormedDomain,
  isSafeToScan,
  checkAndLogScan,
} from '@/lib/publicScan.server'
import type { CheckResult } from '@/lib/checks'

export interface PublicScanState {
  error: string | null
  domain: string | null
  results: CheckResult[] | null
}

export const initialPublicScanState: PublicScanState = { error: null, domain: null, results: null }

async function getClientIp(): Promise<string> {
  const h = await headers()
  const forwardedFor = h.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0].trim()
  return h.get('x-real-ip') ?? 'unknown'
}

// Bare-minimum, unauthenticated version of the dashboard's full 15-point
// check suite -- just enough to show real value (a genuine finding, not a
// canned demo) without giving away the full report. Deliberately doesn't
// compute an overall A-F grade: that's derived from all 15 checks together
// in the real product, and synthesizing one from 3 partial results would be
// misleading rather than "bare minimum."
export async function runPublicScan(
  _prevState: PublicScanState,
  formData: FormData,
): Promise<PublicScanState> {
  const domain = normalizePublicDomain(String(formData.get('domain') ?? ''))

  if (!domain) return { error: 'Enter a domain.', domain: null, results: null }
  if (!isWellFormedDomain(domain)) {
    return {
      error: "That doesn't look like a valid domain (example: yourbusiness.com).",
      domain: null,
      results: null,
    }
  }

  const ip = await getClientIp()
  const { allowed } = await checkAndLogScan(ip, domain)
  if (!allowed) {
    return {
      error:
        "You've used up today's free scans from this connection. Create a free account for unlimited checks and the full report.",
      domain: null,
      results: null,
    }
  }

  const safe = await isSafeToScan(domain)
  if (!safe) {
    return {
      error: "That domain couldn't be scanned. Double-check it and try again.",
      domain: null,
      results: null,
    }
  }

  const [uptime, ssl, securityHeaders] = await Promise.all([
    checkUptime(domain),
    checkSslExpiry(domain),
    checkSecurityHeaders(domain),
  ])

  return { error: null, domain, results: [uptime, ssl, securityHeaders] }
}
