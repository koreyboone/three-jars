// lib/money.ts
// All money values are stored and computed as integer cents.
// Dollar display happens at the UI layer only.

export type EarnSplit = {
  savings_cents: number
  spend_cents: number
  giving_cents: number
}

/**
 * Compute the 3-jar split for an earn transaction.
 * Uses Math.floor for spend and giving, remainder goes to savings.
 * Guarantees: savings + spend + giving === amount_cents (no cent lost).
 */
export function computeEarnSplit(
  amount_cents: number,
  savings_percent: number,
  spend_percent: number,
  giving_percent: number
): EarnSplit {
  if (savings_percent + spend_percent + giving_percent !== 100) {
    throw new Error('Percentages must sum to 100')
  }
  if (!Number.isInteger(amount_cents) || amount_cents < 0) {
    throw new Error('amount_cents must be a non-negative integer')
  }

  const spend_cents = Math.floor((amount_cents * spend_percent) / 100)
  const giving_cents = Math.floor((amount_cents * giving_percent) / 100)
  const savings_cents = amount_cents - spend_cents - giving_cents

  return { savings_cents, spend_cents, giving_cents }
}

/**
 * Convert a dollar string (e.g. "7.50") to integer cents (750).
 * Returns NaN if the input is not a valid dollar amount.
 */
export function dollarsToCents(dollars: string): number {
  const trimmed = dollars.trim()
  if (trimmed.startsWith('-')) return NaN
  const cleaned = trimmed.replace(/[^0-9.]/g, '')
  const parsed = parseFloat(cleaned)
  if (isNaN(parsed) || parsed < 0) return NaN
  return Math.round(parsed * 100)
}

/**
 * Display cents as a formatted dollar string: "$7.50"
 */
export function centsToDisplay(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

/**
 * Display cents without dollar sign for input fields: "7.50"
 */
export function centsToInputValue(cents: number): string {
  return (cents / 100).toFixed(2)
}
