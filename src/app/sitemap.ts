import type { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/blog.server'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://guardscore.dev'

// dashboard, billing, and login are behind auth or purely transactional and
// are excluded via robots.ts instead. Add each new vertical landing page
// here as it ships (see the content calendar) -- blog posts are picked up
// automatically from src/content/blog.
export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts()

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/scan`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    ...posts.map((post) => ({
      url: `${siteUrl}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ]
}
