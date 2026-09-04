import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { CustomerLayout } from '../components/layout/CustomerLayout'
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
    // A low-confidence read means we couldn't reliably identify the
    // equipment at all -- checking for a network-wide outage isn't the
    // relevant next step for that case, so skip it and show the retry
    // state below instead.
    if (skipOutageCheck || diagnosis.lowConfidence) return

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
    if (!diagnosis || !diagnosis.firstStep) return
    navigate('/troubleshoot', {
      state: {
        sessionId: diagnosis.sessionId,
        step: diagnosis.firstStep,
        issue: diagnosis.issue,
        stepsCompleted: 0,
      },
    })
  }

  function handleAlreadyFixed() {
    if (!diagnosis) return
    navigate('/success', { state: { issue: diagnosis.issue, stepsCompleted: 0 } })
  }

  if (diagnosis.lowConfidence) {
    return (
      <CustomerLayout title="Diagnosis" showBack>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <h2 className="text-[28px] font-bold leading-8 text-text">We couldn't identify the router</h2>
          <p className="text-base leading-6 text-text-secondary">
            Try taking another photo with the indicator lights clearly visible, or pick your
            router from a list instead.
          </p>
        </div>

        <div className="mt-auto space-y-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/scan', { replace: true })}
            className="flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-6 text-base font-semibold text-white transition-colors duration-200 hover:bg-primary-dark"
          >
            Try another photo
          </button>
          <button
            type="button"
            onClick={() => navigate('/select-router')}
            className="flex min-h-11 w-full items-center justify-center rounded-lg border border-border bg-transparent px-6 text-base font-semibold text-primary transition-colors duration-200 hover:bg-slate-50"
          >
            Select router manually
          </button>
        </div>
      </CustomerLayout>
    )
  }

  return (
    <CustomerLayout title="Diagnosis" showBack>
      <h2 className="text-[28px] font-bold leading-8 text-text">Here's what we found</h2>

      <div className="mt-4 flex-1">
        <DiagnosisCard diagnosis={diagnosis} />
      </div>

      <div className="mt-auto space-y-3 pt-4">
        {diagnosis.firstStep ? (
          <button
            type="button"
            onClick={handleStartTroubleshooting}
            className="flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-6 text-base font-semibold text-white transition-colors duration-200 hover:bg-primary-dark"
          >
            Start Troubleshooting
          </button>
        ) : (
          <button
            type="button"
            onClick={handleAlreadyFixed}
            className="flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-6 text-base font-semibold text-white transition-colors duration-200 hover:bg-primary-dark"
          >
            Everything looks fine now
          </button>
        )}
        <button
          type="button"
          onClick={() => navigate('/select-router')}
          className="mx-auto block min-h-11 text-sm font-medium text-text-secondary underline"
        >
          Not your router? Select router manually
        </button>
      </div>
    </CustomerLayout>
  )
}
