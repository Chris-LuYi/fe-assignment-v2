import type { Account } from '../../api/types'
import { EmptyState } from '../../components/EmptyState'
import { AccountCard } from './AccountCard'

export function AccountList({ accounts }: { accounts: Account[] }) {
  return (
    <section aria-labelledby="accounts-heading" className="section">
      <h2 id="accounts-heading" className="section__title">
        Accounts
      </h2>
      {accounts.length === 0 ? (
        <EmptyState title="You don't have any accounts yet." />
      ) : (
        <ul className="account-list" aria-labelledby="accounts-heading">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </ul>
      )}
    </section>
  )
}
