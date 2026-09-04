import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Headset } from 'lucide-react'
import { escalate } from '../services/api'

interface EscalateLocationState {
  sessionId?: string
  issue?: string
  stepsCompleted?: number
}

export default function Escalate() {
  const navigate = useNavigate()
  const location = useLocation()
  const { sessionId, issue, stepsCompleted = 0 } = (location.state as EscalateLocationState) ?? {}

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ticketId, setTicketId] = useState<string | null>(null)

  async function handleContactSupport() {
    if (!sessionId) return
    setBusy(true)
    setError(null)
    try {
      const result = await escalate(sessionId)
      setTicketId(result.ticketId)
    } catch {
      setError("We're having trouble connecting. Check your connection and try again.")
    } finally {
      setBusy(false)
    }
  }

  if (ticketId) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 py-4 text-center">
        <h1 className="text-[28px] font-bold leading-8 text-text">Your support request has been created.</h1>
        <p className="text-lg font-semibold text-primary">Ticket #{ticketId}</p>
        <p className="text-base text-text-secondary">
          An agent has your diagnosis and troubleshooting history.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-4 flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-6 text-base font-semibold text-white transition-colors duration-200 hover:bg-primary-dark"
        >
          Finish
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-4 py-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card">
          <Headset size={32} className="text-primary" aria-hidden="true" />
        </div>
        <h1 className="text-[28px] font-bold leading-8 text-text">We couldn't fix it</h1>
        <p className="text-base leading-6 text-text-secondary">
          Don't worry. We've saved your diagnosis so you don't need to repeat the steps.
        </p>
      </div>

      <div className="space-y-2 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <p className="text-sm text-text-secondary">Issue</p>
        <p className="text-base font-medium text-text">{issue ?? 'Connectivity problem'}</p>
        <p className="text-sm text-text-secondary">Steps attempted</p>
        <p className="text-base font-medium text-text">{stepsCompleted}</p>
        <p className="text-sm font-medium text-error">Still unresolved</p>
      </div>

      {error && <p className="text-center text-error">{error}</p>}

      <div className="mt-auto space-y-3">
        <button
          type="button"
          onClick={handleContactSupport}
          disabled={busy || !sessionId}
          className="flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-6 text-base font-semibold text-white transition-colors duration-200 hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? 'Contacting support…' : 'Contact Support'}
        </button>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex min-h-11 w-full items-center justify-center rounded-lg border border-border bg-transparent px-6 text-base font-semibold text-primary transition-colors duration-200 hover:bg-slate-50"
        >
          Start Over
        </button>
      </div>
    </div>
  )
}
