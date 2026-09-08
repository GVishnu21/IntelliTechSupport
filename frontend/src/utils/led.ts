import type { LedColor, LedReading, LedSemanticStatus, LedState } from '../types'

const KNOWN_COLORS: LedColor[] = ['green', 'red', 'amber', 'gray']

// Single source of truth for the dot color used everywhere a light reading
// is rendered (LedStatus, and the manual-selection light picker) -- so a
// palette change only ever needs to happen in one place.
export const LED_DOT_COLOR_CLASS: Record<LedColor, string> = {
  green: 'bg-success',
  red: 'bg-error',
  amber: 'bg-warning',
  gray: 'bg-slate-300 dark:bg-slate-600',
}

export function parseLedString(raw: string): { color: LedColor; state: LedState } {
  if (!raw || raw === 'off') {
    return { color: 'gray', state: 'off' }
  }
  const [statePart, colorPart] = raw.split('_')
  const state: LedState = statePart === 'blinking' ? 'blinking' : 'solid'
  const color: LedColor = (KNOWN_COLORS as string[]).includes(colorPart)
    ? (colorPart as LedColor)
    : 'gray'
  return { color, state }
}

export function ledSemanticStatus(color: LedColor, state: LedState): LedSemanticStatus {
  if (color === 'gray' || state === 'off') return 'unknown'
  if (color === 'green') return 'normal'
  if (color === 'amber') return 'attention'
  return 'problem'
}

export function ledStatusLabel(status: LedSemanticStatus): string {
  switch (status) {
    case 'normal':
      return 'Normal'
    case 'problem':
      return 'Problem'
    case 'attention':
      return 'Attention'
    default:
      return 'Unknown'
  }
}

const LIGHT_DISPLAY_NAMES: Record<string, string> = {
  power: 'Power',
  online: 'Internet',
  internet: 'Internet',
  downstream: 'Signal',
  wifi: 'Wi-Fi',
  los: 'LOS',
  lan: 'LAN',
  security: 'Security',
  other: 'Other',
}

export function ledDisplayName(key: string): string {
  const known = LIGHT_DISPLAY_NAMES[key.toLowerCase()]
  if (known) return known
  return key.charAt(0).toUpperCase() + key.slice(1)
}

export function parseLedReadings(statusLights: Record<string, string>): LedReading[] {
  return Object.entries(statusLights).map(([key, raw]) => {
    const { color, state } = parseLedString(raw)
    return { name: ledDisplayName(key), color, state }
  })
}
