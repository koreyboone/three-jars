// lib/actions/jars.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { requireParentSession } from '@/lib/auth/parent'
import { revalidatePath } from 'next/cache'

export async function updateJarSettings(kidId: string, formData: FormData) {
  await requireParentSession()

  const savings = parseInt(formData.get('savings_percent') as string, 10)
  const spend = parseInt(formData.get('spend_percent') as string, 10)
  const giving = parseInt(formData.get('giving_percent') as string, 10)

  if (isNaN(savings) || isNaN(spend) || isNaN(giving)) {
    return { error: 'All percentages must be valid numbers' }
  }

  if (savings < 0 || spend < 0 || giving < 0) {
    return { error: 'Percentages cannot be negative' }
  }

  if (savings + spend + giving !== 100) {
    return { error: 'Percentages must add up to 100' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('jar_settings')
    .update({
      savings_percent: savings,
      spend_percent: spend,
      giving_percent: giving,
    })
    .eq('kid_id', kidId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/parent/kids/${kidId}/settings`)
  revalidatePath(`/parent/kids/${kidId}/add-transaction`)
  return { success: true }
}

export async function getJarSettings(kidId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('jar_settings')
    .select('*')
    .eq('kid_id', kidId)
    .single()

  if (error) return null
  return data
}
