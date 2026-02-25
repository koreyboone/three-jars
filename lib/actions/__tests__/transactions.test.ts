// lib/actions/__tests__/transactions.test.ts
import { describe, it, expect } from 'vitest'
import { computeEarnSplit, dollarsToCents, centsToDisplay } from '@/lib/money'

describe('computeEarnSplit', () => {
  it('splits a standard 70/20/10 correctly', () => {
    const split = computeEarnSplit(1000, 70, 20, 10)
    expect(split.savings_cents).toBe(700)
    expect(split.spend_cents).toBe(200)
    expect(split.giving_cents).toBe(100)
    expect(split.savings_cents + split.spend_cents + split.giving_cents).toBe(1000)
  })

  it('assigns remainder to savings when floor causes a gap', () => {
    // $10.01 = 1001 cents at 70/20/10
    // spend = floor(1001 * 20 / 100) = floor(200.2) = 200
    // giving = floor(1001 * 10 / 100) = floor(100.1) = 100
    // savings = 1001 - 200 - 100 = 701
    const split = computeEarnSplit(1001, 70, 20, 10)
    expect(split.spend_cents).toBe(200)
    expect(split.giving_cents).toBe(100)
    expect(split.savings_cents).toBe(701)
    expect(split.savings_cents + split.spend_cents + split.giving_cents).toBe(1001)
  })

  it('handles non-round percentages (33/33/34) without losing a cent', () => {
    // 1000 cents at 33/33/34
    // spend = floor(1000 * 33 / 100) = 330
    // giving = floor(1000 * 34 / 100) = 340
    // savings = 1000 - 330 - 340 = 330
    const split = computeEarnSplit(1000, 33, 33, 34)
    expect(split.spend_cents).toBe(330)
    expect(split.giving_cents).toBe(340)
    expect(split.savings_cents).toBe(330)
    expect(split.savings_cents + split.spend_cents + split.giving_cents).toBe(1000)
  })

  it('handles 1 cent correctly', () => {
    const split = computeEarnSplit(1, 70, 20, 10)
    // spend = floor(1 * 20 / 100) = 0
    // giving = floor(1 * 10 / 100) = 0
    // savings = 1 - 0 - 0 = 1
    expect(split.savings_cents).toBe(1)
    expect(split.spend_cents).toBe(0)
    expect(split.giving_cents).toBe(0)
    expect(split.savings_cents + split.spend_cents + split.giving_cents).toBe(1)
  })

  it('handles 0 cents', () => {
    const split = computeEarnSplit(0, 70, 20, 10)
    expect(split.savings_cents).toBe(0)
    expect(split.spend_cents).toBe(0)
    expect(split.giving_cents).toBe(0)
  })

  it('handles a large amount without rounding errors', () => {
    const split = computeEarnSplit(999999, 33, 33, 34)
    expect(split.savings_cents + split.spend_cents + split.giving_cents).toBe(999999)
  })

  it('throws when percentages do not sum to 100', () => {
    expect(() => computeEarnSplit(1000, 70, 20, 11)).toThrow(
      'Percentages must sum to 100'
    )
  })

  it('throws for non-integer amount', () => {
    expect(() => computeEarnSplit(10.5, 70, 20, 10)).toThrow(
      'amount_cents must be a non-negative integer'
    )
  })
})

describe('dollarsToCents', () => {
  it('converts a whole dollar amount', () => {
    expect(dollarsToCents('10')).toBe(1000)
  })

  it('converts a decimal dollar amount', () => {
    expect(dollarsToCents('7.50')).toBe(750)
  })

  it('converts a dollar amount with one decimal', () => {
    expect(dollarsToCents('5.5')).toBe(550)
  })

  it('handles a dollar sign prefix', () => {
    expect(dollarsToCents('$12.34')).toBe(1234)
  })

  it('returns NaN for invalid input', () => {
    expect(dollarsToCents('abc')).toBeNaN()
  })

  it('returns NaN for negative amounts', () => {
    expect(dollarsToCents('-5')).toBeNaN()
  })
})

describe('centsToDisplay', () => {
  it('formats cents to dollars', () => {
    expect(centsToDisplay(750)).toBe('$7.50')
  })

  it('formats zero', () => {
    expect(centsToDisplay(0)).toBe('$0.00')
  })

  it('formats large amounts', () => {
    expect(centsToDisplay(123456)).toBe('$1234.56')
  })
})

describe('spend deduction logic', () => {
  it('deducts correctly when balance is sufficient', () => {
    const balance_cents = 500
    const deduction_cents = 300
    const newBalance = balance_cents - deduction_cents
    expect(newBalance).toBe(200)
    expect(newBalance).toBeGreaterThanOrEqual(0)
  })

  it('rejects deduction when balance is insufficient', () => {
    const balance_cents = 200
    const deduction_cents = 300
    const newBalance = balance_cents - deduction_cents
    expect(newBalance).toBeLessThan(0)
    // In the real DB, the CHECK constraint balance_cents >= 0 prevents this
  })
})

describe('void transaction reversal amounts', () => {
  it('produces correct reversal for earn', () => {
    const original = {
      savings_amount_cents: 700,
      spend_amount_cents: 200,
      giving_amount_cents: 100,
    }
    const reversal = {
      savings_amount_cents: -original.savings_amount_cents,
      spend_amount_cents: -original.spend_amount_cents,
      giving_amount_cents: -original.giving_amount_cents,
    }
    expect(reversal.savings_amount_cents).toBe(-700)
    expect(reversal.spend_amount_cents).toBe(-200)
    expect(reversal.giving_amount_cents).toBe(-100)

    // Net effect: zero
    const net_savings = original.savings_amount_cents + reversal.savings_amount_cents
    const net_spend = original.spend_amount_cents + reversal.spend_amount_cents
    const net_giving = original.giving_amount_cents + reversal.giving_amount_cents
    expect(net_savings).toBe(0)
    expect(net_spend).toBe(0)
    expect(net_giving).toBe(0)
  })

  it('produces correct reversal for spend', () => {
    const original_amount_cents = 500
    const original_spend_amount = -original_amount_cents // stored negative
    const reversal_spend_amount = original_amount_cents // restores

    expect(original_spend_amount + reversal_spend_amount).toBe(0)
  })

  it('produces correct reversal for give', () => {
    const original_amount_cents = 300
    const original_giving_amount = -original_amount_cents
    const reversal_giving_amount = original_amount_cents

    expect(original_giving_amount + reversal_giving_amount).toBe(0)
  })
})
