import { Check } from 'lucide-react'

export const STEPS = [
  { id: 'recipient', label: 'Recipient' },
  { id: 'amount', label: 'Amount' },
  { id: 'review', label: 'Review' },
] as const

export type FormStep = (typeof STEPS)[number]['id']

export function Stepper({ current }: { current: FormStep }) {
  const currentIndex = STEPS.findIndex((s) => s.id === current)
  return (
    <ol className="stepper" aria-label="Transfer progress">
      {STEPS.map((step, index) => {
        const state = index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'todo'
        return (
          <li
            key={step.id}
            className={`stepper__item stepper__item--${state}`}
            aria-current={state === 'current' ? 'step' : undefined}
          >
            <span className="stepper__badge" aria-hidden="true">
              {state === 'done' ? <Check size={14} /> : index + 1}
            </span>
            <span>
              {step.label}
              {state === 'done' && <span className="visually-hidden"> (completed)</span>}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
