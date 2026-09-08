import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CustomerLayout } from '../components/layout/CustomerLayout'
import { ErrorState } from '../components/ui/ErrorState'
import { selectEquipment } from '../services/api'
import { LED_DOT_COLOR_CLASS, parseLedString } from '../utils/led'
import type { RouterCatalogEntry } from '../types'

interface SelectLightLocationState {
  entry?: RouterCatalogEntry
}

// Every current backend SKU's one checked light (playbooks.py's
// fault_light -- "online" or "internet") displays as "Internet" per
// utils/led.ts's ledDisplayName. If a future SKU checks a different light,
// this question needs to ask about that light by name instead.
const LIGHT_NAME = 'Internet'

const LIGHT_STATE_OPTIONS: { value: string; label: string }[] = [
  { value: 'solid_green', label: 'Solid green' },
  { value: 'blinking_amber', label: 'Blinking amber' },
  { value: 'blinking_red', label: 'Blinking red' },
  { value: 'solid_red', label: 'Solid red' },
  { value: 'off', label: "Off — not lit at all" },
]

export default function SelectLight() {
  const navigate = useNavigate()
  const location = useLocation()
  const { entry } = (location.state as SelectLightLocationState) ?? {}

  const [submittingValue, setSubmittingValue] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!entry) {
      navigate('/select-router', { replace: true })
    }
  }, [entry, navigate])

  if (!entry) {
    return null
  }

  async function handleSelect(value: string) {
    setSubmittingValue(value)
    setError(null)
    try {
      const diagnosis = await selectEquipment(entry!.backendEquipment, value)
      navigate('/diagnosis', { replace: true, state: { diagnosis } })
    } catch {
      setError("We're having trouble connecting. Check your connection and try again.")
      setSubmittingValue(null)
    }
  }

  return (
    <CustomerLayout title="Check the light" showBack>
      <div className="flex flex-1 flex-col gap-4">
        <p className="text-sm text-text-secondary">
          {entry.brand} {entry.model}
        </p>
        <h2 className="text-[22px] font-bold leading-7 text-text">
          What does the {LIGHT_NAME} light look like?
        </h2>

        <div className="space-y-2">
          {LIGHT_STATE_OPTIONS.map((option) => {
            const { color, state } = parseLedString(option.value)
            const busy = submittingValue === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                disabled={submittingValue !== null}
                className="flex min-h-11 w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
              >
                <span className={`h-4 w-4 shrink-0 rounded-full ${LED_DOT_COLOR_CLASS[color]}`} aria-hidden="true" />
                <span className="text-base font-medium text-text">
                  {busy ? 'Checking…' : option.label}
                  {state === 'blinking' && !busy && ' (Blinking)'}
                </span>
              </button>
            )
          })}
        </div>

        {error && <ErrorState title={error} inline />}
      </div>
    </CustomerLayout>
  )
}
