import type { PortfolioAnalytics } from './dashboardData.server'

// Same "no-op if unconfigured" pattern as alerts.server.ts, just with an
// HTML body instead of plain text since this is a digest meant to be
// skimmed, not an urgent single-issue alert.
function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function buildWeeklyReportHtml(analytics: PortfolioAnalytics, generatedAt: Date): string {
  const avgScore = analytics.domainScores.length
    ? Math.round(
        analytics.domainScores.reduce((sum, d) => sum + d.score, 0) / analytics.domainScores.length,
      )
    : 0

  const rows = [...analytics.domainScores]
    .sort((a, b) => a.score - b.score)
    .map(
      (d) => `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${escapeHtml(d.domain)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">${d.grade}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">${d.score}/100</td>
      </tr>`,
    )
    .join('')

  const domainCount = analytics.domainScores.length

  return `<!doctype html>
<html>
  <body style="font-family:-apple-system,Helvetica,Arial,sans-serif;color:#0f172a;background:#f8f9fb;padding:24px;margin:0;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;border:1px solid #e2e8f0;">
      <p style="font-size:13px;color:#64748b;margin:0 0 4px;">GuardScore weekly report</p>
      <h1 style="font-size:22px;margin:0 0 20px;">Your ${domainCount} domain${domainCount === 1 ? '' : 's'}, at a glance</h1>
      <div style="background:#f1f5f9;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
        <p style="font-size:13px;color:#64748b;margin:0 0 4px;">Average score across your portfolio</p>
        <p style="font-size:32px;font-weight:800;margin:0;">${avgScore}/100</p>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr>
            <th style="text-align:left;padding:8px 12px;border-bottom:2px solid #0f172a;">Domain</th>
            <th style="text-align:right;padding:8px 12px;border-bottom:2px solid #0f172a;">Grade</th>
            <th style="text-align:right;padding:8px 12px;border-bottom:2px solid #0f172a;">Score</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="font-size:13px;color:#64748b;margin-top:24px;">
        Needs attention: ${analytics.severity.attention} &middot; To review: ${analytics.severity.review} &middot; Good: ${analytics.severity.good}
      </p>
      <p style="font-size:12px;color:#94a3b8;margin-top:24px;">
        Generated ${generatedAt.toLocaleDateString()}. Log in to GuardScore for full detail and
        plain-English next steps on each issue.
      </p>
    </div>
  </body>
</html>`
}

export async function sendWeeklyReportEmail(to: string, analytics: PortfolioAnalytics) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return
  if (!analytics.domainScores.length) return // nothing to report yet

  const html = buildWeeklyReportHtml(analytics, new Date())

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.ALERTS_FROM_EMAIL ?? 'alerts@guardscore.app',
      to,
      subject: 'Your weekly GuardScore report',
      html,
    }),
  }).catch(() => null)
}
