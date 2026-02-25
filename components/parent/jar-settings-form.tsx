// components/parent/jar-settings-form.tsx
'use client'

import { useState, useTransition } from 'react'
import { updateJarSettings } from '@/lib/actions/jars'
import type { JarSettings } from '@/types/db'

interface JarSettingsFormProps {
  kidId: string
  settings: JarSettings
}

export default function JarSettingsForm({
  kidId,
  settings,
}: JarSettingsFormProps) {
  const [savings, setSavings] = useState(settings.savings_percent)
  const [spend, setSpend] = useState(settings.spend_percent)
  const [giving, setGiving] = useState(settings.giving_percent)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  const total = savings + spend + giving
  const isValid = total === 100

  async function handleSubmit(formData: FormData) {
    setError('')
    setSuccess(false)

    startTransition(async () => {
      const result = await updateJarSettings(kidId, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 2000)
      }
    })
  }

  return (
    <form action={handleSubmit} className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-bold text-navy mb-4">
        Jar Split Percentages
      </h3>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="savings_percent"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            💰 Savings %
          </label>
          <input
            id="savings_percent"
            name="savings_percent"
            type="number"
            min={0}
            max={100}
            value={savings}
            onChange={(e) => setSavings(parseInt(e.target.value) || 0)}
            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-savings focus:border-savings outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="spend_percent"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            🛍️ Spend %
          </label>
          <input
            id="spend_percent"
            name="spend_percent"
            type="number"
            min={0}
            max={100}
            value={spend}
            onChange={(e) => setSpend(parseInt(e.target.value) || 0)}
            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-spend focus:border-spend outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="giving_percent"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            ❤️ Giving %
          </label>
          <input
            id="giving_percent"
            name="giving_percent"
            type="number"
            min={0}
            max={100}
            value={giving}
            onChange={(e) => setGiving(parseInt(e.target.value) || 0)}
            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-giving focus:border-giving outline-none"
          />
        </div>
      </div>

      {/* Running total indicator */}
      <div className="mt-4">
        <div
          className={`text-center py-2 px-4 rounded-lg font-bold text-lg transition-colors ${
            isValid
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-600'
          }`}
        >
          Total: {total}%{' '}
          {isValid ? '✓' : `(need ${100 - total > 0 ? '+' : ''}${100 - total})`}
        </div>
      </div>

      {error && (
        <p className="mt-3 text-red-600 text-sm font-medium" role="alert">
          {error}
        </p>
      )}

      {success && (
        <p className="mt-3 text-savings font-medium text-sm">
          ✓ Settings saved!
        </p>
      )}

      <button
        type="submit"
        disabled={!isValid || isPending}
        className="mt-4 w-full py-3 px-6 rounded-lg bg-navy text-white font-bold transition-colors hover:bg-navy/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Saving...' : 'Save Percentages'}
      </button>
    </form>
  )
}
