import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import CameraCapture from '../components/CameraCapture'
import { CustomerLayout } from '../components/layout/CustomerLayout'
import { ErrorState } from '../components/ui/ErrorState'
import { verifyStepWithPhoto } from '../services/api'
import type { TroubleshootingStep } from '../types'

interface VerifyLocationState {
  sessionId?: string
  step?: TroubleshootingStep
  issue?: string
  stepsCompleted?: number
}

export default function Verify() {
  const navigate = useNavigate()
  const location = useLocation()
  const { sessionId, step, issue, stepsCompleted = 0 } = (location.state as VerifyLocationState) ?? {}

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId || !step) {
      navigate('/scan', { replace: true })
    }
  }, [sessionId, step, navigate])

  if (!sessionId || !step) {
    return null
  }

  async function handleCapture(imageBase64: string) {
    setBusy(true)
    setError(null)
    try {
      const result = await verifyStepWithPhoto(sessionId!, imageBase64)

      if (result.resolved) {
        navigate('/success', { state: { issue, stepsCompleted } })
        return
      }

      // Both an explicit `escalate: true` and the case where the backend has
      // no next step and hasn't resolved land on the Escalate screen — the
      // customer clicks "Contact Support" there, which is what actually
      // creates the ticket (spec section 15). Never leave them on a dead end.
      if (result.escalate || !result.nextStep) {
        navigate('/escalate', { state: { sessionId, issue, stepsCompleted } })
        return
      }

      navigate('/troubleshoot', {
        state: { sessionId, step: result.nextStep, issue, stepsCompleted },
      })
    } catch {
      setError("We're having trouble connecting. Check your connection and try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <CustomerLayout title="Step complete?" focused>
      <div className="flex flex-1 flex-col gap-4">
        <div className="space-y-1 text-center">
          <h2 className="text-[28px] font-bold leading-8 text-text">Did this fix your internet?</h2>
          <p className="text-base leading-6 text-text-secondary">Check your router lights and connection.</p>
        </div>

        {error && <ErrorState title={error} inline />}

        <CameraCapture
          busy={busy}
          prompt="Take another photo so we can check it worked"
          onCapture={handleCapture}
        />
      </div>
    </CustomerLayout>
  )
}
