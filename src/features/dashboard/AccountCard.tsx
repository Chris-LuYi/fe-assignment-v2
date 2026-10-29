import type { Account } from '../../api/types'
import { formatMoney } from '../../lib/format'

export function AccountCard({ account }: { account: Account }) {
  const isCredit = account.type === 'credit'
  return (
    <li className="account-card card">
      <p className="account-card__name">{account.name}</p>
      <p className="account-card__number amount">{account.maskedNumber}</p>
      <p className="account-card__balance amount">{formatMoney(account.balance)}</p>
      <p className="account-card__meta">{isCredit ? 'Amount due' : 'Available'}</p>
    </li>
  )
}
