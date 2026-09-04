import type { RouterDiagnosis } from '../../types'
import { RouterImage } from './RouterImage'
import { LedStatusList } from './LedStatusList'

const CONFIDENCE_LABEL: Record<RouterDiagnosis['confidence'], string> = {
  high: 'High confidence',
  medium: 'Some uncertainty',
  low: 'Low confidence',
}

export function DiagnosisCard({ diagnosis }: { diagnosis: RouterDiagnosis }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <RouterImage alt={`${diagnosis.manufacturer} ${diagnosis.model}`} />
        <div>
          <p className="text-lg font-bold text-text">{diagnosis.manufacturer}</p>
          <p className="text-base text-text-secondary">{diagnosis.model}</p>
          <p className="mt-1 text-sm text-text-secondary">{CONFIDENCE_LABEL[diagnosis.confidence]}</p>
        </div>
      </div>

      <LedStatusList lights={diagnosis.lights} />

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h3 className="text-lg font-bold text-text">Possible issue</h3>
        <p className="mt-1 text-base text-text">{diagnosis.issue}</p>
        <p className="mt-2 text-sm text-text-secondary">We'll guide you through a few quick checks.</p>
      </div>
    </div>
  )
}
