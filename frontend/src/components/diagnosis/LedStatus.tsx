import type { LedReading } from '../../types'
import { ledSemanticStatus, ledStatusLabel } from '../../utils/led'

const DOT_COLOR: Record<LedReading['color'], string> = {
  green: 'bg-success',
  red: 'bg-error',
  amber: 'bg-warning',
  gray: 'bg-slate-300',
}

export function LedStatus({ light }: { light: LedReading }) {
  const status = ledSemanticStatus(light.color, light.state)
  const colorLabel = light.color.charAt(0).toUpperCase() + light.color.slice(1)

  return (
    <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
      <span className="text-base font-medium text-text">{light.name}</span>
      <span className="flex items-center gap-2 text-sm text-text-secondary">
        <span className={`h-3 w-3 rounded-full ${DOT_COLOR[light.color]}`} aria-hidden="true" />
        {colorLabel} — {ledStatusLabel(status)}
        {light.state === 'blinking' && ' (Blinking)'}
      </span>
    </div>
  )
}
