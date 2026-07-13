export type PlanId = 'starter' | 'business' | 'pro'

export interface PlanTier {
  id: PlanId
  name: string
  price: number
  domainLimit: number
  description: string
  popular: boolean
  features: string[]
  omitted: string[]
}

export const PLAN_TIERS: PlanTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    domainLimit: 1,
    description: 'For freelancers and solo owners.',
    popular: false,
    features: [
      '1 domain monitored',
      'Website uptime monitoring',
      'Page speed monitoring',
      'SSL certificate + TLS strength checks',
      'SPF / DKIM / DMARC checks',
      'Security headers check',
      'Domain registration expiry',
      'DNS security (CAA + DNSSEC) checks',
      'Blocklist + outdated software checks',
      'Daily automated re-checks',
      'Email alerts on new issues',
    ],
    omitted: [
      'Multiple domains',
      'SMS alerts on new issues',
      'Shareable trust badge',
      'Maintenance windows to pause alerts',
      'Analytics dashboard + weekly report',
      'Priority support',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    price: 59,
    domainLimit: 5,
    description: 'Most popular for small businesses.',
    popular: true,
    features: [
      'Up to 5 domains monitored',
      'Website uptime monitoring',
      'Page speed monitoring',
      'SSL certificate + TLS strength checks',
      'SPF / DKIM / DMARC checks',
      'Security headers check',
      'Domain registration expiry',
      'DNS security (CAA + DNSSEC) checks',
      'Blocklist + outdated software checks',
      'Daily automated re-checks',
      'Email + SMS alerts on new issues',
      'Shareable trust badge',
      'Maintenance windows to pause alerts',
      'Analytics dashboard + weekly report',
      'Priority email support',
    ],
    omitted: ['20 domains'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 99,
    domainLimit: 20,
    description: 'For agencies and growing teams.',
    popular: false,
    features: [
      'Up to 20 domains monitored',
      'Website uptime monitoring',
      'Page speed monitoring',
      'SSL certificate + TLS strength checks',
      'SPF / DKIM / DMARC checks',
      'Security headers check',
      'Domain registration expiry',
      'DNS security (CAA + DNSSEC) checks',
      'Blocklist + outdated software checks',
      'Daily automated re-checks',
      'Email + SMS alerts on new issues',
      'Shareable trust badge',
      'Maintenance windows to pause alerts',
      'Analytics dashboard + weekly report',
      'Priority support',
    ],
    omitted: [],
  },
]

export function planById(id: string | null | undefined): PlanTier {
  return PLAN_TIERS.find((p) => p.id === id) ?? PLAN_TIERS[1]
}
