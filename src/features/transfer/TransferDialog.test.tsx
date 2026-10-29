import { screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { formatMoney } from '../../lib/format'
import { keepSpaces, renderApp, textOf } from '../../test/renderApp'
import { server } from '../../test/setup'

const LOAD = { timeout: 3000 }

/** Opens the dialog and picks a saved payee, ending on the amount step. */
async function startTransferToJamie() {
  const app = renderApp()
  const { user } = app
  await user.click(await screen.findByRole('button', { name: 'New transfer' }, LOAD))
  const dialog = screen.getByRole('dialog', { name: 'New transfer' })
  await user.click(await within(dialog).findByRole('radio', { name: /Jamie Tan/ }, LOAD))
  await user.click(within(dialog).getByRole('button', { name: 'Continue' }))
  await within(dialog).findByRole('heading', { name: 'How much?' })
  return { ...app, dialog }
}

describe('transfer', () => {
  // E4 #1
  it('blocks an amount over the balance with an error, and sends no request', async () => {
    const requests: Request[] = []
    server.events.on('request:start', ({ request }) => {
      if (request.method === 'POST') requests.push(request)
    })
    const { user, dialog } = await startTransferToJamie()

    const amount = within(dialog).getByRole('textbox', { name: 'Amount' })
    await user.type(amount, '4280.56')
    await user.click(within(dialog).getByRole('button', { name: 'Continue' }))

    const message = `Amount can't be more than your available balance (${formatMoney(4280.55)}).`
    expect(within(dialog).getByText(message, keepSpaces)).toBeInTheDocument()
    expect(amount).toHaveAttribute('aria-invalid', 'true')
    expect(amount).toHaveAttribute('aria-describedby', expect.stringContaining('amount-error'))
        expect(amount).toHaveFocus()
    expect(within(dialog).getByRole('heading', { name: 'How much?' })).toBeInTheDocument()
    expect(requests).toHaveLength(0)
  })

  // E4 #2
  it('sends a transfer, shows the success screen and updates the dashboard', async () => {
    const { user, dialog } = await startTransferToJamie()

    await user.type(within(dialog).getByRole('textbox', { name: 'Amount' }), '120')
    await user.type(within(dialog).getByRole('textbox', { name: 'Note (optional)' }), 'Dinner')
    await user.click(within(dialog).getByRole('button', { name: 'Continue' }))

    expect(await within(dialog).findByRole('heading', { name: 'Check the details' })).toBeInTheDocument()
    expect(dialog).toHaveTextContent('Jamie Tan · DBS · •••• 3391')
    expect(textOf(dialog)).toContain(formatMoney(120))

    const confirm = within(dialog).getByRole('button', { name: 'Confirm transfer' })
    await user.click(confirm)
    expect(confirm).toHaveTextContent('Sending…')
    expect(confirm).toHaveAttribute('aria-disabled', 'true')

    expect(await within(dialog).findByRole('heading', { name: 'Transfer sent' }, LOAD)).toBeInTheDocument()
    expect(within(dialog).getByText(/^TRF-/)).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Back to dashboard' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    // Checking 4,280.55 - 120 → total 17,000.55; limit 5,000 - 120.
    expect(textOf(screen.getByTestId('total-available'))).toBe(formatMoney(17000.55))
    expect(textOf(screen.getByTestId('remaining-limit'))).toBe(formatMoney(4880))
    const rows = within(screen.getByRole('list', { name: 'Recent transactions' })).getAllByRole('listitem')
    expect(rows[0]).toHaveTextContent('Transfer to Jamie Tan')
    expect(textOf(rows[0])).toContain(formatMoney(-120))
    // Focus goes back to the button that opened the dialog.
    expect(screen.getByRole('button', { name: 'New transfer' })).toHaveFocus()
  })

  it('stays on review with the data intact when sending fails, and can retry', async () => {
    let fail = true
    server.use(
      http.post('*/api/transfers', () =>
        fail
          ? HttpResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Boom' } }, { status: 500 })
          : undefined,
      ),
    )
    const { user, dialog } = await startTransferToJamie()
    await user.type(within(dialog).getByRole('textbox', { name: 'Amount' }), '50')
    await user.click(within(dialog).getByRole('button', { name: 'Continue' }))
    await user.click(await within(dialog).findByRole('button', { name: 'Confirm transfer' }))

    expect(await within(dialog).findByRole('alert', undefined, LOAD)).toHaveTextContent(
      "Something went wrong. Your money hasn't left your account. Try again.",
    )
    expect(within(dialog).getByRole('heading', { name: 'Check the details' })).toBeInTheDocument()
    expect(within(dialog).queryByText('Transfer sent')).not.toBeInTheDocument()
    expect(textOf(dialog)).toContain(formatMoney(50))

    fail = false
    await user.click(within(dialog).getByRole('button', { name: 'Confirm transfer' }))
    expect(await within(dialog).findByRole('heading', { name: 'Transfer sent' }, LOAD)).toBeInTheDocument()
  })

  it('validates a new recipient and focuses the first invalid field', async () => {
    const { user } = renderApp()
    await user.click(await screen.findByRole('button', { name: 'New transfer' }, LOAD))
    const dialog = screen.getByRole('dialog', { name: 'New transfer' })

    await user.click(within(dialog).getByRole('radio', { name: 'Send to someone new' }))
    await user.type(within(dialog).getByRole('textbox', { name: 'Account number' }), '1234')
    await user.click(within(dialog).getByRole('button', { name: 'Continue' }))

    expect(within(dialog).getByRole('textbox', { name: 'Recipient name' })).toHaveFocus()
    expect(within(dialog).getByText('Enter a valid 8-digit account number.')).toBeInTheDocument()
    expect(within(dialog).getByRole('heading', { name: 'Who are you sending to?' })).toBeInTheDocument()
  })
})
