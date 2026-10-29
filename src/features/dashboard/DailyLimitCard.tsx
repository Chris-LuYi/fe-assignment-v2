import type { Customer } from '../../api/types'
import { getRemainingDailyLimit } from '../../lib/accounts'
import { formatMoney } from '../../lib/format'

export function DailyLimitCard({ customer }: { customer: Customer }) {
  const remaining = getRemainingDailyLimit(customer)
  const limit = customer.dailyTransferLimit
  const usedPct = limit > 0 ? Math.min(100, (customer.transferredToday / limit) * 100) : 0

  return (
    <section className="card limit" aria-labelledby="limit-heading">
      <h2 id="limit-heading" className="section__title">
        Daily limit
      </h2>
      <p className="limit__remaining">
        <span className="amount" data-testid="remaining-limit">
          {formatMoney(remaining)}
        </span>{' '}
        remaining today
      </p>
      <div
        className="progress"
        role="progressbar"
        aria-label="Daily limit used"
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={customer.transferredToday}
        aria-valuetext={`${formatMoney(customer.transferredToday)} of ${formatMoney(limit)} used`}
      >
        <span className="progress__bar" style={{ width: `${usedPct}%` }} />
      </div>
      <p className="limit__caption">
        {formatMoney(customer.transferredToday)} of {formatMoney(limit)} used. Resets daily.
        Applies to all transfers.
      </p>
    </section>
  )
}
