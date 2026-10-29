import type { Account, Customer } from '../api/types'

/** Checking and savings. The credit card is money owed, not money available. */
export function getDepositAccounts(accounts: Account[]): Account[] {
  return accounts.filter((account) => account.type !== 'credit')
}

/** D3: derived on render, never stored. */
export function getTotalAvailable(accounts: Account[]): number {
  return roundMoney(
    getDepositAccounts(accounts).reduce((sum, a) => sum + a.balance, 0),
  )
}

export function getRemainingDailyLimit(customer: Customer): number {
  return roundMoney(customer.dailyTransferLimit - customer.transferredToday)
}

/** Avoids 0.1 + 0.2 style float noise when adding money. */
export function roundMoney(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}
