// app/parent/kids/[kidId]/add-transaction/page.tsx
import { requireParentSession } from '@/lib/auth/parent'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import TransactionForm from '@/components/parent/transaction-form'
import type { Kid, Jar, JarSettings } from '@/types/db'

export async function generateMetadata() {
  return { title: 'Add Transaction — Three Jars' }
}

export default async function AddTransactionPage({
  params,
}: {
  params: Promise<{ kidId: string }>
}) {
  const { kidId } = await params
  const user = await requireParentSession()
  const supabase = await createClient()

  const { data: kid } = await supabase
    .from('kids')
    .select('*')
    .eq('id', kidId)
    .eq('parent_id', user.id)
    .single()

  if (!kid) redirect('/parent/dashboard')

  const [{ data: jars }, { data: settings }] = await Promise.all([
    supabase.from('jars').select('*').eq('kid_id', kidId),
    supabase.from('jar_settings').select('*').eq('kid_id', kidId).single(),
  ])

  if (!settings) redirect('/parent/dashboard')

  return (
    <div>
      <Link
        href={`/parent/kids/${kidId}`}
        className="text-sm text-slate-400 hover:text-slate-600 mb-4 inline-block"
      >
        ← Back to {(kid as Kid).name}
      </Link>

      <TransactionForm
        kidId={kidId}
        kidName={(kid as Kid).name}
        settings={settings as JarSettings}
        jars={(jars ?? []) as Jar[]}
      />
    </div>
  )
}
