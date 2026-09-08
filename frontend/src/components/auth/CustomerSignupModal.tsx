import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'
import { CustomerSignupForm } from './CustomerSignupForm'
import type { CustomerProfile } from '../../services/customerAuth'

interface CustomerSignupModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (profile: CustomerProfile) => void
}

// Mandatory login (PRD IT-5), but presented as a popup over the scanner
// screen rather than a full-page redirect -- the customer sees the app
// first, then this appears either when they tap a primary action or after a
// short delay (see Home.tsx), matching the reference sign-up flow's timing
// without copying its real-estate visual style.
export function CustomerSignupModal({ open, onClose, onSuccess }: CustomerSignupModalProps) {
  const headingId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-background hover:text-text"
        >
          <X size={18} aria-hidden="true" />
        </button>

        <CustomerSignupForm headingId={headingId} onSuccess={onSuccess} />
      </div>
    </div>
  )
}
