import { useState } from 'react'
import type { Transaction } from '../../api/types'
import { Button } from '../../components/Button'
import { EmptyState } from '../../components/EmptyState'
import { SearchInput } from '../../components/SearchInput'
import { formatMoney, formatShortDate } from '../../lib/format'

/**
 * D6: filters the 8 loaded rows in the browser. The list is tiny and already
 * in memory, so results are instant and need no extra request per keystroke.
 */
export function filterTransactions(transactions: Transaction[], query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return transactions
  return transactions.filter(
    (t) => t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q),
  )
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export function TransactionList({ transactions }: { transactions: Transaction[] }) {
  const [query, setQuery] = useState('')
  const results = filterTransactions(transactions, query)
  const isSearching = query.trim() !== ''

  return (
    <section aria-labelledby="transactions-heading" className="section card transactions">
      <div className="transactions__header">
        <h2 id="transactions-heading" className="section__title">
          Recent transactions
        </h2>
        {transactions.length > 0 && (
          <SearchInput
            id="transaction-search"
            label="Search transactions"
            placeholder="Search transactions"
            value={query}
            onChange={setQuery}
          />
        )}
      </div>

      <p className="transactions__count" role="status">
        {isSearching
          ? `${results.length} ${results.length === 1 ? 'result' : 'results'} for “${query.trim()}”`
          : ''}
      </p>

      {transactions.length === 0 ? (
        <EmptyState title="No transactions yet." />
      ) : results.length === 0 ? (
        <EmptyState title="No transactions match your search.">
          <Button variant="secondary" onClick={() => setQuery('')}>
            Clear search
          </Button>
        </EmptyState>
      ) : (
        <ul className="txn-list" aria-labelledby="transactions-heading">
          {results.map((t) => (
            <TransactionRow key={t.id} transaction={t} />
          ))}
        </ul>
      )}
    </section>
  )
}

function TransactionRow({ transaction: t }: { transaction: Transaction }) {
  const isIn = t.direction === 'in'
  const amount = isIn ? `+${formatMoney(t.amount)}` : formatMoney(-t.amount)
  return (
    <li className="txn">
      <div className="txn__main">
        <p className="txn__description">{t.description}</p>
        <p className="txn__meta">
          {capitalize(t.category)} · <time dateTime={t.date}>{formatShortDate(t.date)}</time>
        </p>
      </div>
      <div className="txn__side">
        <p className={`txn__amount amount ${isIn ? 'txn__amount--in' : ''}`}>{amount}</p>
        {t.status === 'pending' && <span className="chip">Pending</span>}
      </div>
    </li>
  )
}
