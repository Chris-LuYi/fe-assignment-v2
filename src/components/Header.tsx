import { Moon, Sun } from 'lucide-react'
import type { Segment } from '../api/types'
import { SegmentSwitch } from './SegmentSwitch'

interface HeaderProps {
  initials: string | undefined
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  segment: Segment
  onSegmentChange: (segment: Segment) => void
}

const DECORATIVE_NAV = ['Cards', 'Payments', 'Insights']

export function Header({ initials, theme, onToggleTheme, segment, onSegmentChange }: HeaderProps) {
  const isDark = theme === 'dark'
  return (
    <header className="header">
      <div className="header__inner container">
        <a className="logo" href="./" aria-label="Meridian home">
          <span className="logo__mark" aria-hidden="true">
            M
          </span>
          <span className="logo__text">Meridian</span>
        </a>

        <nav className="header__nav" aria-label="Main">
          <a href="./" aria-current="page" className="nav-link nav-link--active">
            Overview
          </a>
          {/* Out of scope pages: shown, but disabled (brief §2). */}
          {DECORATIVE_NAV.map((label) => (
            <button key={label} type="button" className="nav-link" disabled>
              {label}
            </button>
          ))}
        </nav>

        <div className="header__actions">
          <SegmentSwitch
            className="header__segment"
            value={segment}
            onChange={onSegmentChange}
          />
          <button
            type="button"
            className="icon-btn"
            aria-label="Dark mode"
            aria-pressed={isDark}
            onClick={onToggleTheme}
          >
            {isDark ? <Moon aria-hidden="true" size={20} /> : <Sun aria-hidden="true" size={20} />}
          </button>
          <span className="avatar" aria-label="Signed in as Ava Chen" role="img">
            {initials ?? ''}
          </span>
        </div>
      </div>
    </header>
  )
}
