import { useQuery } from '@tanstack/react-query'
import { customerQuery } from './api/queries'
import { Header } from './components/Header'
import { Dashboard } from './features/dashboard/Dashboard'
import { DebugMenu } from './features/debug/DebugMenu'
import { useSegment, useTheme } from './features/preferences/usePreferences'

export default function App() {
  const { data: customer } = useQuery(customerQuery)
  const { theme, toggleTheme } = useTheme()
  const { segment, changeSegment } = useSegment()
  const initials = customer ? `${customer.firstName[0]}${customer.lastName[0]}` : undefined

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header
        initials={initials}
        theme={theme}
        onToggleTheme={toggleTheme}
        segment={segment}
        onSegmentChange={changeSegment}
      />
      <main id="main" className="container page">
        <Dashboard segment={segment} onSegmentChange={changeSegment} />
      </main>
      <DebugMenu />
    </>
  )
}
