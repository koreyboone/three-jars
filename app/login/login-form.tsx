// app/login/login-form.tsx
'use client'

import { useState, useTransition } from 'react'
import { loginParent, signupParent } from '@/lib/actions/auth'

export default function LoginForm() {
  const [isSignup, setIsSignup] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    setError('')
    startTransition(async () => {
      const result = isSignup
        ? await signupParent(formData)
        : await loginParent(formData)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="flex bg-slate-100 rounded-full p-1 mb-6">
        <button
          type="button"
          onClick={() => { setIsSignup(false); setError('') }}
          className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${
            !isSignup ? 'bg-navy text-white shadow' : 'text-slate-500'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => { setIsSignup(true); setError('') }}
          className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${
            isSignup ? 'bg-navy text-white shadow' : 'text-slate-500'
          }`}
        >
          Sign Up
        </button>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-savings focus:border-savings outline-none"
            placeholder="parent@example.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            minLength={6}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-savings focus:border-savings outline-none"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="text-red-600 text-sm font-medium" role="alert">{error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3 px-6 rounded-lg bg-savings text-white font-bold text-lg hover:bg-savings/90 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Please wait...' : isSignup ? 'Create Account' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}
