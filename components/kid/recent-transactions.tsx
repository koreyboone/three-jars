// components/kid/recent-transactions.tsx
import { centsToDisplay } from '@/lib/money'
import type { Transaction } from '@/types/db'

const TX_META: Record<string, { emoji: string; color: string; sign: string }> = {
  earn: { emoji: '💵', color: 'text-savings', sign: '+' },
  spend: { emoji: '🛍️', color: 'text-spend', sign: '-' },
  give: { emoji: '❤️', color: 'text-giving', sign: '-' },
}

interface RecentTransactionsProps {
  transactions: Transaction[]
}

export default function RecentTransactions({
  transactions,
}: RecentTransactionsProps) {
  if (transactions.length === 0) {
    return (
      <p className="text-center text-slate-400 py-6 text-lg">
        No transactions yet — ask your parent to add your first earning! 🚀
      </p>
    )
  }

  return (
    <ul className="space-y-3">
      {transactions.map((tx) => {
        const meta = TX_META[tx.type]
        const isVoided = tx.voided
        const isReversal = !!tx.voided_transaction_id

        return (
          <li
            key={tx.id}
            className={`flex items-center justify-between p-4 bg-white rounded-xl shadow-sm ${
              isVoided ? 'opacity-50 line-through' : ''
            } ${isReversal ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl" aria-hidden="true">
                {meta.emoji}
              </span>
              <div>
                <p className="font-semibold text-kid-label text-slate-800">
                  {tx.description}
                </p>
                <p className="text-sm text-slate-400">
                  {new Date(tx.created_at).toLocaleDateString()}
                  {isVoided && ' · Voided'}
                  {isReversal && ' · Reversal'}
                </p>
              </div>
            </div>
            <span
              className={`text-xl font-bold ${meta.color}`}
            >
              {meta.sign}
              {centsToDisplay(tx.amount_cents)}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
