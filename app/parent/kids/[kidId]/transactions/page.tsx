// app/parent/kids/[kidId]/transactions/page.tsx
import { requireParentSession } from '@/lib/auth/parent'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import TransactionHistory from '@/components/parent/transaction-history'
import type { Kid, Transaction } from '@/types/db'

export async function generateMetadata() {
  return { title: 'Transaction History — Three Jars' }
}

export default async function KidTransactionsPage({
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

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('kid_id', kidId)
    .order('created_at', { ascending: false })

  return (
    <div>
      <Link
        href={`/parent/kids/${kidId}`}
        className="text-sm text-slate-400 hover:text-slate-600 mb-4 inline-block"
      >
        ← Back to {(kid as Kid).name}
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy">
          📋 {(kid as Kid).name}&apos;s Transactions
        </h1>
        <Link
          href={`/parent/kids/${kidId}/add-transaction`}
          className="px-4 py-2 bg-savings text-white rounded-lg font-semibold text-sm hover:bg-savings/90"
        >
          + Add
        </Link>
      </div>

      <TransactionHistory
        transactions={(transactions ?? []) as Transaction[]}
        kidId={kidId}
      />
    </div>
  )
}
