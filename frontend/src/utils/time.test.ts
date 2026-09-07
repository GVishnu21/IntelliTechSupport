import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { formatRelativeTime } from './time'

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-08T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "Just now" for under a minute', () => {
    expect(formatRelativeTime('2026-09-08T11:59:45Z')).toBe('Just now')
  })

  it('returns minutes for under an hour', () => {
    expect(formatRelativeTime('2026-09-08T11:45:00Z')).toBe('15 min ago')
  })

  it('returns hours for under a day', () => {
    expect(formatRelativeTime('2026-09-08T09:00:00Z')).toBe('3h ago')
  })

  it('returns days for a day or more', () => {
    expect(formatRelativeTime('2026-09-05T12:00:00Z')).toBe('3d ago')
  })
})
