import { describe, expect, it } from 'vitest'
import type { Account, Customer } from '../api/types'
import { getRemainingDailyLimit, getTotalAvailable } from './accounts'

const account = (type: Account['type'], balance: number): Account => ({
  id: `acc_${type}`,
  name: type,
  type,
  maskedNumber: '•••• 0000',
  balance,
  currency: 'SGD',
})

describe('accounts helpers', () => {
  it('totals deposit accounts only, excluding the credit card', () => {
    const accounts = [
      account('checking', 4280.55),
      account('savings', 12840),
      account('credit', -420.3),
    ]
    expect(getTotalAvailable(accounts)).toBe(17120.55)
  })

  it('computes the remaining daily limit', () => {
    const customer = {
      dailyTransferLimit: 5000,
      transferredToday: 120.1,
    } as Customer
    expect(getRemainingDailyLimit(customer)).toBe(4879.9)
  })
})
