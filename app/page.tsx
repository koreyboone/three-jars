// app/page.tsx
import { redirect } from 'next/navigation'
import { getParentSession } from '@/lib/auth/parent'
import { getKidSession } from '@/lib/auth/kid'

export default async function HomePage() {
  const parentUser = await getParentSession()
  if (parentUser) {
    redirect('/parent/dashboard')
  }

  const kidSession = await getKidSession()
  if (kidSession) {
    redirect(`/kid/${kidSession.kid_id}/dashboard`)
  }

  redirect('/login')
}
