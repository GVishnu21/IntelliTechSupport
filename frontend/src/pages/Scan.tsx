import { useRef, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import CameraCapture from '../components/CameraCapture'

type ScanPhase = 'capture' | 'review' | 'permission-error'

export default function Scan() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  function handleUploadClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1]
      if (base64) {
        setCapturedImage(base64)
        setPhase('review')
      }
    }
    reader.readAsDataURL(file)
    event.target.value = ''
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
        <h1 className="text-base font-bold text-text">Scan Your Router</h1>
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleFileChange}
      />

      {phase === 'permission-error' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <h2 className="text-[28px] font-bold leading-8 text-text">Camera access is needed</h2>
          <p className="text-base leading-6 text-text-secondary">
            Allow camera access to scan your router.
          </p>
          <div className="w-full max-w-xs space-y-3">
            <button
              type="button"
              onClick={handleRetryCamera}
              className="flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-6 text-base font-semibold text-white transition-colors duration-200 hover:bg-primary-dark"
            >
              Enable Camera
            </button>
            <button
              type="button"
              onClick={handleUploadClick}
              className="mx-auto block min-h-11 text-sm font-medium text-text-secondary underline"
            >
              Upload a photo instead
            </button>
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

          <button
            type="button"
            onClick={handleUploadClick}
            className="mx-auto block min-h-11 text-sm font-medium text-primary underline"
          >
            Upload Photo
          </button>
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
            <button
              type="button"
              onClick={handleUseThisPhoto}
              className="flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-6 text-base font-semibold text-white transition-colors duration-200 hover:bg-primary-dark"
            >
              Use This Photo
            </button>
            <button
              type="button"
              onClick={handleRetake}
              className="flex min-h-11 w-full items-center justify-center rounded-lg border border-border bg-transparent px-6 text-base font-semibold text-primary transition-colors duration-200 hover:bg-slate-50"
            >
              Retake
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
