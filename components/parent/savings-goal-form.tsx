// components/parent/savings-goal-form.tsx
'use client'

import { useState, useTransition } from 'react'
import { setSavingsGoal, deleteSavingsGoal } from '@/lib/actions/goals'
import { centsToDisplay } from '@/lib/money'
import type { SavingsGoal } from '@/types/db'

interface SavingsGoalFormProps {
  kidId: string
  existingGoal: SavingsGoal | null
}

export default function SavingsGoalForm({
  kidId,
  existingGoal,
}: SavingsGoalFormProps) {
  const [label, setLabel] = useState(existingGoal?.label ?? '')
  const [targetAmount, setTargetAmount] = useState(
    existingGoal ? (existingGoal.target_amount_cents / 100).toFixed(2) : ''
  )
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    setError('')
    setSuccess(false)
    startTransition(async () => {
      const result = await setSavingsGoal(kidId, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 2000)
      }
    })
  }

  async function handleDelete() {
    setError('')
    startTransition(async () => {
      const result = await deleteSavingsGoal(kidId)
      if (result?.error) {
        setError(result.error)
      } else {
        setLabel('')
        setTargetAmount('')
        setSuccess(true)
        setTimeout(() => setSuccess(false), 2000)
      }
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-bold text-navy mb-4">🎯 Savings Goal</h3>

      {existingGoal && (
        <div className="mb-4 p-3 bg-savings/10 rounded-lg text-sm">
          <p className="font-medium text-savings">
            Current: {existingGoal.label} —{' '}
            {centsToDisplay(existingGoal.target_amount_cents)}
          </p>
        </div>
      )}

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="goal_label"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Goal Name
          </label>
          <input
            id="goal_label"
            name="label"
            type="text"
            placeholder="e.g. New Lego Set"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-savings focus:border-savings outline-none"
            required
          />
        </div>

        <div>
          <label
            htmlFor="target_amount"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Target Amount ($)
          </label>
          <input
            id="target_amount"
            name="target_amount"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-savings focus:border-savings outline-none"
            required
          />
        </div>

        {error && (
          <p className="text-red-600 text-sm font-medium" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="text-savings font-medium text-sm">✓ Goal saved!</p>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending || !label.trim() || !targetAmount}
            className="flex-1 py-2 px-4 rounded-lg bg-savings text-white font-bold hover:bg-savings/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Saving...' : existingGoal ? 'Update Goal' : 'Set Goal'}
          </button>
          {existingGoal && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="py-2 px-4 rounded-lg bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              Remove
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
