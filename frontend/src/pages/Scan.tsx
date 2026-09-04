import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import CameraCapture from '../components/CameraCapture'

export default function Scan() {
  const navigate = useNavigate()

  function handleCapture(imageBase64: string) {
    sessionStorage.setItem('flowStartedAt', String(Date.now()))
    navigate('/analyzing', { state: { imageBase64 } })
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

      <div className="space-y-1 text-center">
        <h2 className="text-[28px] font-bold leading-8 text-text">Show us your router</h2>
        <p className="text-base leading-6 text-text-secondary">
          Position your router inside the frame so we can clearly see the indicator lights.
        </p>
      </div>

      <CameraCapture busy={false} prompt="Frame the router's lights clearly, then take a photo" onCapture={handleCapture} />

      <ul className="space-y-1 text-center text-sm text-text-secondary">
        <li>Make sure the lights are clearly visible</li>
        <li>Keep the router steady</li>
        <li>Reduce glare if possible</li>
      </ul>
    </div>
  )
}
