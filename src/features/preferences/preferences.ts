import type { Segment } from '../../api/types'

export type Theme = 'light' | 'dark'

// Keep in sync with the inline script in index.html.
const THEME_KEY = 'meridian:theme'
const SEGMENT_KEY = 'meridian:segment'

const root = () => document.documentElement

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Storage blocked: the choice still applies for this session.
  }
}

/** The inline script has already resolved stored value vs. system setting. */
export function getTheme(): Theme {
  return root().dataset.theme === 'dark' ? 'dark' : 'light'
}

export function applyTheme(theme: Theme) {
  root().dataset.theme = theme
  write(THEME_KEY, theme)
}

/** Only an explicit choice counts; otherwise the customer's default wins. */
export function getStoredSegment(): Segment | null {
  const value = read(SEGMENT_KEY)
  return value === 'retail' || value === 'premium' ? value : null
}

export function applySegment(segment: Segment, { persist = true } = {}) {
  root().dataset.segment = segment
  if (persist) write(SEGMENT_KEY, segment)
}
