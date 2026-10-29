import { useEffect, useRef, type ReactNode } from 'react'

interface DialogProps {
  labelledBy: string
  /** Esc was pressed: the owner decides whether to close (e.g. confirm discard). */
  onRequestClose: () => void
  /** The browser closed the dialog on its own; the owner must sync its state. */
  onClosed: () => void
  children: ReactNode
}

/**
 * Thin wrapper around the native `<dialog>` + `showModal()`, which gives us
 * the focus trap, inert background, top layer and Esc handling for free.
 * Mount it to open, unmount it to close. Focus returns to whatever was focused
 * when it opened (T1), which also covers both "New transfer" buttons.
 */
export function Dialog({ labelledBy, onRequestClose, onClosed, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (!dialog.open) dialog.showModal()
    return () => {
      dialog.close()
      opener?.focus()
    }
  }, [])

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby={labelledBy}
      onCancel={(event) => {
        event.preventDefault()
        onRequestClose()
      }}
      onClose={() => {
        // Ignore the close we trigger ourselves on unmount / StrictMode re-run.
        if (!ref.current?.open) onClosed()
      }}
    >
      {children}
    </dialog>
  )
}
