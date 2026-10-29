import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import { scenarioParams } from './scenario'
import type {
  AccountsResponse,
  CreateTransferRequest,
  CustomerResponse,
  PayeesResponse,
  TransactionsResponse,
  TransferResponse,
} from './types'

/** Number of rows the dashboard shows (D5). */
export const RECENT_TRANSACTIONS_LIMIT = 8

function withParams(path: string, params: Record<string, string> = {}) {
  const query = new URLSearchParams({ ...params, ...scenarioParams() })
  const qs = query.toString()
  return qs ? `${path}?${qs}` : path
}

/**
 * Query keys live in one place so invalidation after a transfer can't drift
 * from the keys the dashboard reads.
 */
export const queryKeys = {
  customer: ['customer'] as const,
  accounts: ['accounts'] as const,
  transactions: (limit: number) => ['transactions', { limit }] as const,
  allTransactions: ['transactions'] as const,
  payees: ['payees'] as const,
}

export const customerQuery = queryOptions({
  queryKey: queryKeys.customer,
  queryFn: () => apiFetch<CustomerResponse>(withParams('/api/customer')),
  select: (data) => data.customer,
})

export const accountsQuery = queryOptions({
  queryKey: queryKeys.accounts,
  queryFn: () => apiFetch<AccountsResponse>(withParams('/api/accounts')),
  select: (data) => data.accounts,
})

export const recentTransactionsQuery = queryOptions({
  queryKey: queryKeys.transactions(RECENT_TRANSACTIONS_LIMIT),
  queryFn: () =>
    apiFetch<TransactionsResponse>(
      withParams('/api/transactions', {
        limit: String(RECENT_TRANSACTIONS_LIMIT),
      }),
    ),
})

export const payeesQuery = queryOptions({
  queryKey: queryKeys.payees,
  queryFn: () => apiFetch<PayeesResponse>(withParams('/api/payees')),
  select: (data) => data.payees,
})

/**
 * POST /api/transfers. On success we invalidate (rather than patch) the
 * customer, accounts and transactions queries: the response doesn't include
 * the new transaction row, so the server stays the single source of truth.
 * The invalidation is awaited, so the success screen only appears once the
 * dashboard behind it is already up to date.
 *
 * The callback lives on the hook (not on `mutate`) so it still runs if the
 * dialog is closed while the request is in flight.
 */
export function useCreateTransfer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateTransferRequest) =>
      apiFetch<TransferResponse>('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.customer }),
        queryClient.invalidateQueries({ queryKey: queryKeys.accounts }),
        queryClient.invalidateQueries({ queryKey: queryKeys.allTransactions }),
      ]),
  })
}
