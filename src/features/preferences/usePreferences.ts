import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { customerQuery } from '../../api/queries'
import type { Segment } from '../../api/types'
import {
  applySegment,
  applyTheme,
  getStoredSegment,
  getTheme,
  type Theme,
} from './preferences'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getTheme)

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next) // write to <html> in the handler so it switches instantly
    setTheme(next)
  }

  return { theme, toggleTheme }
}

/**
 * The customer's `segment` from the API is the default; an explicit choice in
 * the switch overrides it locally and is remembered.
 */
export function useSegment() {
  const { data: customer } = useQuery(customerQuery)
  const [chosen, setChosen] = useState<Segment | null>(getStoredSegment)
  const segment: Segment = chosen ?? customer?.segment ?? 'retail'

  // Apply the API default once it arrives, without persisting it as a choice.
  useEffect(() => {
    if (chosen === null) applySegment(segment, { persist: false })
  }, [chosen, segment])

  const changeSegment = (next: Segment) => {
    applySegment(next)
    setChosen(next)
  }

  return { segment, changeSegment }
}
