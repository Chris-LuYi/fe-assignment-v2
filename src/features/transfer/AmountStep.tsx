import { useFormContext, useWatch } from 'react-hook-form'
import type { Account } from '../../api/types'
import { Field } from '../../components/Field'
import { formatMoney } from '../../lib/format'
import { NOTE_MAX, type TransferFormValues } from './schema'

const QUICK_AMOUNTS = [50, 100, 250, 500]

interface AmountStepProps {
  depositAccounts: Account[]
  remainingLimit: number
}

/** T3. */
export function AmountStep({ depositAccounts, remainingLimit }: AmountStepProps) {
  const { register, setValue, formState: { errors } } = useFormContext<TransferFormValues>()
  const [fromAccountId, note] = useWatch<TransferFormValues, ['fromAccountId', 'note']>({
    name: ['fromAccountId', 'note'],
  })
  const from = depositAccounts.find((a) => a.id === fromAccountId)

  return (
    <>
      <Field
        id="from-account"
        label="From account"
        hint="Deposit accounts only"
        error={errors.fromAccountId?.message}
      >
        {(a11y) => (
          <select className="input" {...a11y} {...register('fromAccountId')}>
            {depositAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} · {account.maskedNumber}
              </option>
            ))}
          </select>
        )}
      </Field>

      <Field
        id="amount"
        label="Amount"
        error={errors.amount?.message}
        hint={
          <dl className="amount-facts">
            <div>
              <dt>Available</dt>
              <dd className="amount">{from ? formatMoney(from.balance) : '—'}</dd>
            </div>
            <div>
              <dt>Remaining daily limit</dt>
              <dd className="amount">{formatMoney(remainingLimit)}</dd>
            </div>
          </dl>
        }
      >
        {(a11y) => (
          <>
            <div className="money-input">
              <span className="money-input__prefix" aria-hidden="true">
                SGD
              </span>
              <input
                className="input money-input__field amount"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0.00"
                {...a11y}
                {...register('amount')}
              />
            </div>
            <div className="quick-amounts" role="group" aria-label="Quick amounts">
              {QUICK_AMOUNTS.map((value) => (
                <button
                  key={value}
                  type="button"
                  className="chip-btn"
                  aria-label={`Set amount to ${formatMoney(value)}`}
                  onClick={() =>
                    setValue('amount', String(value), {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true,
                    })
                  }
                >
                  {value}
                </button>
              ))}
            </div>
          </>
        )}
      </Field>

      <Field
        id="note"
        label="Note (optional)"
        error={errors.note?.message}
        aside={
          <span className="field__counter" aria-hidden="true">
            {note.length}/{NOTE_MAX}
          </span>
        }
        hint={<span className="visually-hidden">Up to {NOTE_MAX} characters.</span>}
      >
        {(a11y) => <input className="input" autoComplete="off" {...a11y} {...register('note')} />}
      </Field>
    </>
  )
}
