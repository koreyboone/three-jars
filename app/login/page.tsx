// app/login/page.tsx
import { redirect } from 'next/navigation'
import { getParentSession } from '@/lib/auth/parent'
import LoginForm from './login-form'

export async function generateMetadata() {
  return { title: 'Sign In — Three Jars' }
}

export default async function LoginPage() {
  const user = await getParentSession()
  if (user) redirect('/parent/dashboard')

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold font-display text-savings mb-2">
            🏦 Three Jars
          </h1>
          <p className="text-slate-500">
            Family finance tracker for smart kids
          </p>
        </div>
        <LoginForm />
        <div className="mt-6 text-center">
          <a
            href="/kid-login"
            className="text-sm text-savings hover:underline font-medium"
          >
            I&apos;m a kid — log in with my PIN →
          </a>
        </div>
      </div>
    </main>
  )
}
