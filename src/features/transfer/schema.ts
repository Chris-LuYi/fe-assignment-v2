import { z } from 'zod'
import type { Account, CreateTransferRequest } from '../../api/types'
import { formatMoney } from '../../lib/format'

/** Radio value for "Send to someone new". Payee ids always start with `pay_`. */
export const NEW_RECIPIENT = 'new'

export const NOTE_MAX = 50
export const BANKS = [
  'DBS',
  'POSB',
  'OCBC',
  'UOB',
  'Standard Chartered',
  'HSBC',
  'Maybank',
  'Citibank',
] as const

export interface TransferFormValues {
  /** A payee id, `NEW_RECIPIENT`, or '' when nothing is picked yet. */
  recipient: string
  newRecipient: { name: string; accountNumber: string; bank: string }
  fromAccountId: string
  /** Kept as the raw text the user typed; converted in `toTransferRequest`. */
  amount: string
  note: string
}

/*
 * §3.3: every rule is written exactly once, here. React Hook Form uses this
 * schema (via zodResolver) for inline errors on blur, for each step's
 * `Continue`, and again on `Confirm transfer`.
 */
export const recipientChoiceSchema = z.string().min(1, 'Choose who you want to send money to.')
export const recipientNameSchema = z
  .string()
  .trim()
  .min(2, 'Enter a name between 2 and 50 characters.')
  .max(50, 'Enter a name between 2 and 50 characters.')
export const accountNumberSchema = z
  .string()
  .trim()
  .regex(/^\d{8}$/, 'Enter a valid 8-digit account number.')
export const bankSchema = z.string().min(1, 'Choose the recipient’s bank.')
export const fromAccountSchema = z.string().min(1, 'Choose an account to send from.')
export const noteSchema = z
  .string()
  .max(NOTE_MAX, `Keep the note to ${NOTE_MAX} characters or fewer.`)

const AMOUNT_FORMAT = /^\d+(\.\d{1,2})?$/

export function amountSchema(limits: { available?: number; remainingLimit: number }) {
  return z
    .string()
    .trim()
    .min(1, 'Enter an amount.')
    .superRefine((raw, ctx) => {
      const fail = (message: string) => ctx.addIssue({ code: 'custom', message })
      if (raw === '') return // reported by min(1) above
      if (!AMOUNT_FORMAT.test(raw)) {
        return fail('Enter a number with up to 2 decimal places, e.g. 120.50.')
      }
      const amount = Number(raw)
      if (amount < 1) return fail(`Enter at least ${formatMoney(1)}.`)
      if (limits.available !== undefined && amount > limits.available) {
        return fail(
          `Amount can't be more than your available balance (${formatMoney(limits.available)}).`,
        )
      }
      if (amount > limits.remainingLimit) {
        return fail(
          `This transfer exceeds your remaining daily limit (${formatMoney(limits.remainingLimit)}).`,
        )
      }
    })
}

/**
 * The amount rules depend on live data (balance of the chosen account and
 * the remaining daily limit), so the schema is built from that data.
 *
 * The object shape only checks types; the field rules run in `superRefine`
 * so they can depend on other fields (new recipient vs. saved payee, chosen
 * account) and always run together.
 */
export function createTransferSchema({
  accounts,
  remainingLimit,
}: {
  accounts: Account[]
  remainingLimit: number
}) {
  return z
    .object({
      recipient: z.string(),
      newRecipient: z.object({
        name: z.string(),
        accountNumber: z.string(),
        bank: z.string(),
      }),
      fromAccountId: z.string(),
      amount: z.string(),
      note: z.string(),
    })
    .superRefine((values, ctx) => {
      const check = (schema: z.ZodType, value: unknown, path: (string | number)[]) => {
        const result = schema.safeParse(value)
        if (!result.success) {
          ctx.addIssue({ code: 'custom', path, message: result.error.issues[0].message })
        }
      }

      check(recipientChoiceSchema, values.recipient, ['recipient'])
      if (values.recipient === NEW_RECIPIENT) {
        check(recipientNameSchema, values.newRecipient.name, ['newRecipient', 'name'])
        check(accountNumberSchema, values.newRecipient.accountNumber, ['newRecipient', 'accountNumber'])
        check(bankSchema, values.newRecipient.bank, ['newRecipient', 'bank'])
      }

      check(fromAccountSchema, values.fromAccountId, ['fromAccountId'])
      const from = accounts.find((a) => a.id === values.fromAccountId)
      check(amountSchema({ available: from?.balance, remainingLimit }), values.amount, ['amount'])
      check(noteSchema, values.note, ['note'])
    })
}

/** Maps the form to the API body: exactly one of `payeeId` / `recipient`. */
export function toTransferRequest(values: TransferFormValues): CreateTransferRequest {
  const note = values.note.trim()
  const base = {
    fromAccountId: values.fromAccountId,
    amount: Number(values.amount.trim()),
    ...(note ? { note } : {}),
  }
  if (values.recipient === NEW_RECIPIENT) {
    return {
      ...base,
      recipient: {
        name: values.newRecipient.name.trim(),
        accountNumber: values.newRecipient.accountNumber.trim(),
        bank: values.newRecipient.bank,
      },
    }
  }
  return { ...base, payeeId: values.recipient }
}

/** API `fields` keys → form field names (see api-contract.md#errors). */
export const API_FIELD_TO_FORM_FIELD = {
  payeeId: 'recipient',
  'recipient.name': 'newRecipient.name',
  'recipient.accountNumber': 'newRecipient.accountNumber',
  'recipient.bank': 'newRecipient.bank',
  fromAccountId: 'fromAccountId',
  amount: 'amount',
  note: 'note',
} as const
