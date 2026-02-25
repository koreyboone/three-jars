// components/parent/balance-adjustment-form.tsx
'use client'

import { useState, useTransition } from 'react'
import { setStartingBalances } from '@/lib/actions/transactions'
import { dollarsToCents, centsToDisplay } from '@/lib/money'

interface Props {
  kidId: string
  kidName: string
  currentSavings: number
  currentSpend: number
  currentGiving: number
}

export default function BalanceAdjustmentForm({
  kidId,
  kidName,
  currentSavings,
  currentSpend,
  currentGiving,
}: Props) {
  const [savings, setSavings] = useState('')
  const [spend, setSpend] = useState('')
  const [giving, setGiving] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function parseAmount(val: string): number {
    if (!val) return 0
    const cents = dollarsToCents(val)
    return isNaN(cents) ? -1 : cents
  }

  const savingsCents = parseAmount(savings)
  const spendCents = parseAmount(spend)
  const givingCents = parseAmount(giving)
  const isValid = savingsCents >= 0 && spendCents >= 0 && givingCents >= 0
  const hasAny = savingsCents > 0 || spendCents > 0 || givingCents > 0

  function handleReview(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!isValid) {
      setError('Please enter valid dollar amounts (0.00 or greater).')
      return
    }
    if (!hasAny) {
      setError('Enter at least one amount greater than $0.00.')
      return
    }
    setShowConfirm(true)
  }

  function handleConfirm() {
    startTransition(async () => {
      const result = await setStartingBalances(
        kidId,
        savingsCents,
        spendCents,
        givingCents,
        'Balance Adjustment'
      )
      setShowConfirm(false)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setSavings('')
        setSpend('')
        setGiving('')
      }
    })
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="font-bold text-navy text-base">💰 Balance Adjustment</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Add funds to {kidName}&apos;s jars. Applied on top of existing balances.
        </p>
      </div>

      {/* Current balances */}
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
          Current Balances
        </p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-savings font-semibold">💰 Savings</p>
            <p className="text-sm font-bold text-savings">{centsToDisplay(currentSavings)}</p>
          </div>
          <div>
            <p className="text-xs text-spend font-semibold">🛍️ Spend</p>
            <p className="text-sm font-bold text-spend">{centsToDisplay(currentSpend)}</p>
          </div>
          <div>
            <p className="text-xs text-giving font-semibold">❤️ Giving</p>
            <p className="text-sm font-bold text-giving">{centsToDisplay(currentGiving)}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleReview} className="px-5 py-4 space-y-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          Amount to Add
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: '💰 Savings', color: 'savings', value: savings, setter: setSavings },
            { label: '🛍️ Spend', color: 'spend', value: spend, setter: setSpend },
            { label: '❤️ Giving', color: 'giving', value: giving, setter: setGiving },
          ].map(({ label, color, value, setter }) => (
            <div key={label}>
              <label className={`block text-xs font-semibold text-${color} mb-1`}>
                {label}
              </label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  className={`w-full pl-6 pr-2 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-${color} focus:border-${color} outline-none`}
                />
              </div>
            </div>
          ))}
        </div>

        {error && (
          <p className="text-red-600 text-sm font-medium" role="alert">{error}</p>
        )}

        {success && (
          <p className="text-savings text-sm font-semibold" role="status">
            ✓ Balances updated successfully!
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2.5 rounded-lg bg-navy text-white font-semibold text-sm hover:bg-navy/90 transition-colors disabled:opacity-50"
        >
          Review Adjustment →
        </button>
      </form>

      {/* Confirmation modal */}
      {showConfirm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h3 id="confirm-title" className="text-lg font-bold text-navy mb-1">
              ⚠️ Confirm Balance Adjustment
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              The following amounts will be added to{' '}
              <span className="font-semibold text-navy">{kidName}</span>&apos;s jars:
            </p>

            <div className="space-y-2 mb-4">
              {savingsCents > 0 && (
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="text-sm text-slate-600">💰 Savings</span>
                  <span className="font-bold text-savings">+{centsToDisplay(savingsCents)}</span>
                </div>
              )}
              {spendCents > 0 && (
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="text-sm text-slate-600">🛍️ Spend</span>
                  <span className="font-bold text-spend">+{centsToDisplay(spendCents)}</span>
                </div>
              )}
              {givingCents > 0 && (
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="text-sm text-slate-600">❤️ Giving</span>
                  <span className="font-bold text-giving">+{centsToDisplay(givingCents)}</span>
                </div>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 mb-5">
              <p className="text-xs text-amber-800 font-medium">
                ⚠️ This will appear in {kidName}&apos;s transaction history and may
                affect savings goal progress tracking.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-lg bg-savings text-white font-semibold text-sm hover:bg-savings/90 transition-colors disabled:opacity-50"
              >
                {isPending ? 'Applying...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
