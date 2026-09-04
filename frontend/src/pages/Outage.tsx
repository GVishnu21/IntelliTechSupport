import { useLocation, useNavigate } from 'react-router-dom'
import { TriangleAlert } from 'lucide-react'
import { CustomerLayout } from '../components/layout/CustomerLayout'
import type { OutageInfo, RouterDiagnosis } from '../types'

interface OutageLocationState {
  outage?: OutageInfo
  diagnosis?: RouterDiagnosis
}

export default function Outage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { outage, diagnosis } = (location.state as OutageLocationState) ?? {}

  function handleTroubleshootAnyway() {
    if (!diagnosis) {
      navigate('/scan', { replace: true })
      return
    }
    navigate('/diagnosis', { replace: true, state: { diagnosis, skipOutageCheck: true } })
  }

  return (
    <CustomerLayout title="Service Status">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card">
          <TriangleAlert size={32} className="text-warning" aria-hidden="true" />
        </div>
        <h2 className="text-[28px] font-bold leading-8 text-text">There's an outage in your area</h2>
        <p className="text-base leading-6 text-text-secondary">
          We've detected a known service issue affecting your area.
        </p>
      </div>

      <div className="mt-6 space-y-2 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <p className="text-base font-bold text-text">Service interruption</p>
        <p className="text-sm text-text-secondary">Estimated restoration</p>
        <p className="text-lg font-semibold text-text">{outage?.estimatedRestoration ?? '—'}</p>
        <p className="text-sm text-text-secondary">Location: {outage?.area ?? 'Your area'}</p>
      </div>

      <p className="mt-6 text-center text-base text-text">
        You don't need to troubleshoot your router right now.
      </p>

      <div className="mt-auto space-y-3 pt-4">
        <button
          type="button"
          className="flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-6 text-base font-semibold text-white transition-colors duration-200 hover:bg-primary-dark"
        >
          View Outage Details
        </button>
        <button
          type="button"
          onClick={handleTroubleshootAnyway}
          className="flex min-h-11 w-full items-center justify-center rounded-lg border border-border bg-transparent px-6 text-base font-semibold text-primary transition-colors duration-200 hover:bg-slate-50"
        >
          Try Troubleshooting Anyway
        </button>
      </div>
    </CustomerLayout>
  )
}
