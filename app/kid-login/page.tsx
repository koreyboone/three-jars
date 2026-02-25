// app/kid-login/page.tsx
import { redirect } from 'next/navigation'
import { getParentSession } from '@/lib/auth/parent'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { KidSelector } from '@/types/db'

export async function generateMetadata() {
  return { title: 'Kid Login — Three Jars' }
}

export default async function KidLoginPage() {
  const user = await getParentSession()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const { data: kids } = await supabase
    .from('kids')
    .select('id, name, avatar_emoji')
    .eq('parent_id', user.id)
    .order('created_at', { ascending: true })

  const kidList = (kids ?? []) as KidSelector[]

  return (
    <main className="min-h-screen bg-gradient-to-b from-savings/5 to-savings-accent/10 flex flex-col items-center justify-center px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold font-display text-savings mb-2">
          🏦 Who&apos;s counting today?
        </h1>
        <p className="text-slate-500 font-display text-lg">
          Tap your picture to log in
        </p>
      </div>

      {kidList.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-slate-400 mb-4">No kids added yet!</p>
          <Link
            href="/parent/dashboard"
            className="text-savings hover:underline font-semibold"
          >
            ← Go to parent dashboard to add a kid
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-lg w-full">
          {kidList.map((kid) => (
            <Link
              key={kid.id}
              href={`/kid-login/${kid.id}`}
              className="flex flex-col items-center gap-2 p-6 bg-white rounded-2xl shadow-md hover:shadow-xl hover:scale-105 transition-all min-h-[140px] min-w-[120px]"
            >
              <span className="text-6xl">{kid.avatar_emoji}</span>
              <span className="text-lg font-bold font-display text-navy">
                {kid.name}
              </span>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8">
        <Link
          href="/parent/dashboard"
          className="text-sm text-slate-400 hover:text-slate-600"
        >
          ← Back to parent dashboard
        </Link>
      </div>
    </main>
  )
}
