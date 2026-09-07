import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CustomerLayout } from '../components/layout/CustomerLayout'
import { Button } from '../components/ui/Button'
import { ErrorState } from '../components/ui/ErrorState'
import { StepIndicator } from '../components/ui/StepIndicator'
import { TroubleshootingCard } from '../components/troubleshooting/TroubleshootingCard'
import { saveActiveSession } from '../utils/sessionContinuity'
import { skipStep } from '../services/api'
import type { TroubleshootingStep } from '../types'

interface TroubleshootLocationState {
  sessionId?: string
  scanId?: string
  step?: TroubleshootingStep
  issue?: string
  stepsCompleted?: number
}

export default function Troubleshoot() {
  const navigate = useNavigate()
  const location = useLocation()
  const { sessionId, scanId, step, issue, stepsCompleted = 0 } = (location.state as TroubleshootLocationState) ?? {}

  const [skipping, setSkipping] = useState(false)
  const [skipError, setSkipError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId || !step) {
      navigate('/scan', { replace: true })
      return
    }
    // Re-runs on every real navigation to this route (Verify sends the
    // customer back here with a new step each time), even though the
    // component instance doesn't remount -- so "Continue previous session"
    // always reflects the most recent step, not just the first one.
    saveActiveSession({ sessionId, scanId, step, issue, stepsCompleted })
  }, [sessionId, scanId, step, issue, stepsCompleted, navigate])

  if (!sessionId || !step) {
    return null
  }

  function goToVerify() {
    navigate('/verify', {
      state: { sessionId, scanId, step, issue, stepsCompleted: stepsCompleted + 1 },
    })
  }

  async function handleSkip() {
    setSkipping(true)
    setSkipError(null)
    try {
      const result = await skipStep(sessionId!)
      const nextStepsCompleted = stepsCompleted + 1

      if (result.escalate || !result.nextStep) {
        navigate('/escalate', { state: { sessionId, issue, stepsCompleted: nextStepsCompleted } })
        return
      }

      navigate('/troubleshoot', {
        state: { sessionId, scanId, step: result.nextStep, issue, stepsCompleted: nextStepsCompleted },
      })
    } catch {
      setSkipError("We're having trouble connecting. Check your connection and try again.")
    } finally {
      setSkipping(false)
    }
  }

  return (
    <CustomerLayout title="Troubleshooting" showBack focused>
      <div className="flex flex-1 flex-col gap-4">
        <StepIndicator currentStep={step.stepNumber} totalSteps={step.totalSteps} />

        <div className="flex-1">
          <TroubleshootingCard step={step} />
        </div>

        {skipError && <ErrorState title={skipError} inline />}

        <div className="sticky bottom-0 space-y-2 bg-background pb-2 pt-4">
          <Button onClick={goToVerify} disabled={skipping}>
            I've done this
          </Button>
          <button
            type="button"
            onClick={handleSkip}
            disabled={skipping}
            className="mx-auto block min-h-11 text-sm font-medium text-text-secondary underline disabled:opacity-50"
          >
            {skipping ? 'Skipping…' : 'Skip this step'}
          </button>
        </div>
      </div>
    </CustomerLayout>
  )
}
