import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Router } from 'lucide-react'
import { ErrorState } from '../components/ui/ErrorState'
import { analyzeRouter } from '../services/api'

const CHECKLIST = [
  'Image received',
  'Router detected',
  'Checking indicator lights',
  'Preparing diagnosis',
]

interface AnalyzingLocationState {
  imageBase64?: string
}

export default function Analyzing() {
  const location = useLocation()
  const navigate = useNavigate()
  const { imageBase64 } = (location.state as AnalyzingLocationState) ?? {}

  const [activeStep, setActiveStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    if (!imageBase64) {
      navigate('/scan', { replace: true })
      return
    }
    if (startedRef.current) return
    startedRef.current = true

    const stepTimer = setInterval(() => {
      setActiveStep((step) => Math.min(step + 1, CHECKLIST.length - 1))
    }, 600)

    analyzeRouter(imageBase64)
      .then((diagnosis) => {
        navigate('/diagnosis', { replace: true, state: { diagnosis } })
      })
      .catch(() => {
        setError("We're having trouble connecting.")
      })
      .finally(() => {
        clearInterval(stepTimer)
      })

    return () => clearInterval(stepTimer)
  }, [imageBase64, navigate])

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col">
        <ErrorState
          title={error}
          description="Check your connection and try again."
          actionLabel="Try another photo"
          onAction={() => navigate('/scan', { replace: true })}
        />
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="flex h-20 w-20 animate-pulse items-center justify-center rounded-2xl border border-border bg-card">
        <Router size={40} className="text-primary" aria-hidden="true" />
      </div>

      <div className="space-y-1">
        <h1 className="text-[28px] font-bold leading-8 text-text">Analyzing your router</h1>
        <p className="text-base leading-6 text-text-secondary">
          We're checking the equipment and indicator lights.
        </p>
      </div>

      <ul className="space-y-2 text-left">
        {CHECKLIST.map((label, index) => (
          <li
            key={label}
            className={`text-base ${index <= activeStep ? 'font-medium text-text' : 'text-text-secondary'}`}
          >
            {index < activeStep ? '✓ ' : index === activeStep ? '… ' : ''}
            {label}
          </li>
        ))}
      </ul>
    </div>
  )
}
