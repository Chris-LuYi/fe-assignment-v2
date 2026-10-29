import type { ReactNode } from 'react'

export interface FieldControlProps {
  id: string
  'aria-invalid': boolean
  'aria-describedby': string | undefined
}

interface FieldProps {
  id: string
  label: ReactNode
  error?: string
  hint?: ReactNode
  /** Right-aligned text next to the label, e.g. a character counter. */
  aside?: ReactNode
  children: (control: FieldControlProps) => ReactNode
}

/**
 * Label + control + hint + error. The control gets `aria-describedby`
 * pointing at the hint and the error (T8), via a render prop so it works for
 * inputs, selects and textareas alike.
 */
export function Field({ id, label, error, hint, aside, children }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined

  return (
    <div className="field">
      <div className="field__label-row">
        <label htmlFor={id} className="field__label">
          {label}
        </label>
        {aside}
      </div>
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy })}
      {error && <FieldError id={errorId!}>{error}</FieldError>}
      {hint && (
        <div id={hintId} className="field__hint">
          {hint}
        </div>
      )}
    </div>
  )
}

export function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="field__error">
      {children}
    </p>
  )
}
