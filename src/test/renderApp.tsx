import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { getDefaultNormalizer, render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

/** Renders the whole app against the real MSW handlers (data reset per test). */
export function renderApp() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const user = userEvent.setup()
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  )
  return { user, queryClient, ...utils }
}

/**
 * `formatMoney` output contains a non-breaking space, which Testing Library's
 * default normalizer collapses. Use this to match text containing money.
 */
export const keepSpaces = { normalizer: getDefaultNormalizer({ collapseWhitespace: false }) }

/** Exact text check that keeps the non-breaking space from `formatMoney`. */
export function textOf(element: HTMLElement) {
  return element.textContent ?? ''
}
