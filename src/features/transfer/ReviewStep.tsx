import { useQuery } from '@tanstack/react-query'
import { Info } from 'lucide-react'
import type { ReactNode } from 'react'
import { useFormContext } from 'react-hook-form'
import { payeesQuery } from '../../api/queries'
import type { Account } from '../../api/types'
import { formatMoney } from '../../lib/format'
import { NEW_RECIPIENT, type TransferFormValues } from './schema'

const FEE = 0

/** T4. Reads the values the user entered; nothing is sent until Confirm. */
export function ReviewStep({ depositAccounts }: { depositAccounts: Account[] }) {
  const { getValues } = useFormContext<TransferFormValues>()
  const { data: payees } = useQuery(payeesQuery)
  const values = getValues()

  const from = depositAccounts.find((a) => a.id === values.fromAccountId)
  const recipient =
    values.recipient === NEW_RECIPIENT
      ? {
          name: values.newRecipient.name.trim(),
          bank: values.newRecipient.bank,
          masked: `•••• ${values.newRecipient.accountNumber.trim().slice(-4)}`,
        }
      : (() => {
          const payee = payees?.find((p) => p.id === values.recipient)
          return payee && { name: payee.name, bank: payee.bank, masked: payee.accountNumberMasked }
        })()
  const amount = Number(values.amount)
  const note = values.note.trim()

  return (
    <>
      <dl className="summary">
        <SummaryRow label="From">
          {from ? `${from.name} · ${from.maskedNumber}` : '—'}
        </SummaryRow>
        <SummaryRow label="To">
          {recipient ? `${recipient.name} · ${recipient.bank} · ${recipient.masked}` : '—'}
        </SummaryRow>
        <SummaryRow label="Amount">{formatMoney(amount)}</SummaryRow>
        <SummaryRow label="Fee">{formatMoney(FEE)}</SummaryRow>
        {note && <SummaryRow label="Note">{note}</SummaryRow>}
        <SummaryRow label="Total" emphasis>
          {formatMoney(amount + FEE)}
        </SummaryRow>
      </dl>
      <p className="summary__info">
        <Info aria-hidden="true" size={16} /> Usually arrives in minutes.
      </p>
    </>
  )
}

function SummaryRow({
  label,
  emphasis = false,
  children,
}: {
  label: string
  emphasis?: boolean
  children: ReactNode
}) {
  return (
    <div className={`summary__row ${emphasis ? 'summary__row--total' : ''}`}>
      <dt>{label}</dt>
      <dd className="amount">{children}</dd>
    </div>
  )
}
