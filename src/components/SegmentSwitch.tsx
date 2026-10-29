import type { Segment } from '../api/types'

const OPTIONS: { value: Segment; label: string }[] = [
  { value: 'retail', label: 'Retail' },
  { value: 'premium', label: 'Premium' },
]

interface SegmentSwitchProps {
  value: Segment
  onChange: (segment: Segment) => void
  className?: string
}

/** Two toggle buttons with `aria-pressed` (TH3). */
export function SegmentSwitch({ value, onChange, className }: SegmentSwitchProps) {
  return (
    <div
      role="group"
      aria-label="Customer segment"
      className={['segment-switch', className].filter(Boolean).join(' ')}
    >
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className="segment-switch__option"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
