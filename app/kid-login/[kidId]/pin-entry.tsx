// app/kid-login/[kidId]/pin-entry.tsx
'use client'

import { useState, useTransition } from 'react'
import { loginKid } from '@/lib/actions/auth'

interface PinEntryProps {
  kidId: string
}

export default function PinEntry({ kidId }: PinEntryProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleDigit(digit: string) {
    if (pin.length >= 4) return
    const newPin = pin + digit
    setPin(newPin)
    setError('')

    if (newPin.length === 4) {
      startTransition(async () => {
        const result = await loginKid(kidId, newPin)
        if (result?.error) {
          setError(result.error)
          setPin('')
        }
      })
    }
  }

  function handleBackspace() {
    setPin((p) => p.slice(0, -1))
    setError('')
  }

  return (
    <div className="w-full max-w-xs">
      {/* PIN dots */}
      <div className="flex justify-center gap-4 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-5 h-5 rounded-full transition-all ${
              i < pin.length
                ? 'bg-savings scale-110'
                : 'bg-slate-200'
            }`}
            aria-hidden="true"
          />
        ))}
      </div>

      {error && (
        <p className="text-center text-red-500 font-medium mb-4 text-lg" role="alert">
          {error}
        </p>
      )}

      {isPending && (
        <p className="text-center text-savings font-medium mb-4 text-lg">
          Checking...
        </p>
      )}

      {/* Number pad */}
      <div className="grid grid-cols-3 gap-3">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'].map(
          (key) => {
            if (key === '') return <div key="empty" />
            if (key === 'back') {
              return (
                <button
                  key="back"
                  type="button"
                  onClick={handleBackspace}
                  disabled={isPending || pin.length === 0}
                  aria-label="Backspace"
                  className="aspect-square rounded-2xl bg-slate-100 text-slate-500 text-2xl font-bold flex items-center justify-center hover:bg-slate-200 active:bg-slate-300 transition-colors disabled:opacity-30 min-w-[60px] min-h-[60px]"
                >
                  ←
                </button>
              )
            }
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleDigit(key)}
                disabled={isPending || pin.length >= 4}
                aria-label={`Digit ${key}`}
                className="aspect-square rounded-2xl bg-white shadow-md text-3xl font-bold text-navy flex items-center justify-center hover:bg-savings/5 active:bg-savings/10 transition-colors disabled:opacity-30 min-w-[60px] min-h-[60px]"
              >
                {key}
              </button>
            )
          }
        )}
      </div>
    </div>
  )
}
