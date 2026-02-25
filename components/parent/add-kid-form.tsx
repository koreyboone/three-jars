// components/parent/add-kid-form.tsx
'use client'

import { useState, useTransition } from 'react'
import { createKid } from '@/lib/actions/kids'
import { setStartingBalances } from '@/lib/actions/transactions'
import { dollarsToCents } from '@/lib/money'
import { AVATAR_EMOJIS } from '@/types/db'
import { useRouter } from 'next/navigation'

export default function AddKidForm() {
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('😊')
  const [pin, setPin] = useState('')
  const [showBalances, setShowBalances] = useState(false)
  const [savings, setSavings] = useState('')
  const [spend, setSpend] = useState('')
  const [giving, setGiving] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setError('')
    startTransition(async () => {
      const result = await createKid(formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      if (!result?.kidId) return

      // Set starting balances if any were entered
      if (showBalances && (savings || spend || giving)) {
        const savingsCents = savings ? dollarsToCents(savings) : 0
        const spendCents = spend ? dollarsToCents(spend) : 0
        const givingCents = giving ? dollarsToCents(giving) : 0

        if (
          isNaN(savingsCents) || isNaN(spendCents) || isNaN(givingCents) ||
          savingsCents < 0 || spendCents < 0 || givingCents < 0
        ) {
          setError('Starting balances must be valid positive dollar amounts')
          return
        }

        const balResult = await setStartingBalances(
          result.kidId,
          savingsCents,
          spendCents,
          givingCents
        )
        if (balResult?.error) {
          setError(balResult.error)
          return
        }
      }

      router.push(`/parent/kids/${result.kidId}`)
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Kid&apos;s Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="e.g. Maya"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-slate-300 text-lg focus:ring-2 focus:ring-savings focus:border-savings outline-none"
          required
        />
      </div>

      <div>
        <p className="block text-sm font-medium text-slate-700 mb-2">
          Pick an Avatar
        </p>
        <input type="hidden" name="avatar_emoji" value={avatar} />
        <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
          {AVATAR_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setAvatar(emoji)}
              className={`text-3xl p-2 rounded-lg transition-all relative ${
                avatar === emoji
                  ? 'bg-savings/20 ring-2 ring-savings ring-offset-1'
                  : 'hover:bg-slate-100'
              }`}
              aria-label={`Select ${emoji} avatar`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor="pin"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          4-Digit PIN
        </label>
        <input
          id="pin"
          name="pin"
          type="password"
          inputMode="numeric"
          maxLength={4}
          pattern="\d{4}"
          placeholder="••••"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          className="w-full px-4 py-3 rounded-lg border border-slate-300 text-lg text-center tracking-[0.5em] focus:ring-2 focus:ring-savings focus:border-savings outline-none"
          required
        />
        <p className="text-xs text-slate-400 mt-1">
          Your kid will use this PIN to log into their dashboard.
        </p>
      </div>

      {/* Starting balances (optional) */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setShowBalances(!showBalances)}
          className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <span>💰 Set starting balances <span className="text-slate-400 font-normal">(optional)</span></span>
          <span className="text-slate-400">{showBalances ? '▲' : '▼'}</span>
        </button>
        {showBalances && (
          <div className="px-4 py-4 space-y-3 bg-white">
            <p className="text-xs text-slate-500 mb-3">
              Enter existing piggy bank or allowance amounts to start with.
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-semibold text-savings mb-1">
                  💰 Savings
                </label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={savings}
                    onChange={(e) => setSavings(e.target.value)}
                    className="w-full pl-6 pr-2 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-savings focus:border-savings outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-spend mb-1">
                  🛍️ Spend
                </label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={spend}
                    onChange={(e) => setSpend(e.target.value)}
                    className="w-full pl-6 pr-2 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-spend focus:border-spend outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-giving mb-1">
                  ❤️ Giving
                </label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={giving}
                    onChange={(e) => setGiving(e.target.value)}
                    className="w-full pl-6 pr-2 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-giving focus:border-giving outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-600 text-sm font-medium" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || !name.trim() || pin.length !== 4}
        className="w-full py-3 px-6 rounded-lg bg-savings text-white font-bold text-lg hover:bg-savings/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Creating...' : 'Create Kid Account'}
      </button>
    </form>
  )
}
