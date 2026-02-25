// lib/actions/auth.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createKidSession, clearKidSession } from '@/lib/auth/kid'
import { redirect } from 'next/navigation'
import { compare } from 'bcryptjs'

export async function loginParent(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  redirect('/parent/dashboard')
}

export async function signupParent(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({ email, password })

  if (error) {
    return { error: error.message }
  }

  redirect('/parent/dashboard')
}

export async function logoutParent() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function getKidsForLogin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data: kids } = await supabase
    .from('kids')
    .select('id, name, avatar_emoji')
    .eq('parent_id', user.id)
    .order('created_at', { ascending: true })

  return kids ?? []
}

export async function loginKid(kidId: string, pin: string) {
  // Use admin client to bypass RLS (kid has no Supabase Auth session)
  const admin = createAdminClient()

  const { data: kid, error } = await admin
    .from('kids')
    .select('id, parent_id, name, pin_hash')
    .eq('id', kidId)
    .single()

  if (error || !kid) {
    return { error: 'Kid not found' }
  }

  const valid = await compare(pin, kid.pin_hash)
  if (!valid) {
    return { error: 'Wrong PIN. Try again!' }
  }

  await createKidSession({
    kid_id: kid.id,
    parent_id: kid.parent_id,
    kid_name: kid.name,
  })

  redirect(`/kid/${kid.id}/dashboard`)
}

export async function logoutKid() {
  await clearKidSession()
  redirect('/kid-login')
}
