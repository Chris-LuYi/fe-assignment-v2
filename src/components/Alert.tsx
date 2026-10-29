import { AlertCircle } from 'lucide-react'
import type { ReactNode } from 'react'

/** Error banner. `role="alert"` so screen readers announce it straight away. */
export function Alert({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="alert">
      <AlertCircle aria-hidden="true" size={20} className="alert__icon" />
      <div>{children}</div>
    </div>
  )
}
