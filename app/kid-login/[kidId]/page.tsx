// app/kid-login/[kidId]/page.tsx
import { redirect } from 'next/navigation'
import { getParentSession } from '@/lib/auth/parent'
import { createClient } from '@/lib/supabase/server'
import PinEntry from './pin-entry'
import Link from 'next/link'

export async function generateMetadata() {
  return { title: 'Enter PIN — Three Jars' }
}

export default async function KidPinPage({
  params,
}: {
  params: Promise<{ kidId: string }>
}) {
  const { kidId } = await params
  const user = await getParentSession()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const { data: kid } = await supabase
    .from('kids')
    .select('id, name, avatar_emoji')
    .eq('id', kidId)
    .eq('parent_id', user.id)
    .single()

  if (!kid) redirect('/kid-login')

  return (
    <main className="min-h-screen bg-gradient-to-b from-savings/5 to-savings-accent/10 flex flex-col items-center justify-center px-4">
      <Link
        href="/kid-login"
        className="absolute top-6 left-6 text-slate-400 hover:text-slate-600 text-sm font-medium"
      >
        ← Back
      </Link>

      <div className="text-center mb-8">
        <span className="text-7xl block mb-3">{kid.avatar_emoji}</span>
        <h1 className="text-2xl font-extrabold font-display text-navy">
          Hi, {kid.name}!
        </h1>
        <p className="text-slate-400 font-display mt-1">
          Enter your 4-digit PIN
        </p>
      </div>

      <PinEntry kidId={kid.id} />
    </main>
  )
}
