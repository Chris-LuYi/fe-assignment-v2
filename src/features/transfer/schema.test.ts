import { describe, expect, it } from 'vitest'
import type { Account } from '../../api/types'
import { formatMoney } from '../../lib/format'
import {
  createTransferSchema,
  NEW_RECIPIENT,
  toTransferRequest,
  type TransferFormValues,
} from './schema'

const accounts: Account[] = [
  { id: 'acc_checking', name: 'Everyday Checking', type: 'checking', maskedNumber: '•••• 4821', balance: 4280.55, currency: 'SGD' },
]
const schema = createTransferSchema({ accounts, remainingLimit: 5000 })

const valid: TransferFormValues = {
  recipient: 'pay_001',
  newRecipient: { name: '', accountNumber: '', bank: '' },
  fromAccountId: 'acc_checking',
  amount: '120',
  note: '',
}

function errorsFor(values: Partial<TransferFormValues>) {
  const result = schema.safeParse({ ...valid, ...values })
  return result.success
    ? {}
    : Object.fromEntries(result.error.issues.map((i) => [i.path.join('.'), i.message]))
}

describe('transfer schema', () => {
  it('accepts a valid saved-payee transfer', () => {
    expect(errorsFor({})).toEqual({})
  })

  it.each([
    ['', 'Enter an amount.'],
    ['0.5', `Enter at least ${formatMoney(1)}.`],
    ['10.123', 'Enter a number with up to 2 decimal places, e.g. 120.50.'],
    ['abc', 'Enter a number with up to 2 decimal places, e.g. 120.50.'],
    ['4280.56', `Amount can't be more than your available balance (${formatMoney(4280.55)}).`],
  ])('rejects amount %j', (amount, message) => {
    expect(errorsFor({ amount })).toEqual({ amount: message })
  })

  it('rejects an amount over the remaining daily limit', () => {
    const tight = createTransferSchema({ accounts, remainingLimit: 100 })
    const result = tight.safeParse({ ...valid, amount: '100.01' })
    expect(result.error?.issues[0].message).toBe(
      `This transfer exceeds your remaining daily limit (${formatMoney(100)}).`,
    )
  })

  it('only validates new-recipient fields when sending to someone new', () => {
    expect(
      errorsFor({ recipient: NEW_RECIPIENT, newRecipient: { name: 'A', accountNumber: '1234', bank: '' } }),
    ).toEqual({
      'newRecipient.name': 'Enter a name between 2 and 50 characters.',
      'newRecipient.accountNumber': 'Enter a valid 8-digit account number.',
      'newRecipient.bank': 'Choose the recipient’s bank.',
    })
  })

  it('builds a request with exactly one of payeeId / recipient', () => {
    expect(toTransferRequest({ ...valid, note: '  Dinner ' })).toEqual({
      fromAccountId: 'acc_checking',
      amount: 120,
      note: 'Dinner',
      payeeId: 'pay_001',
    })
    expect(
      toTransferRequest({
        ...valid,
        recipient: NEW_RECIPIENT,
        newRecipient: { name: ' Alex Lim ', accountNumber: '12345678', bank: 'OCBC' },
      }),
    ).toEqual({
      fromAccountId: 'acc_checking',
      amount: 120,
      recipient: { name: 'Alex Lim', accountNumber: '12345678', bank: 'OCBC' },
    })
  })
})
