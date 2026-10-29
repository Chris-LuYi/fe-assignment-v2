import { Plus } from 'lucide-react'
import type { Account } from '../../api/types'
import { Button } from '../../components/Button'
import { getDepositAccounts, getTotalAvailable } from '../../lib/accounts'
import { formatMoney } from '../../lib/format'

interface BalanceHeroProps {
  accounts: Account[]
  onNewTransfer: () => void
}

export function BalanceHero({ accounts, onNewTransfer }: BalanceHeroProps) {
  const depositCount = getDepositAccounts(accounts).length
  return (
    <section className="hero card" aria-labelledby="total-heading">
      <div>
        <h2 id="total-heading" className="hero__label">
          Total available
        </h2>
        <p className="hero__amount amount" data-testid="total-available">
          {formatMoney(getTotalAvailable(accounts))}
        </p>
        <p className="hero__caption">
          Across {depositCount} deposit {depositCount === 1 ? 'account' : 'accounts'}
        </p>
      </div>
      {/* One button; below 640px CSS pins it to the bottom of the screen (D8). */}
      <Button className="hero__cta" onClick={onNewTransfer}>
        <Plus aria-hidden="true" size={18} />
        New transfer
      </Button>
    </section>
  )
}
