import { describe, expect, it } from 'vitest'
import { ledDisplayName, ledSemanticStatus, ledStatusLabel, parseLedReadings, parseLedString } from './led'

describe('parseLedString', () => {
  it('parses solid_green', () => {
    expect(parseLedString('solid_green')).toEqual({ color: 'green', state: 'solid' })
  })

  it('parses blinking_red', () => {
    expect(parseLedString('blinking_red')).toEqual({ color: 'red', state: 'blinking' })
  })

  it('treats "off" as gray/off', () => {
    expect(parseLedString('off')).toEqual({ color: 'gray', state: 'off' })
  })

  it('falls back to gray for an unrecognized color', () => {
    expect(parseLedString('solid_purple')).toEqual({ color: 'gray', state: 'solid' })
  })
})

describe('ledSemanticStatus', () => {
  it('green is normal', () => {
    expect(ledSemanticStatus('green', 'solid')).toBe('normal')
  })

  it('red is problem', () => {
    expect(ledSemanticStatus('red', 'blinking')).toBe('problem')
  })

  it('amber is attention', () => {
    expect(ledSemanticStatus('amber', 'blinking')).toBe('attention')
  })

  it('gray or off is unknown', () => {
    expect(ledSemanticStatus('gray', 'off')).toBe('unknown')
    expect(ledSemanticStatus('green', 'off')).toBe('unknown')
  })
})

describe('ledStatusLabel', () => {
  it('labels every semantic status', () => {
    expect(ledStatusLabel('normal')).toBe('Normal')
    expect(ledStatusLabel('problem')).toBe('Problem')
    expect(ledStatusLabel('attention')).toBe('Attention')
    expect(ledStatusLabel('unknown')).toBe('Unknown')
  })
})

describe('ledDisplayName', () => {
  it('maps known backend light keys to friendly names', () => {
    expect(ledDisplayName('power')).toBe('Power')
    expect(ledDisplayName('internet')).toBe('Internet')
    expect(ledDisplayName('online')).toBe('Internet')
    expect(ledDisplayName('wifi')).toBe('Wi-Fi')
  })

  it('capitalizes unknown keys as a fallback', () => {
    expect(ledDisplayName('downstream')).toBe('Signal')
    expect(ledDisplayName('mystery')).toBe('Mystery')
  })
})

describe('parseLedReadings', () => {
  it('converts a backend status_lights map into LedReading[]', () => {
    const result = parseLedReadings({ power: 'solid_green', internet: 'blinking_red' })
    expect(result).toEqual([
      { name: 'Power', color: 'green', state: 'solid' },
      { name: 'Internet', color: 'red', state: 'blinking' },
    ])
  })
})
