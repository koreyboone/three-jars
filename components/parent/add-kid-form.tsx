// components/parent/add-kid-form.tsx
'use client'

import { useState, useTransition } from 'react'
import { createKid } from '@/lib/actions/kids'
import { AVATAR_EMOJIS } from '@/types/db'
import { useRouter } from 'next/navigation'

export default function AddKidForm() {
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('😊')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setError('')
    startTransition(async () => {
      const result = await createKid(formData)
      if (result?.error) {
        setError(result.error)
      } else if (result?.kidId) {
        router.push(`/parent/kids/${result.kidId}`)
      }
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
        <div className="grid grid-cols-8 gap-2">
          {AVATAR_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setAvatar(emoji)}
              className={`text-3xl p-2 rounded-lg transition-all ${
                avatar === emoji
                  ? 'bg-savings/20 ring-2 ring-savings scale-110'
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
