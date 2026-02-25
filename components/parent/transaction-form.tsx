// components/parent/transaction-form.tsx
'use client'

import { useState, useTransition } from 'react'
import { addEarnTransaction, addWithdrawTransaction } from '@/lib/actions/transactions'
import { computeEarnSplit, dollarsToCents, centsToDisplay } from '@/lib/money'
import type { JarSettings, Jar } from '@/types/db'

type TxMode = 'earn' | 'spend' | 'give'

interface TransactionFormProps {
  kidId: string
  kidName: string
  settings: JarSettings
  jars: Jar[]
}

export default function TransactionForm({
  kidId,
  kidName,
  settings,
  jars,
}: TransactionFormProps) {
  const [mode, setMode] = useState<TxMode>('earn')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [jarTarget, setJarTarget] = useState<'spend' | 'giving'>('spend')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  const amountCents = dollarsToCents(amount)
  const isValidAmount = !isNaN(amountCents) && amountCents > 0

  const spendBalance = jars.find((j) => j.type === 'spend')?.balance_cents ?? 0
  const givingBalance = jars.find((j) => j.type === 'giving')?.balance_cents ?? 0
  const targetBalance = jarTarget === 'spend' ? spendBalance : givingBalance

  const insufficientBalance =
    mode !== 'earn' && isValidAmount && amountCents > targetBalance

  // Live split preview for earn mode
  const split =
    mode === 'earn' && isValidAmount
      ? computeEarnSplit(
          amountCents,
          settings.savings_percent,
          settings.spend_percent,
          settings.giving_percent
        )
      : null

  async function handleSubmit(formData: FormData) {
    setError('')
    setSuccess(false)

    startTransition(async () => {
      let result
      if (mode === 'earn') {
        result = await addEarnTransaction(kidId, formData)
      } else {
        formData.set('type', mode)
        formData.set('jar_target', jarTarget)
        result = await addWithdrawTransaction(kidId, formData)
      }

      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setAmount('')
        setDescription('')
        setTimeout(() => setSuccess(false), 2000)
      }
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-bold text-navy mb-4">
        Add Transaction for {kidName}
      </h2>

      {/* Mode Toggle */}
      <div className="flex bg-slate-100 rounded-full p-1 mb-6 relative">
        {(['earn', 'spend', 'give'] as TxMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m)
              setError('')
            }}
            className={`flex-1 py-2 px-4 rounded-full text-sm font-semibold transition-all ${
              mode === m
                ? m === 'earn'
                  ? 'bg-savings text-white shadow'
                  : m === 'spend'
                  ? 'bg-spend text-white shadow'
                  : 'bg-giving text-white shadow'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {m === 'earn' ? '💵 Earn' : m === 'spend' ? '🛍️ Spend' : '❤️ Give'}
          </button>
        ))}
      </div>

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="amount"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Amount ($)
          </label>
          <input
            id="amount"
            name="amount"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 text-lg focus:ring-2 focus:ring-savings focus:border-savings outline-none"
            required
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Description
          </label>
          <input
            id="description"
            name="description"
            type="text"
            placeholder={
              mode === 'earn'
                ? 'e.g. Mowed the lawn'
                : mode === 'spend'
                ? 'e.g. Bought a comic book'
                : 'e.g. Donated to animal shelter'
            }
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-savings focus:border-savings outline-none"
            required
          />
        </div>

        {/* Jar target for spend/give */}
        {mode !== 'earn' && (
          <div>
            <p className="block text-sm font-medium text-slate-700 mb-2">
              Deduct from
            </p>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  name="jar_target_select"
                  value="spend"
                  checked={jarTarget === 'spend'}
                  onChange={() => setJarTarget('spend')}
                  className="w-5 h-5 text-spend"
                />
                <span className="font-medium">
                  🛍️ Spend ({centsToDisplay(spendBalance)})
                </span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  name="jar_target_select"
                  value="giving"
                  checked={jarTarget === 'giving'}
                  onChange={() => setJarTarget('giving')}
                  className="w-5 h-5 text-giving"
                />
                <span className="font-medium">
                  ❤️ Giving ({centsToDisplay(givingBalance)})
                </span>
              </label>
              <div
                className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 opacity-50 cursor-not-allowed"
                title="Savings is for saving — try Spend instead 😄"
              >
                <input
                  type="radio"
                  disabled
                  className="w-5 h-5"
                />
                <span className="font-medium text-slate-400">
                  💰 Savings — locked for saving 😄
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Live Preview */}
        {isValidAmount && (
          <div
            className={`p-4 rounded-lg text-sm font-medium ${
              mode === 'earn'
                ? 'bg-savings/10 text-savings'
                : insufficientBalance
                ? 'bg-red-50 text-red-600'
                : 'bg-amber-50 text-amber-700'
            }`}
          >
            {mode === 'earn' && split ? (
              <p>
                {centsToDisplay(amountCents)} will be added as: 💰 Savings{' '}
                {centsToDisplay(split.savings_cents)} · 🛍️ Spend{' '}
                {centsToDisplay(split.spend_cents)} · ❤️ Giving{' '}
                {centsToDisplay(split.giving_cents)}
              </p>
            ) : insufficientBalance ? (
              <p>
                Not enough money! {jarTarget === 'spend' ? '🛍️ Spend' : '❤️ Giving'}{' '}
                jar only has {centsToDisplay(targetBalance)}.
              </p>
            ) : (
              <p>
                {centsToDisplay(amountCents)} will be deducted from{' '}
                {jarTarget === 'spend' ? '🛍️ Spend' : '❤️ Giving'}
              </p>
            )}
          </div>
        )}

        {error && (
          <p className="text-red-600 text-sm font-medium" role="alert">
            {error}
          </p>
        )}

        {success && (
          <div className="flex items-center gap-2 text-savings font-medium">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
            Transaction added!
          </div>
        )}

        <button
          type="submit"
          disabled={
            isPending || !isValidAmount || !description.trim() || insufficientBalance
          }
          className={`w-full py-3 px-6 rounded-lg text-white font-bold text-lg transition-colors ${
            mode === 'earn'
              ? 'bg-savings hover:bg-savings/90'
              : mode === 'spend'
              ? 'bg-spend hover:bg-spend/90'
              : 'bg-giving hover:bg-giving/90'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isPending
            ? 'Saving...'
            : mode === 'earn'
            ? '💵 Add Earning'
            : mode === 'spend'
            ? '🛍️ Record Spending'
            : '❤️ Record Giving'}
        </button>
      </form>
    </div>
  )
}
