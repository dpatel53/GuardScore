// Groups the existing synthetic checks into the same kind of themed
// categories a Site Audit tool shows ("Crawlability", "HTTPS", "Site
// Performance", etc.) — but built entirely from checks GuardScore already
// runs against a single homepage fetch + DNS lookups. No new data source,
// no site crawl, just a different way of grouping and presenting what's
// already collected.
import type { CheckType } from './checks'

export type Theme = 'website_health' | 'security' | 'email_security' | 'domain'

export const THEME_ORDER: Theme[] = ['website_health', 'security', 'email_security', 'domain']

export const THEME_LABELS: Record<Theme, string> = {
  website_health: 'Website Health',
  security: 'Site Security',
  email_security: 'Email Security',
  domain: 'Domain',
}

export const THEME_CHECKS: Record<Theme, CheckType[]> = {
  website_health: ['uptime', 'page_speed'],
  security: ['ssl', 'tls_strength', 'headers', 'blocklist', 'cms_version'],
  email_security: ['spf', 'spf_lookup_limit', 'dkim', 'dmarc', 'bimi'],
  domain: ['domain_expiry', 'caa', 'dnssec'],
}
