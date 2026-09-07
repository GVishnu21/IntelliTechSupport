import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CameraCapture from '../components/CameraCapture'
import { PhotoUploadButton } from '../components/PhotoUploadButton'
import { CustomerLayout } from '../components/layout/CustomerLayout'
import { Button } from '../components/ui/Button'
import { SecondaryButton } from '../components/ui/SecondaryButton'

type ScanPhase = 'capture' | 'review' | 'permission-error'

export default function Scan() {
  const navigate = useNavigate()

  const [phase, setPhase] = useState<ScanPhase>('capture')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [cameraKey, setCameraKey] = useState(0)

  function handleCameraCapture(base64: string) {
    setCapturedImage(base64)
    setPhase('review')
  }

  function handleCameraError() {
    setPhase('permission-error')
  }

  function handleRetryCamera() {
    setCameraKey((key) => key + 1)
    setPhase('capture')
  }

  function handlePhotoUpload(base64: string) {
    setCapturedImage(base64)
    setPhase('review')
  }

  function handleRetake() {
    setCapturedImage(null)
    setPhase('capture')
  }

  function handleUseThisPhoto() {
    if (!capturedImage) return
    sessionStorage.setItem('flowStartedAt', String(Date.now()))
    navigate('/analyzing', { state: { imageBase64: capturedImage } })
  }

  return (
    <CustomerLayout title="Scan Your Router" showBack focused>
      <div className="flex flex-1 flex-col gap-4">
      {phase === 'permission-error' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <h2 className="text-[28px] font-bold leading-8 text-text">Camera access is needed</h2>
          <p className="text-base leading-6 text-text-secondary">
            Allow camera access to scan your router.
          </p>
          <div className="w-full max-w-xs space-y-3">
            <Button onClick={handleRetryCamera}>Enable Camera</Button>
            <PhotoUploadButton
              onUpload={handlePhotoUpload}
              className="mx-auto block min-h-11 text-sm font-medium text-text-secondary underline"
            >
              Upload a photo instead
            </PhotoUploadButton>
          </div>
        </div>
      )}

      {phase === 'capture' && (
        <>
          <div className="space-y-1 text-center">
            <h2 className="text-[28px] font-bold leading-8 text-text">Show us your router</h2>
            <p className="text-base leading-6 text-text-secondary">
              Position your router inside the frame so we can clearly see the indicator lights.
            </p>
          </div>

          <CameraCapture
            key={cameraKey}
            busy={false}
            prompt="Frame the router's lights clearly, then take a photo"
            onCapture={handleCameraCapture}
            onError={handleCameraError}
          />

          <ul className="space-y-1 text-center text-sm text-text-secondary">
            <li>Make sure the lights are clearly visible</li>
            <li>Keep the router steady</li>
            <li>Reduce glare if possible</li>
          </ul>

          <PhotoUploadButton
            onUpload={handlePhotoUpload}
            className="mx-auto block min-h-11 text-sm font-medium text-primary underline"
          >
            Upload Photo
          </PhotoUploadButton>
        </>
      )}

      {phase === 'review' && capturedImage && (
        <div className="flex flex-1 flex-col gap-4">
          <div className="space-y-1 text-center">
            <h2 className="text-[28px] font-bold leading-8 text-text">Use this photo?</h2>
            <p className="text-base leading-6 text-text-secondary">
              Make sure the indicator lights are clearly visible.
            </p>
          </div>

          <img
            src={`data:image/jpeg;base64,${capturedImage}`}
            alt="Captured router"
            className="aspect-[3/4] w-full rounded-lg border border-border object-cover"
          />

          <div className="mt-auto space-y-3">
            <Button onClick={handleUseThisPhoto}>Use This Photo</Button>
            <SecondaryButton onClick={handleRetake}>Retake</SecondaryButton>
          </div>
        </div>
      )}
      </div>
    </CustomerLayout>
  )
}
