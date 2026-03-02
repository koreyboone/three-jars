// lib/actions/transactions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { requireParentSession } from '@/lib/auth/parent'
import { computeEarnSplit, dollarsToCents } from '@/lib/money'
import { revalidatePath } from 'next/cache'
import type { JarSettings } from '@/types/db'

export async function addEarnTransaction(kidId: string, formData: FormData) {
  const user = await requireParentSession()

  const dollarsStr = formData.get('amount') as string
  const description = formData.get('description') as string

  if (!dollarsStr || !description?.trim()) {
    return { error: 'Amount and description are required' }
  }

  const amount_cents = dollarsToCents(dollarsStr)
  if (isNaN(amount_cents) || amount_cents <= 0) {
    return { error: 'Please enter a valid positive amount' }
  }

  const supabase = await createClient()

  // Fetch current jar settings
  const { data: settings, error: settingsErr } = await supabase
    .from('jar_settings')
    .select('*')
    .eq('kid_id', kidId)
    .single()

  if (settingsErr || !settings) {
    return { error: 'Could not load jar settings' }
  }

  const s = settings as JarSettings
  const split = computeEarnSplit(
    amount_cents,
    s.savings_percent,
    s.spend_percent,
    s.giving_percent
  )

  const split_snapshot = {
    savings_percent: s.savings_percent,
    spend_percent: s.spend_percent,
    giving_percent: s.giving_percent,
  }

  const { error } = await supabase.rpc('process_earn_transaction', {
    p_kid_id: kidId,
    p_amount_cents: amount_cents,
    p_description: description.trim(),
    p_savings_cents: split.savings_cents,
    p_spend_cents: split.spend_cents,
    p_giving_cents: split.giving_cents,
    p_split_snapshot: split_snapshot,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/parent/kids/${kidId}`)
  revalidatePath(`/parent/kids/${kidId}/transactions`)
  revalidatePath(`/kid/${kidId}/dashboard`)
  return { success: true }
}

export async function addSingleJarEarnTransaction(kidId: string, formData: FormData) {
  await requireParentSession()

  const dollarsStr = formData.get('amount') as string
  const description = formData.get('description') as string
  const jarTarget = formData.get('jar_target') as 'savings' | 'spend' | 'giving'

  if (!dollarsStr || !description?.trim()) {
    return { error: 'Amount and description are required' }
  }
  if (!jarTarget || !['savings', 'spend', 'giving'].includes(jarTarget)) {
    return { error: 'Please select a jar' }
  }

  const amount_cents = dollarsToCents(dollarsStr)
  if (isNaN(amount_cents) || amount_cents <= 0) {
    return { error: 'Please enter a valid positive amount' }
  }

  const supabase = await createClient()

  const { error } = await supabase.rpc('process_earn_transaction', {
    p_kid_id: kidId,
    p_amount_cents: amount_cents,
    p_description: description.trim(),
    p_savings_cents: jarTarget === 'savings' ? amount_cents : 0,
    p_spend_cents: jarTarget === 'spend' ? amount_cents : 0,
    p_giving_cents: jarTarget === 'giving' ? amount_cents : 0,
    p_split_snapshot: null,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/parent/kids/${kidId}`)
  revalidatePath(`/parent/kids/${kidId}/transactions`)
  revalidatePath(`/kid/${kidId}/dashboard`)
  return { success: true }
}

export async function addWithdrawTransaction(kidId: string, formData: FormData) {
  await requireParentSession()

  const dollarsStr = formData.get('amount') as string
  const description = formData.get('description') as string
  const txType = formData.get('type') as 'spend' | 'give'
  const jarTarget = formData.get('jar_target') as 'spend' | 'giving'

  if (!dollarsStr || !description?.trim()) {
    return { error: 'Amount and description are required' }
  }
  if (!txType || !['spend', 'give'].includes(txType)) {
    return { error: 'Invalid transaction type' }
  }
  if (!jarTarget || !['spend', 'giving'].includes(jarTarget)) {
    return { error: 'Invalid jar target' }
  }

  const amount_cents = dollarsToCents(dollarsStr)
  if (isNaN(amount_cents) || amount_cents <= 0) {
    return { error: 'Please enter a valid positive amount' }
  }

  const supabase = await createClient()

  const { error } = await supabase.rpc('process_withdraw_transaction', {
    p_kid_id: kidId,
    p_type: txType,
    p_amount_cents: amount_cents,
    p_description: description.trim(),
    p_jar_target: jarTarget,
  })

  if (error) {
    if (error.message.includes('Insufficient balance')) {
      return { error: 'Not enough money in that jar!' }
    }
    return { error: error.message }
  }

  revalidatePath(`/parent/kids/${kidId}`)
  revalidatePath(`/parent/kids/${kidId}/transactions`)
  revalidatePath(`/kid/${kidId}/dashboard`)
  return { success: true }
}

export async function voidTransaction(transactionId: string, kidId: string) {
  await requireParentSession()

  const supabase = await createClient()
  const { error } = await supabase.rpc('void_transaction', {
    p_transaction_id: transactionId,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/parent/kids/${kidId}`)
  revalidatePath(`/parent/kids/${kidId}/transactions`)
  revalidatePath(`/kid/${kidId}/dashboard`)
  return { success: true }
}

export async function setStartingBalances(
  kidId: string,
  savingsCents: number,
  spendCents: number,
  givingCents: number,
  description = 'Starting Balance'
) {
  await requireParentSession()

  if (savingsCents < 0 || spendCents < 0 || givingCents < 0) {
    return { error: 'Starting balances cannot be negative' }
  }

  const totalCents = savingsCents + spendCents + givingCents
  if (totalCents === 0) return { success: true }

  const supabase = await createClient()
  const { error } = await supabase.rpc('process_earn_transaction', {
    p_kid_id: kidId,
    p_amount_cents: totalCents,
    p_description: description,
    p_savings_cents: savingsCents,
    p_spend_cents: spendCents,
    p_giving_cents: givingCents,
    p_split_snapshot: null,
  })

  if (error) return { error: error.message }

  revalidatePath(`/parent/kids/${kidId}`)
  revalidatePath(`/kid/${kidId}/dashboard`)
  return { success: true }
}
