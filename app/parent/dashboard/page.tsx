// app/parent/dashboard/page.tsx
import { requireParentSession } from '@/lib/auth/parent'
import { createClient } from '@/lib/supabase/server'
import KidSummaryCard from '@/components/parent/kid-summary-card'
import AddKidForm from '@/components/parent/add-kid-form'
import type { Kid, Jar } from '@/types/db'

export async function generateMetadata() {
  return { title: 'Dashboard — Three Jars' }
}

export default async function ParentDashboard() {
  const user = await requireParentSession()
  const supabase = await createClient()

  const { data: kids } = await supabase
    .from('kids')
    .select('*')
    .eq('parent_id', user.id)
    .order('created_at', { ascending: true })

  const kidList = (kids ?? []) as Kid[]

  let allJars: Jar[] = []
  if (kidList.length > 0) {
    const kidIds = kidList.map((k) => k.id)
    const { data: jars } = await supabase
      .from('jars')
      .select('*')
      .in('kid_id', kidIds)
    allJars = (jars ?? []) as Jar[]
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy">Your Kids</h1>
      </div>

      {kidList.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {kidList.map((kid) => (
            <KidSummaryCard
              key={kid.id}
              kid={kid}
              jars={allJars.filter((j) => j.kid_id === kid.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 mb-8 bg-white rounded-xl shadow-sm">
          <p className="text-3xl mb-2">👋</p>
          <p className="text-slate-500 text-lg">
            Welcome! Add your first kid to get started.
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-navy mb-4">➕ Add a Kid</h2>
        <AddKidForm />
      </div>
    </div>
  )
}
