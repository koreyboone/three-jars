// lib/actions/kids.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { requireParentSession } from '@/lib/auth/parent'
import { hash } from 'bcryptjs'
import { revalidatePath } from 'next/cache'

export async function createKid(formData: FormData) {
  const user = await requireParentSession()

  const name = formData.get('name') as string
  const avatar_emoji = formData.get('avatar_emoji') as string
  const pin = formData.get('pin') as string

  if (!name || name.trim().length === 0) {
    return { error: 'Name is required' }
  }
  if (!avatar_emoji) {
    return { error: 'Please pick an avatar' }
  }
  if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    return { error: 'PIN must be exactly 4 digits' }
  }

  const pin_hash = await hash(pin, 10)

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('create_kid_with_jars', {
    p_parent_id: user.id,
    p_name: name.trim(),
    p_avatar_emoji: avatar_emoji,
    p_pin_hash: pin_hash,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/parent/dashboard')
  return { kidId: data as string }
}

export async function resetKidPin(kidId: string, newPin: string) {
  const user = await requireParentSession()

  if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
    return { error: 'PIN must be exactly 4 digits' }
  }

  const pin_hash = await hash(newPin, 10)

  const supabase = await createClient()

  // RLS ensures parent can only update their own kids
  const { error } = await supabase
    .from('kids')
    .update({ pin_hash })
    .eq('id', kidId)
    .eq('parent_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/parent/kids/${kidId}/settings`)
  return { success: true }
}

export async function getKidWithJars(kidId: string) {
  const user = await requireParentSession()
  const supabase = await createClient()

  const [kidRes, jarsRes] = await Promise.all([
    supabase
      .from('kids')
      .select('*')
      .eq('id', kidId)
      .eq('parent_id', user.id)
      .single(),
    supabase
      .from('jars')
      .select('*')
      .eq('kid_id', kidId),
  ])

  if (kidRes.error || !kidRes.data) return null
  return {
    kid: kidRes.data,
    jars: jarsRes.data ?? [],
  }
}
