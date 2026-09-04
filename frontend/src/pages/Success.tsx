import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CircleCheckBig } from 'lucide-react'
import { StarRating } from '../components/ui/StarRating'

interface SuccessLocationState {
  issue?: string
  stepsCompleted?: number
}

function formatElapsed(): string {
  const startedAt = sessionStorage.getItem('flowStartedAt')
  if (!startedAt) return '—'
  const elapsedMs = Date.now() - Number(startedAt)
  const minutes = Math.max(1, Math.round(elapsedMs / 60000))
  return `${minutes} min`
}

export default function Success() {
  const navigate = useNavigate()
  const location = useLocation()
  const { issue = 'Connectivity problem', stepsCompleted = 0 } = (location.state as SuccessLocationState) ?? {}

  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const elapsed = formatElapsed()

  function handleFinish() {
    sessionStorage.removeItem('flowStartedAt')
    navigate('/')
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-4 py-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <CircleCheckBig size={56} className="text-success" aria-hidden="true" />
        <h1 className="text-[28px] font-bold leading-8 text-text">You're back online!</h1>
        <p className="text-base leading-6 text-text-secondary">Your internet connection is working again.</p>
      </div>

      <div className="space-y-2 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <p className="text-sm text-text-secondary">Issue</p>
        <p className="text-base font-medium text-text">{issue}</p>
        <div className="flex justify-between pt-2">
          <div>
            <p className="text-sm text-text-secondary">Steps completed</p>
            <p className="text-base font-medium text-text">{stepsCompleted}</p>
          </div>
          <div>
            <p className="text-sm text-text-secondary">Time</p>
            <p className="text-base font-medium text-text">{elapsed}</p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleFinish}
        className="flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-6 text-base font-semibold text-white transition-colors duration-200 hover:bg-primary-dark"
      >
        Finish
      </button>

      <div className="space-y-3 border-t border-border pt-4 text-center">
        <p className="text-base font-medium text-text">How was your experience?</p>
        <div className="flex justify-center">
          <StarRating value={rating} onChange={setRating} />
        </div>
        <textarea
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          placeholder="What could we improve?"
          rows={3}
          className="w-full rounded-lg border border-border bg-card p-3 text-sm text-text placeholder:text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
      </div>
    </div>
  )
}
