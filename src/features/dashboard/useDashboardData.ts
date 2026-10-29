import { useQuery } from '@tanstack/react-query'
import { accountsQuery, customerQuery, recentTransactionsQuery } from '../../api/queries'

/**
 * D1: the three queries start in parallel. The dashboard renders as one unit:
 * skeleton until all three resolve, the error state if any fails.
 */
export function useDashboardData() {
  const customer = useQuery(customerQuery)
  const accounts = useQuery(accountsQuery)
  const transactions = useQuery(recentTransactionsQuery)
  const all = [customer, accounts, transactions]

  const retry = () => {
    for (const query of all) {
      if (query.isError) void query.refetch()
    }
  }

  if (customer.data && accounts.data && transactions.data) {
    return {
      status: 'success' as const,
      customer: customer.data,
      accounts: accounts.data,
      transactions: transactions.data.transactions,
    }
  }
  // Only show the error once nothing is still in flight, so Retry doesn't
  // flash the skeleton and the error alternately.
  if (all.some((q) => q.isError) && !all.some((q) => q.isFetching)) {
    return { status: 'error' as const, retry }
  }
  return { status: 'pending' as const }
}
