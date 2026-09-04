import { useEffect, useRef, useState } from 'react'

interface CameraCaptureProps {
  onCapture: (imageBase64: string) => void
  busy: boolean
  prompt: string
}

export default function CameraCapture({
  onCapture,
  busy,
  prompt,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)

  // If a request fails, `busy` goes back to false while this component stays
  // mounted (same screen) — drop the freeze-frame so the customer sees the
  // live feed again and can retake, instead of being stuck looking at the
  // photo that just failed.
  useEffect(() => {
    if (!busy) {
      setCapturedImage(null)
    }
  }, [busy])

  useEffect(() => {
    let cancelled = false

    async function startCamera() {
      try {
        setError(null)

        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera API is not available in this browser')
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
          },
          audio: false,
        })

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream

        const video = videoRef.current

        if (!video) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        video.srcObject = stream
        video.muted = true
        video.playsInline = true

        const handleReady = async () => {
          if (cancelled) return

          try {
            await video.play()

            if (!cancelled) {
              setCameraReady(true)
            }
          } catch (err) {
            // Ignore AbortError caused by the video element being
            // interrupted while the browser is starting playback.
            if (err instanceof DOMException && err.name === 'AbortError') {
              console.log('Camera playback was interrupted; retrying...')
              return
            }

            console.error('Video play error:', err)
            setError('Unable to start camera preview')
          }
        }

        if (video.readyState >= 2) {
          await handleReady()
        } else {
          video.addEventListener('loadedmetadata', handleReady, {
            once: true,
          })
        }
      } catch (err) {
        console.error('Camera error:', err)

        if (err instanceof DOMException) {
          switch (err.name) {
            case 'NotAllowedError':
              setError(
                'Camera permission was denied. Please allow camera access in your browser settings.'
              )
              break

            case 'NotFoundError':
              setError('No camera was found on this device.')
              break

            case 'NotReadableError':
              setError(
                'The camera is already being used by another application.'
              )
              break

            case 'SecurityError':
              setError(
                'Camera access is blocked. Please use HTTPS and allow camera access.'
              )
              break

            default:
              setError(`${err.name}: ${err.message}`)
          }
        } else if (err instanceof Error) {
          setError(err.message)
        } else {
          setError('Unable to access camera')
        }
      }
    }

    startCamera()

    return () => {
      cancelled = true

      const video = videoRef.current

      if (video) {
        video.pause()
        video.srcObject = null
      }

      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  function capture() {
    const video = videoRef.current
    const canvas = canvasRef.current

    if (!video || !canvas || !cameraReady) {
      return
    }

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setError('Camera is not ready yet. Please try again.')
      return
    }

    const MAX_DIMENSION = 1280
    const scale = Math.min(
      1,
      MAX_DIMENSION / Math.max(video.videoWidth, video.videoHeight)
    )
    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)

    const ctx = canvas.getContext('2d')

    if (!ctx) {
      setError('Unable to capture image')
      return
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    const base64 = dataUrl.split(',')[1]

    setCapturedImage(dataUrl)
    onCapture(base64)
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">
        <p className="font-medium">Camera Error</p>
        <p className="mt-1 text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-center text-lg font-medium text-slate-800">
        {prompt}
      </p>

      <div className="relative w-full max-w-md">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`aspect-[3/4] w-full rounded-lg bg-black object-cover ${
            capturedImage ? 'invisible' : ''
          }`}
        />

        {capturedImage && (
          <img
            src={capturedImage}
            alt="Captured equipment"
            className="absolute inset-0 aspect-[3/4] w-full rounded-lg object-cover"
          />
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <button
        type="button"
        onClick={capture}
        disabled={busy || !cameraReady}
        className="w-full max-w-md rounded-full bg-blue-600 py-3 text-lg font-semibold text-white disabled:opacity-50"
      >
        {busy
          ? 'Reading equipment…'
          : !cameraReady
            ? 'Starting camera…'
            : 'Take photo'}
      </button>
    </div>
  )
}