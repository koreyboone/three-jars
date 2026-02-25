// components/parent/transaction-history.tsx
import { centsToDisplay } from '@/lib/money'
import type { Transaction } from '@/types/db'
import VoidButton from './void-button'

const TX_META: Record<string, { emoji: string; color: string; label: string }> = {
  earn: { emoji: '💵', color: 'text-savings', label: 'Earned' },
  spend: { emoji: '🛍️', color: 'text-spend', label: 'Spent' },
  give: { emoji: '❤️', color: 'text-giving', label: 'Given' },
}

interface TransactionHistoryProps {
  transactions: Transaction[]
  kidId: string
}

export default function TransactionHistory({
  transactions,
  kidId,
}: TransactionHistoryProps) {
  if (transactions.length === 0) {
    return (
      <p className="text-center text-slate-400 py-8">No transactions yet</p>
    )
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => {
        const meta = TX_META[tx.type]
        const isVoided = tx.voided
        const isReversal = !!tx.voided_transaction_id

        return (
          <div
            key={tx.id}
            className={`flex items-center justify-between p-4 bg-white rounded-lg border border-slate-100 ${
              isVoided ? 'opacity-40' : ''
            }`}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-xl flex-shrink-0">{meta.emoji}</span>
              <div className="min-w-0">
                <p
                  className={`font-medium text-slate-800 truncate ${
                    isVoided ? 'line-through' : ''
                  }`}
                >
                  {tx.description}
                </p>
                <p className="text-xs text-slate-400">
                  {new Date(tx.created_at).toLocaleString()}
                  {isVoided && (
                    <span className="ml-1 text-red-400 font-medium">
                      · Voided
                    </span>
                  )}
                  {isReversal && (
                    <span className="ml-1 text-amber-500 font-medium">
                      · Reversal
                    </span>
                  )}
                </p>
                {tx.type === 'earn' && tx.split_snapshot && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    Split: 💰{centsToDisplay(tx.savings_amount_cents ?? 0)} ·
                    🛍️{centsToDisplay(tx.spend_amount_cents)} ·
                    ❤️{centsToDisplay(tx.giving_amount_cents)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <span className={`font-bold ${meta.color}`}>
                {tx.type === 'earn' ? '+' : '-'}
                {centsToDisplay(tx.amount_cents)}
              </span>
              {!isVoided && !isReversal && (
                <VoidButton transactionId={tx.id} kidId={kidId} />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
