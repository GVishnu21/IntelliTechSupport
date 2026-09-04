import type { LedReading } from '../../types'
import { LedStatus } from './LedStatus'

export function LedStatusList({ lights }: { lights: LedReading[] }) {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-bold text-text">Indicator Lights</h3>
      <div className="space-y-2">
        {lights.map((light) => (
          <LedStatus key={light.name} light={light} />
        ))}
      </div>
    </div>
  )
}
