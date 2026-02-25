// components/parent/void-button.tsx
'use client'

import { useState, useTransition } from 'react'
import { voidTransaction } from '@/lib/actions/transactions'

interface VoidButtonProps {
  transactionId: string
  kidId: string
}

export default function VoidButton({ transactionId, kidId }: VoidButtonProps) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            setError('')
            startTransition(async () => {
              const result = await voidTransaction(transactionId, kidId)
              if (result?.error) {
                setError(result.error)
                setConfirming(false)
              } else {
                setConfirming(false)
              }
            })
          }}
          className="text-xs px-2 py-1 bg-red-600 text-white rounded font-medium hover:bg-red-700 disabled:opacity-50"
        >
          {isPending ? '...' : 'Confirm'}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-xs px-2 py-1 bg-slate-200 text-slate-600 rounded font-medium hover:bg-slate-300"
        >
          Cancel
        </button>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-xs px-2 py-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
      title="Void this transaction"
    >
      Void
    </button>
  )
}
