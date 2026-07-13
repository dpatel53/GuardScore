// Renders the embeddable trust badge as raw SVG. Deliberately shows ONLY the
// letter grade, nothing more — never a check summary, never which specific
// thing is wrong. A domain's owner might want the world to see "B", but
// nobody should be able to publish "pdfsignstudio.com has no DMARC record" to the
// entire internet just by embedding a badge; that's a map straight to their
// weak spot.
const GRADE_COLORS: Record<string, string> = {
  A: '#15803d',
  B: '#15803d',
  C: '#b45309',
  D: '#b45309',
  F: '#b91c1c',
}

export function renderGradeBadge(grade: string): string {
  const color = GRADE_COLORS[grade] ?? '#64748b'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="176" height="56" viewBox="0 0 176 56">
  <rect width="176" height="56" rx="10" fill="#0f172a" />
  <circle cx="32" cy="28" r="18" fill="${color}" />
  <text x="32" y="34" font-family="-apple-system,Helvetica,Arial,sans-serif" font-size="18" font-weight="700" fill="#ffffff" text-anchor="middle">${grade}</text>
  <text x="58" y="24" font-family="-apple-system,Helvetica,Arial,sans-serif" font-size="12" font-weight="700" fill="#ffffff">GuardScore</text>
  <text x="58" y="39" font-family="-apple-system,Helvetica,Arial,sans-serif" font-size="10" fill="#94a3b8">Security checked</text>
</svg>`
}

export function renderUnmonitoredBadge(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="176" height="56" viewBox="0 0 176 56">
  <rect width="176" height="56" rx="10" fill="#f1f5f9" stroke="#e2e8f0" />
  <text x="16" y="24" font-family="-apple-system,Helvetica,Arial,sans-serif" font-size="12" font-weight="700" fill="#0f172a">GuardScore</text>
  <text x="16" y="40" font-family="-apple-system,Helvetica,Arial,sans-serif" font-size="10" fill="#64748b">Not yet monitored</text>
</svg>`
}

// Domain is monitored and has a real score, but the owner is on a plan that
// doesn't include badge sharing. Deliberately distinct copy from the
// "not yet monitored" badge above — this domain IS monitored, it's just not
// shareable on the owner's current plan.
export function renderPlanRestrictedBadge(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="176" height="56" viewBox="0 0 176 56">
  <rect width="176" height="56" rx="10" fill="#f1f5f9" stroke="#e2e8f0" />
  <text x="16" y="24" font-family="-apple-system,Helvetica,Arial,sans-serif" font-size="12" font-weight="700" fill="#0f172a">GuardScore</text>
  <text x="16" y="40" font-family="-apple-system,Helvetica,Arial,sans-serif" font-size="10" fill="#64748b">Badge not available on this plan</text>
</svg>`
}
