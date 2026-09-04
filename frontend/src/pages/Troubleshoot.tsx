import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { StepIndicator } from '../components/ui/StepIndicator'
import { TroubleshootingCard } from '../components/troubleshooting/TroubleshootingCard'
import type { TroubleshootingStep } from '../types'

interface TroubleshootLocationState {
  sessionId?: string
  step?: TroubleshootingStep
  issue?: string
  stepsCompleted?: number
}

export default function Troubleshoot() {
  const navigate = useNavigate()
  const location = useLocation()
  const { sessionId, step, issue, stepsCompleted = 0 } = (location.state as TroubleshootLocationState) ?? {}

  useEffect(() => {
    if (!sessionId || !step) {
      navigate('/scan', { replace: true })
    }
  }, [sessionId, step, navigate])

  if (!sessionId || !step) {
    return null
  }

  function goToVerify() {
    navigate('/verify', {
      state: { sessionId, step, issue, stepsCompleted: stepsCompleted + 1 },
    })
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 px-4 py-4">
      <header className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => navigate(-1)}
          className="flex min-h-11 min-w-11 items-center justify-center"
        >
          <ChevronLeft size={24} className="text-text" />
        </button>
        <h1 className="text-base font-bold text-text">Troubleshooting</h1>
      </header>

      <StepIndicator currentStep={step.stepNumber} totalSteps={step.totalSteps} />

      <div className="flex-1">
        <TroubleshootingCard step={step} />
      </div>

      <div className="sticky bottom-0 space-y-2 bg-background pb-2 pt-4">
        <button
          type="button"
          onClick={goToVerify}
          className="flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-6 text-base font-semibold text-white transition-colors duration-200 hover:bg-primary-dark"
        >
          I've done this
        </button>
        <button
          type="button"
          onClick={goToVerify}
          className="mx-auto block min-h-11 text-sm font-medium text-text-secondary underline"
        >
          Skip this step
        </button>
      </div>
    </div>
  )
}
