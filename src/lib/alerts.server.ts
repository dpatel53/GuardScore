// Shared by the cron routes (daily full scan + the fast uptime-only poll).
// Sends nothing, and never throws, when RESEND_API_KEY isn't configured —
// checks still run and save either way, alerting is just skipped.
export async function sendAlertEmail(to: string, subject: string, text: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.ALERTS_FROM_EMAIL ?? 'alerts@guardscore.app',
      to,
      subject,
      text,
    }),
  }).catch(() => null)
}
