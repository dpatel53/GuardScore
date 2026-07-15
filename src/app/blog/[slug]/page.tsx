import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ShieldCheckIcon, ArrowRightIcon } from '@/components/icons'
import { getAllPosts, getPostBySlug } from '@/lib/blog.server'

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}
  return {
    title: `${post.title} — GuardScore`,
    description: post.description,
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

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
          <Link href="/blog" className="text-sm font-medium text-muted hover:text-foreground">
            Back to blog
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-14">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
          {formatDate(post.date)}
        </p>
        <h1 className="mb-8 text-4xl font-extrabold leading-tight tracking-tight">{post.title}</h1>

        <div
          className="[&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2 [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:tracking-tight [&_li]:mb-2 [&_li]:leading-relaxed [&_ol]:mb-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-5 [&_p]:leading-relaxed [&_p]:text-muted [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:mb-5 [&_ul]:list-disc [&_ul]:pl-6"
          dangerouslySetInnerHTML={{ __html: post.html }}
        />

        <div className="mt-8 rounded-2xl border border-border bg-pill/40 p-7">
          <p className="mb-1 text-base font-semibold">See where your own site stands</p>
          <p className="mb-5 text-sm text-muted">
            GuardScore checks your uptime, SSL certificate, email authentication, and DNS security
            automatically, and tells you in plain English the moment something needs attention.
          </p>
          <Link
            href="/login?mode=signup"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground"
          >
            Run a free scan
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-2xl px-6 py-8 text-sm text-muted">
          GuardScore is a monitoring tool. It reports on public signals, it does not manage or fix
          your systems.
        </div>
      </footer>
    </div>
  )
}
