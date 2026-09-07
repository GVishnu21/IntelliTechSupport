import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { CustomerLayout } from '../components/layout/CustomerLayout'
import { Button } from '../components/ui/Button'
import { SecondaryButton } from '../components/ui/SecondaryButton'
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
        scanId: diagnosis.scanId,
        step: diagnosis.firstStep,
        issue: diagnosis.issue,
        stepsCompleted: 0,
      },
    })
  }

  function handleAlreadyFixed() {
    if (!diagnosis) return
    navigate('/success', { state: { scanId: diagnosis.scanId, issue: diagnosis.issue, stepsCompleted: 0 } })
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
          <Button onClick={() => navigate('/scan', { replace: true })}>Try another photo</Button>
          <SecondaryButton onClick={() => navigate('/select-router')}>Select router manually</SecondaryButton>
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
          <Button onClick={handleStartTroubleshooting}>Start Troubleshooting</Button>
        ) : (
          <Button onClick={handleAlreadyFixed}>Everything looks fine now</Button>
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
