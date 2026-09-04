import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { DiagnosisCard } from '../components/diagnosis/DiagnosisCard'
import { checkOutage } from '../services/api'
import type { RouterDiagnosis } from '../types'

interface DiagnosisLocationState {
  diagnosis?: RouterDiagnosis
  skipOutageCheck?: boolean
}

export default function Diagnosis() {
  const navigate = useNavigate()
  const location = useLocation()
  const { diagnosis, skipOutageCheck } = (location.state as DiagnosisLocationState) ?? {}

  useEffect(() => {
    if (!diagnosis) {
      navigate('/scan', { replace: true })
      return
    }
    if (skipOutageCheck) return

    checkOutage().then((outage) => {
      if (outage.active) {
        navigate('/outage', { replace: true, state: { outage, diagnosis } })
      }
    })
  }, [diagnosis, skipOutageCheck, navigate])

  if (!diagnosis) {
    return null
  }

  function handleStartTroubleshooting() {
    if (!diagnosis) return
    if (!diagnosis.firstStep) {
      navigate('/success', { state: { issue: diagnosis.issue, stepsCompleted: 0 } })
      return
    }
    navigate('/troubleshoot', {
      state: {
        sessionId: diagnosis.sessionId,
        step: diagnosis.firstStep,
        issue: diagnosis.issue,
        stepsCompleted: 0,
      },
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
        <h1 className="text-base font-bold text-text">Diagnosis</h1>
      </header>

      <h2 className="text-[28px] font-bold leading-8 text-text">Here's what we found</h2>

      <DiagnosisCard diagnosis={diagnosis} />

      <div className="mt-auto space-y-3 pt-4">
        <button
          type="button"
          onClick={handleStartTroubleshooting}
          className="flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-6 text-base font-semibold text-white transition-colors duration-200 hover:bg-primary-dark"
        >
          Start Troubleshooting
        </button>
        <button
          type="button"
          onClick={() => navigate('/select-router')}
          className="mx-auto block min-h-11 text-sm font-medium text-text-secondary underline"
        >
          Not your router? Select router manually
        </button>
      </div>
    </div>
  )
}
