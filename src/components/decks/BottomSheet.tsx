import { useEffect, type ReactNode } from 'react'

export type BottomSheetProps = {
  open: boolean
  onClose: () => void
  /** Accessible label for the sheet dialog. */
  title?: string
  /** Optional visible heading rendered at the top of the sheet. */
  heading?: ReactNode
  children: ReactNode
  /** Block dismiss interactions while a request is in flight. */
  busy?: boolean
  /** Block backdrop click and Escape (e.g. while a nested panel is open). */
  disableDismiss?: boolean
}

/**
 * Mobile-first bottom sheet: full-width panel that slides up from the bottom,
 * dimmed backdrop, safe-area aware. Pure presentation — no business logic.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  heading,
  children,
  busy,
  disableDismiss,
}: BottomSheetProps) {
  const canDismiss = !busy && !disableDismiss

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && canDismiss) onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, canDismiss, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        className="sheet-backdrop-animate absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
        onClick={() => canDismiss && onClose()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="sheet-panel-animate relative w-full max-w-md rounded-t-3xl bg-white pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl ring-1 ring-black/5 sm:mb-4 sm:rounded-3xl dark:bg-surface-900 dark:ring-white/10"
      >
        <div className="flex justify-center pt-3" aria-hidden>
          <span className="h-1.5 w-10 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>
        {heading ? (
          <div className="px-5 pt-3 pb-1">{heading}</div>
        ) : null}
        {children}
      </div>
    </div>
  )
}
