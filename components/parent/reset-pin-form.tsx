// components/parent/reset-pin-form.tsx
'use client'

import { useState, useTransition } from 'react'
import { resetKidPin } from '@/lib/actions/kids'

interface ResetPinFormProps {
  kidId: string
}

export default function ResetPinForm({ kidId }: ResetPinFormProps) {
  const [newPin, setNewPin] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    startTransition(async () => {
      const result = await resetKidPin(kidId, newPin)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setNewPin('')
        setTimeout(() => setSuccess(false), 2000)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-bold text-navy mb-4">🔐 Reset PIN</h3>
      <div>
        <label
          htmlFor="new_pin"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          New 4-Digit PIN
        </label>
        <input
          id="new_pin"
          type="password"
          inputMode="numeric"
          maxLength={4}
          pattern="\d{4}"
          placeholder="••••"
          value={newPin}
          onChange={(e) =>
            setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))
          }
          className="w-full px-4 py-2 rounded-lg border border-slate-300 text-center tracking-[0.5em] focus:ring-2 focus:ring-savings focus:border-savings outline-none"
          required
        />
      </div>
      {error && (
        <p className="mt-2 text-red-600 text-sm font-medium" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="mt-2 text-savings font-medium text-sm">
          ✓ PIN updated!
        </p>
      )}
      <button
        type="submit"
        disabled={isPending || newPin.length !== 4}
        className="mt-4 w-full py-2 px-4 rounded-lg bg-navy text-white font-bold hover:bg-navy/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Updating...' : 'Reset PIN'}
      </button>
    </form>
  )
}
