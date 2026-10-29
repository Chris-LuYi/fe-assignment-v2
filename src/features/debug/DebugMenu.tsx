import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { getScenario, setScenario, type Scenario } from '../../api/scenario'

const OPTIONS: { value: Scenario; label: string }[] = [
  { value: 'none', label: 'Normal' },
  { value: 'error', label: 'Errors (500)' },
  { value: 'empty', label: 'Empty lists' },
  { value: 'slow', label: 'Slow (2.5 s)' },
]

const enabled = () =>
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug')

/**
 * Optional demo tool, only rendered with `?debug` in the URL. Switches the
 * mock API scenario for GET requests and refetches, so reviewers can see the
 * loading, empty and error states on the deployed site.
 */
export function DebugMenu() {
  const queryClient = useQueryClient()
  const [scenario, setLocal] = useState(getScenario)
  if (!enabled()) return null

  const change = (next: Scenario) => {
    setScenario(next)
    setLocal(next)
    // resetQueries (not invalidate) drops cached data, so the skeleton and
    // error states show exactly as on a first load.
    void queryClient.resetQueries()
  }

  return (
    <details className="debug">
      <summary>Debug</summary>
      <label htmlFor="debug-scenario">Mock API scenario</label>
      <select
        id="debug-scenario"
        className="input"
        value={scenario}
        onChange={(e) => change(e.target.value as Scenario)}
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </details>
  )
}
