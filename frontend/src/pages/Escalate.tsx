import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Headset } from 'lucide-react'
import { CustomerLayout } from '../components/layout/CustomerLayout'
import { Button } from '../components/ui/Button'
import { SecondaryButton } from '../components/ui/SecondaryButton'
import { ErrorState } from '../components/ui/ErrorState'
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
      <CustomerLayout title="Support" focused>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <h2 className="text-[28px] font-bold leading-8 text-text">Your support request has been created.</h2>
          <p className="text-lg font-semibold text-primary">Ticket #{ticketId}</p>
          <p className="text-base text-text-secondary">
            An agent has your diagnosis and troubleshooting history.
          </p>
          <div className="mt-4 w-full">
            <Button onClick={() => navigate('/')}>Finish</Button>
          </div>
        </div>
      </CustomerLayout>
    )
  }

  return (
    <CustomerLayout title="Support" focused>
      <div className="flex flex-1 flex-col gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card">
            <Headset size={32} className="text-primary" aria-hidden="true" />
          </div>
          <h2 className="text-[28px] font-bold leading-8 text-text">We couldn't fix it</h2>
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

        {error && <ErrorState title={error} inline />}

        <div className="mt-auto space-y-3">
          <Button onClick={handleContactSupport} disabled={busy || !sessionId}>
            {busy ? 'Contacting support…' : 'Contact Support'}
          </Button>
          <SecondaryButton onClick={() => navigate('/')}>Start Over</SecondaryButton>
        </div>
      </div>
    </CustomerLayout>
  )
}
