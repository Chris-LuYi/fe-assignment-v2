import { CheckCircle2 } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { Transfer } from '../../api/types'
import { Button } from '../../components/Button'
import { formatMoney } from '../../lib/format'

interface SuccessPanelProps {
  transfer: Transfer
  onDone: () => void
}

/** T5. The live region announcing this sits in TransferDialog (always mounted). */
export function SuccessPanel({ transfer, onDone }: SuccessPanelProps) {
  const doneRef = useRef<HTMLButtonElement>(null)
  useEffect(() => doneRef.current?.focus(), [])

  const { recipient } = transfer
  return (
    <div className="success">
      <CheckCircle2 aria-hidden="true" size={56} className="success__icon" />
      <h3 className="success__title">Transfer sent</h3>
      <p className="success__amount amount">{formatMoney(transfer.amount)}</p>
      <p className="success__to">
        to {recipient.name} · {recipient.bank} · {recipient.accountNumberMasked}
      </p>
      <dl className="success__reference">
        <dt>Reference</dt>
        <dd className="amount">{transfer.reference}</dd>
      </dl>
      <p className="success__note">The money should arrive within minutes.</p>
      <Button ref={doneRef} block onClick={onDone}>
        Back to dashboard
      </Button>
    </div>
  )
}
