import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSubscriptionAccess } from '@/lib/planAccess.server'
import Sidebar from './Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Trial expired with no paid subscription, or a subscription that's
  // past_due/canceled/incomplete: lock the dashboard and send them to
  // billing instead of rendering anything below this layout.
  const { hasAccess } = await getSubscriptionAccess(supabase, user.id)
  if (!hasAccess) redirect('/billing?expired=1')

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <Sidebar email={user.email ?? ''} />
      <main className="flex-1 px-4 py-6 sm:px-6 md:px-10 md:py-10">
        <div className="mx-auto max-w-3xl">{children}</div>
      </main>
    </div>
  )
}
