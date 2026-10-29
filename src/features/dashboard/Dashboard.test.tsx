import { screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { formatMoney } from '../../lib/format'
import { keepSpaces, renderApp, textOf } from '../../test/renderApp'
import { server } from '../../test/setup'

const LOAD = { timeout: 3000 }

describe('dashboard', () => {
  it('shows the total of deposit accounts, the accounts and the 8 newest transactions', async () => {
    renderApp()

    expect(await screen.findByRole('heading', { name: 'Good evening, Ava' }, LOAD)).toBeInTheDocument()
    expect(textOf(screen.getByTestId('total-available'))).toBe(formatMoney(17120.55))
    expect(screen.getByText('Across 2 deposit accounts')).toBeInTheDocument()

    const accounts = screen.getByRole('list', { name: 'Accounts' })
    expect(within(accounts).getAllByRole('listitem')).toHaveLength(3)
    expect(within(accounts).getByText(formatMoney(-420.3), keepSpaces)).toBeInTheDocument()
    expect(within(accounts).getByText('Amount due')).toBeInTheDocument()

    const rows = within(screen.getByRole('list', { name: 'Recent transactions' })).getAllByRole('listitem')
    expect(rows).toHaveLength(8)
    expect(rows[0]).toHaveTextContent('FairPrice Finest')
    expect(rows[0]).toHaveTextContent('19 Oct')
  })

  // E4 #3
  it('shows an error when loading fails, and Retry loads the dashboard', async () => {
    let failing = true
    server.use(
      http.get('*/api/accounts', () =>
        failing
          ? HttpResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Down' } }, { status: 500 })
          : undefined, // fall through to the real handler
      ),
    )
    const { user } = renderApp()

    expect(await screen.findByText("We couldn't load your dashboard.", undefined, LOAD)).toBeInTheDocument()

    failing = false
    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(textOf(await screen.findByTestId('total-available', undefined, LOAD))).toBe(
      formatMoney(17120.55),
    )
    expect(screen.queryByText("We couldn't load your dashboard.")).not.toBeInTheDocument()
  })

  it('filters transactions by description or category and can clear the search', async () => {
    const { user } = renderApp()
    const search = await screen.findByRole('searchbox', { name: 'Search transactions' }, LOAD)
    const list = () => screen.getByRole('list', { name: 'Recent transactions' })

    await user.type(search, 'DINING') // category, any case
    expect(within(list()).getAllByRole('listitem')).toHaveLength(1)
    expect(list()).toHaveTextContent('Kopitiam Corner')
    expect(screen.getByText(/1 result for/)).toBeInTheDocument()

    await user.clear(search)
    await user.type(search, 'zzz')
    expect(screen.getByText('No transactions match your search.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(search).toHaveValue('')
    expect(within(list()).getAllByRole('listitem')).toHaveLength(8)
  })
})
