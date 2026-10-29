import { useQuery } from '@tanstack/react-query'
import { UserPlus } from 'lucide-react'
import { useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { payeesQuery } from '../../api/queries'
import type { Payee } from '../../api/types'
import { Button } from '../../components/Button'
import { EmptyState } from '../../components/EmptyState'
import { Field, FieldError } from '../../components/Field'
import { SearchInput } from '../../components/SearchInput'
import { Skeleton } from '../../components/Skeleton'
import { BANKS, NEW_RECIPIENT, type TransferFormValues } from './schema'

/**
 * T2. Saved payees and "Send to someone new" are one native radio group, so
 * arrow keys, Space and Tab work without any custom keyboard code (T8).
 */
export function RecipientStep() {
  const { register, formState: { errors } } = useFormContext<TransferFormValues>()
  const recipient = useWatch<TransferFormValues, 'recipient'>({ name: 'recipient' })
  const payees = useQuery(payeesQuery)
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const visible = (payees.data ?? []).filter(
    (p) => !q || p.name.toLowerCase().includes(q) || p.bank.toLowerCase().includes(q),
  )
  const groupError = errors.recipient?.message

  return (
    <>
      {(payees.data?.length ?? 0) > 0 && (
        <SearchInput
          id="payee-search"
          label="Search payees"
          placeholder="Search payees"
          value={query}
          onChange={setQuery}
        />
      )}

      <fieldset
        className="payee-group"
        aria-describedby={groupError ? 'recipient-error' : undefined}
      >
        <legend className="visually-hidden">Recipient</legend>

        {payees.isPending ? (
          <div className="payee-list" aria-busy="true" aria-label="Loading payees">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height="64px" radius="12px" />
            ))}
          </div>
        ) : payees.isError ? (
          <div className="inline-panel">
            <p>We couldn't load your saved payees.</p>
            <Button variant="secondary" onClick={() => void payees.refetch()}>
              Retry
            </Button>
          </div>
        ) : payees.data.length === 0 ? (
          <EmptyState title="You have no saved payees yet." />
        ) : visible.length === 0 ? (
          <EmptyState title="No payees match your search." />
        ) : (
          <div className="payee-list">
            {visible.map((payee) => (
              <PayeeOption key={payee.id} payee={payee} />
            ))}
          </div>
        )}

        <label className="payee-option payee-option--new">
          <input
            type="radio"
            className="payee-option__input"
            value={NEW_RECIPIENT}
            {...register('recipient')}
          />
          <span className="payee-option__avatar" aria-hidden="true">
            <UserPlus size={18} />
          </span>
          <span className="payee-option__name">Send to someone new</span>
        </label>
      </fieldset>
      {groupError && <FieldError id="recipient-error">{groupError}</FieldError>}

      {recipient === NEW_RECIPIENT && (
        <div className="new-recipient">
          <Field id="new-name" label="Recipient name" error={errors.newRecipient?.name?.message}>
            {(a11y) => (
              <input className="input" autoComplete="name" {...a11y} {...register('newRecipient.name')} />
            )}
          </Field>
          <Field
            id="new-account"
            label="Account number"
            hint="8 digits"
            error={errors.newRecipient?.accountNumber?.message}
          >
            {(a11y) => (
              <input
                className="input amount"
                inputMode="numeric"
                autoComplete="off"
                maxLength={8}
                {...a11y}
                {...register('newRecipient.accountNumber')}
              />
            )}
          </Field>
          <Field id="new-bank" label="Bank" error={errors.newRecipient?.bank?.message}>
            {(a11y) => (
              <select className="input" {...a11y} {...register('newRecipient.bank')}>
                <option value="">Select a bank</option>
                {BANKS.map((bank) => (
                  <option key={bank} value={bank}>
                    {bank}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
      )}
    </>
  )
}

function PayeeOption({ payee }: { payee: Payee }) {
  const { register } = useFormContext<TransferFormValues>()
  return (
    <label className="payee-option">
      <input type="radio" className="payee-option__input" value={payee.id} {...register('recipient')} />
      <span className="payee-option__avatar" aria-hidden="true">
        {payee.initials}
      </span>
      <span className="payee-option__text">
        <span className="payee-option__name">{payee.name}</span>
        <span className="payee-option__meta amount">
          {payee.bank} · {payee.accountNumberMasked}
        </span>
      </span>
    </label>
  )
}
