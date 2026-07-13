'use client'

import { useState } from 'react'

export default function BadgeEmbedSnippet({ domain }: { domain: string }) {
  const [copied, setCopied] = useState(false)
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const snippet = `<a href="${siteUrl}/badge/${domain}"><img src="${siteUrl}/api/badge/${domain}" alt="${domain} security grade" /></a>`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(snippet)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard access can fail silently (e.g. permissions); no harm done
    }
  }

  return (
    <div>
      <code className="mb-3 block break-all rounded-lg bg-background px-3 py-2.5 text-xs text-muted">
        {snippet}
      </code>
      <button
        type="button"
        onClick={handleCopy}
        className="rounded-full border border-border px-4 py-1.5 text-xs font-medium"
      >
        {copied ? 'Copied' : 'Copy code'}
      </button>
    </div>
  )
}
