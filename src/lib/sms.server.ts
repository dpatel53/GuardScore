// SMS alerts via Twilio's plain REST API (no SDK dependency, same pattern as
// the Resend email integration). Silently does nothing, never throws, when
// Twilio isn't configured or the recipient has no phone number saved —
// checks and email alerts still work either way.
export async function sendAlertSms(toPhone: string, body: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_FROM_NUMBER
  if (!accountSid || !authToken || !fromNumber) return

  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64')

  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: toPhone, From: fromNumber, Body: body.slice(0, 300) }),
  }).catch(() => null)
}
