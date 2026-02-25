// lib/auth/parent.ts
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function getParentSession() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

export async function requireParentSession() {
  const user = await getParentSession()
  if (!user) {
    redirect('/login')
  }
  return user
}
