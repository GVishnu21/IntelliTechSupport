import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import CameraCapture from '../components/CameraCapture'
import { PhotoUploadButton } from '../components/PhotoUploadButton'
import { CustomerLayout } from '../components/layout/CustomerLayout'
import { Button } from '../components/ui/Button'
import { ErrorState } from '../components/ui/ErrorState'
import { verifyStepWithPhoto } from '../services/api'
import type { TroubleshootingStep } from '../types'

interface VerifyLocationState {
  sessionId?: string
  scanId?: string
  step?: TroubleshootingStep
  issue?: string
  stepsCompleted?: number
}

export default function Verify() {
  const navigate = useNavigate()
  const location = useLocation()
  const { sessionId, scanId, step, issue, stepsCompleted = 0 } = (location.state as VerifyLocationState) ?? {}

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState(false)
  const [cameraKey, setCameraKey] = useState(0)

  useEffect(() => {
    if (!sessionId || !step) {
      navigate('/scan', { replace: true })
    }
  }, [sessionId, step, navigate])

  if (!sessionId || !step) {
    return null
  }

  function handleRetryCamera() {
    setCameraError(false)
    setCameraKey((key) => key + 1)
  }

  async function handleCapture(imageBase64: string) {
    setBusy(true)
    setError(null)
    try {
      const result = await verifyStepWithPhoto(sessionId!, imageBase64)

      if (result.resolved) {
        navigate('/success', { state: { scanId, issue, stepsCompleted } })
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
        state: { sessionId, scanId, step: result.nextStep, issue, stepsCompleted },
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

        {cameraError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <h2 className="text-[28px] font-bold leading-8 text-text">Camera access is needed</h2>
            <p className="text-base leading-6 text-text-secondary">Allow camera access to take another photo.</p>
            <div className="w-full max-w-xs space-y-3">
              <Button onClick={handleRetryCamera}>Enable Camera</Button>
              <PhotoUploadButton
                onUpload={handleCapture}
                className="mx-auto block min-h-11 text-sm font-medium text-text-secondary underline"
              >
                Upload a photo instead
              </PhotoUploadButton>
            </div>
          </div>
        ) : (
          <>
            <CameraCapture
              key={cameraKey}
              busy={busy}
              prompt="Take another photo so we can check it worked"
              onCapture={handleCapture}
              onError={() => setCameraError(true)}
            />
            <PhotoUploadButton
              onUpload={handleCapture}
              disabled={busy}
              className="mx-auto block min-h-11 text-sm font-medium text-primary underline"
            >
              Upload Photo
            </PhotoUploadButton>
          </>
        )}
      </div>
    </CustomerLayout>
  )
}
