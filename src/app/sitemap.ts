import type { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://guardscore.dev'

// Only the public marketing page is indexable today. Add each new URL here
// as blog posts / vertical landing pages ship (see the content calendar) --
// dashboard, billing, and login are behind auth or purely transactional and
// are excluded via robots.ts instead.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]
}
