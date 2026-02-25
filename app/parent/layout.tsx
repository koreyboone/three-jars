// app/parent/layout.tsx
import { requireParentSession } from '@/lib/auth/parent'
import Link from 'next/link'
import { logoutParent } from '@/lib/actions/auth'

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireParentSession()

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-navy text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/parent/dashboard" className="font-bold text-lg font-display">
            🏦 Three Jars
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/kid-login"
              className="text-sm text-slate-300 hover:text-white transition-colors"
            >
              Kid Login
            </Link>
            <form action={logoutParent}>
              <button
                type="submit"
                className="text-sm text-slate-300 hover:text-white transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </nav>
      <div className="max-w-4xl mx-auto px-4 py-6">{children}</div>
    </div>
  )
}
