/**
 * Demo hook for the mock API (see brief/api-contract.md#test-and-demo-hooks).
 *
 * Lets reviewers see the error / empty / slow states on the deployed site via
 * `?scenario=error`, `?scenario=empty` or `?delay=2000` on the page URL, or the
 * debug menu (`?debug`). Normal app logic never sets this.
 */
export type Scenario = 'none' | 'error' | 'empty' | 'slow'

function readInitialScenario(): Scenario {
  if (typeof window === 'undefined') return 'none'
  const params = new URLSearchParams(window.location.search)
  const value = params.get('scenario')
  if (value === 'error' || value === 'empty') return value
  if (params.has('delay')) return 'slow'
  return 'none'
}

let current: Scenario = readInitialScenario()

export function getScenario(): Scenario {
  return current
}

export function setScenario(next: Scenario): void {
  current = next
}

/** Query string to append to GET requests for the active scenario. */
export function scenarioParams(): Record<string, string> {
  switch (current) {
    case 'error':
      return { scenario: 'error' }
    case 'empty':
      return { scenario: 'empty' }
    case 'slow':
      return { delay: '2500' }
    case 'none':
      return {}
  }
}
