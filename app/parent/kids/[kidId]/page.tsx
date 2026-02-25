// app/parent/kids/[kidId]/page.tsx
import { requireParentSession } from '@/lib/auth/parent'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { centsToDisplay } from '@/lib/money'
import type { Kid, Jar, SavingsGoal, Transaction } from '@/types/db'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ kidId: string }>
}) {
  return { title: 'Kid Overview — Three Jars' }
}

export default async function KidOverviewPage({
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

  const [{ data: jars }, { data: goal }, { data: recentTx }] = await Promise.all([
    supabase.from('jars').select('*').eq('kid_id', kidId),
    supabase
      .from('savings_goals')
      .select('*')
      .eq('kid_id', kidId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('transactions')
      .select('*')
      .eq('kid_id', kidId)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const jarList = (jars ?? []) as Jar[]
  const savings = jarList.find((j) => j.type === 'savings')?.balance_cents ?? 0
  const spend = jarList.find((j) => j.type === 'spend')?.balance_cents ?? 0
  const giving = jarList.find((j) => j.type === 'giving')?.balance_cents ?? 0
  const total = savings + spend + giving

  return (
    <div>
      <Link
        href="/parent/dashboard"
        className="text-sm text-slate-400 hover:text-slate-600 mb-4 inline-block"
      >
        ← All Kids
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <span className="text-5xl">{(kid as Kid).avatar_emoji}</span>
        <div>
          <h1 className="text-2xl font-bold text-navy">{(kid as Kid).name}</h1>
          <p className="text-slate-500">Total: {centsToDisplay(total)}</p>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <Link
          href={`/parent/kids/${kidId}/add-transaction`}
          className="px-4 py-2 bg-savings text-white rounded-lg font-semibold text-sm whitespace-nowrap hover:bg-savings/90"
        >
          💵 Add Transaction
        </Link>
        <Link
          href={`/parent/kids/${kidId}/transactions`}
          className="px-4 py-2 bg-white text-navy rounded-lg font-semibold text-sm border border-slate-200 whitespace-nowrap hover:bg-slate-50"
        >
          📋 History
        </Link>
        <Link
          href={`/parent/kids/${kidId}/settings`}
          className="px-4 py-2 bg-white text-navy rounded-lg font-semibold text-sm border border-slate-200 whitespace-nowrap hover:bg-slate-50"
        >
          ⚙️ Settings
        </Link>
      </div>

      {/* Jar balances */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-savings/10 rounded-xl p-4 text-center">
          <p className="text-2xl mb-1">💰</p>
          <p className="text-xs font-medium text-savings">Savings</p>
          <p className="text-lg font-bold text-savings">{centsToDisplay(savings)}</p>
        </div>
        <div className="bg-spend/10 rounded-xl p-4 text-center">
          <p className="text-2xl mb-1">🛍️</p>
          <p className="text-xs font-medium text-spend">Spend</p>
          <p className="text-lg font-bold text-spend">{centsToDisplay(spend)}</p>
        </div>
        <div className="bg-giving/10 rounded-xl p-4 text-center">
          <p className="text-2xl mb-1">❤️</p>
          <p className="text-xs font-medium text-giving">Giving</p>
          <p className="text-lg font-bold text-giving">{centsToDisplay(giving)}</p>
        </div>
      </div>

      {/* Savings goal */}
      {goal && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-slate-100">
          <p className="text-sm font-medium text-slate-500 mb-1">🎯 Savings Goal</p>
          <p className="font-bold text-navy">
            {(goal as SavingsGoal).label} —{' '}
            {centsToDisplay(savings)} / {centsToDisplay((goal as SavingsGoal).target_amount_cents)}
          </p>
          <div className="mt-2 w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-savings rounded-full"
              style={{
                width: `${Math.min(
                  Math.round(
                    (savings / (goal as SavingsGoal).target_amount_cents) * 100
                  ),
                  100
                )}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Recent transactions */}
      {recentTx && recentTx.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-100">
          <h3 className="font-bold text-navy mb-3">Recent Activity</h3>
          <div className="space-y-2">
            {(recentTx as Transaction[]).map((tx) => (
              <div
                key={tx.id}
                className={`flex justify-between items-center py-2 border-b border-slate-50 last:border-0 ${
                  tx.voided ? 'opacity-40 line-through' : ''
                }`}
              >
                <span className="text-sm text-slate-600 truncate max-w-[60%]">
                  {tx.type === 'earn' ? '💵' : tx.type === 'spend' ? '🛍️' : '❤️'}{' '}
                  {tx.description}
                </span>
                <span
                  className={`text-sm font-bold ${
                    tx.type === 'earn' ? 'text-savings' : 'text-spend'
                  }`}
                >
                  {tx.type === 'earn' ? '+' : '-'}
                  {centsToDisplay(tx.amount_cents)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
