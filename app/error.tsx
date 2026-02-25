// app/error.tsx
'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="text-center">
        <p className="text-5xl mb-4">😕</p>
        <h1 className="text-2xl font-bold text-navy mb-2">
          Something went wrong
        </h1>
        <p className="text-slate-500 mb-6">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-savings text-white font-bold rounded-lg hover:bg-savings/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    </main>
  )
}
