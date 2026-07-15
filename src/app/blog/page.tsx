import type { Metadata } from 'next'
import Link from 'next/link'
import { ShieldCheckIcon, ArrowRightIcon } from '@/components/icons'
import { getAllPosts } from '@/lib/blog.server'

export const metadata: Metadata = {
  title: 'Blog — GuardScore',
  description:
    'Plain-English guides on website uptime, SSL certificates, email authentication, and keeping a small business site secure — no IT background required.',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function BlogIndexPage() {
  const posts = getAllPosts()

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent">
              <ShieldCheckIcon className="h-3.5 w-3.5 text-accent-foreground" />
            </span>
            Guard<span className="text-[#2F6FED]">Score</span>
          </Link>
          <Link href="/" className="text-sm font-medium text-muted hover:text-foreground">
            Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-14">
        <h1 className="mb-3 text-4xl font-extrabold tracking-tight">Blog</h1>
        <p className="mb-12 max-w-xl text-muted">
          Plain-English guides for business owners without an IT background — no jargon, just what
          broke and what to do about it.
        </p>

        <div className="flex flex-col gap-5">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group rounded-2xl border border-border bg-surface p-6 transition hover:border-[#2F6FED]/40"
            >
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                {formatDate(post.date)}
              </p>
              <h2 className="mb-2 text-xl font-bold tracking-tight group-hover:text-[#1D4ED8]">
                {post.title}
              </h2>
              <p className="mb-3 text-sm leading-relaxed text-muted">{post.description}</p>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-[#1D4ED8]">
                Read the article
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}

          {posts.length === 0 && (
            <p className="text-sm text-muted">No posts yet — check back soon.</p>
          )}
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-3xl px-6 py-8 text-sm text-muted">
          GuardScore is a monitoring tool. It reports on public signals, it does not manage or fix
          your systems.
        </div>
      </footer>
    </div>
  )
}
