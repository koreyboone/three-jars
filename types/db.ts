// types/db.ts
// Typed database models — all money fields use _cents suffix (integers).

export type JarType = 'savings' | 'spend' | 'giving'
export type TransactionType = 'earn' | 'spend' | 'give'

export interface User {
  id: string
  email: string
  role: 'parent'
  created_at: string
}

export interface Kid {
  id: string
  parent_id: string
  name: string
  avatar_emoji: string
  pin_hash: string
  created_at: string
}

export interface Jar {
  id: string
  kid_id: string
  type: JarType
  balance_cents: number
}

export interface JarSettings {
  kid_id: string
  savings_percent: number
  spend_percent: number
  giving_percent: number
}

export interface Transaction {
  id: string
  kid_id: string
  type: TransactionType
  amount_cents: number
  description: string
  savings_amount_cents: number | null
  spend_amount_cents: number
  giving_amount_cents: number
  split_snapshot: {
    savings_percent: number
    spend_percent: number
    giving_percent: number
  } | null
  jar_target: JarType | null
  voided: boolean
  voided_at: string | null
  voided_transaction_id: string | null
  created_at: string
}

export interface SavingsGoal {
  id: string
  kid_id: string
  label: string
  target_amount_cents: number
  last_celebrated_percent: number
  created_at: string
}

// Kid info shown on the kid-login selector (no sensitive data)
export interface KidSelector {
  id: string
  name: string
  avatar_emoji: string
}

// Jar balances grouped for display
export interface KidJars {
  savings: Jar
  spend: Jar
  giving: Jar
}

// Preset avatar emojis for kid creation
export const AVATAR_EMOJIS = [
  '😊', '😎', '🦊', '🐱', '🐶', '🦄', '🐼', '🐸',
  '🦁', '🐯', '🐰', '🐻', '🐵', '🦉', '🐲', '🌟',
  '🚀', '⚽', '🎨', '🎵', '🦋', '🌈', '🍕', '🎮',
] as const
