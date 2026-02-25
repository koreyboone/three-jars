// lib/actions/goals.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireParentSession } from '@/lib/auth/parent'
import { getKidSession } from '@/lib/auth/kid'
import { dollarsToCents } from '@/lib/money'
import { revalidatePath } from 'next/cache'

export async function setSavingsGoal(kidId: string, formData: FormData) {
  await requireParentSession()

  const label = formData.get('label') as string
  const dollarsStr = formData.get('target_amount') as string

  if (!label?.trim()) {
    return { error: 'Goal label is required' }
  }

  const target_amount_cents = dollarsToCents(dollarsStr)
  if (isNaN(target_amount_cents) || target_amount_cents <= 0) {
    return { error: 'Please enter a valid target amount' }
  }

  const supabase = await createClient()

  // Upsert: delete existing goal for this kid, insert new one
  await supabase.from('savings_goals').delete().eq('kid_id', kidId)

  const { error } = await supabase.from('savings_goals').insert({
    kid_id: kidId,
    label: label.trim(),
    target_amount_cents,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/parent/kids/${kidId}`)
  revalidatePath(`/kid/${kidId}/dashboard`)
  return { success: true }
}

export async function updateCelebratedPercent(
  goalId: string,
  threshold: number
) {
  // This can be called by kid sessions
  const kidSession = await getKidSession()
  if (!kidSession) {
    return { error: 'Unauthorized' }
  }

  // Use admin client since kid has no Supabase Auth session
  const admin = createAdminClient()

  // Verify the goal belongs to this kid
  const { data: goal } = await admin
    .from('savings_goals')
    .select('id, kid_id')
    .eq('id', goalId)
    .eq('kid_id', kidSession.kid_id)
    .single()

  if (!goal) {
    return { error: 'Goal not found' }
  }

  const { error } = await admin
    .from('savings_goals')
    .update({ last_celebrated_percent: threshold })
    .eq('id', goalId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function deleteSavingsGoal(kidId: string) {
  await requireParentSession()

  const supabase = await createClient()
  const { error } = await supabase
    .from('savings_goals')
    .delete()
    .eq('kid_id', kidId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/parent/kids/${kidId}`)
  revalidatePath(`/kid/${kidId}/dashboard`)
  return { success: true }
}
