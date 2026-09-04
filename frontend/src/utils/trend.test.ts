import { describe, expect, it } from 'vitest'
import { filterTrend } from './trend'
import type { TrendPoint } from '../types'

const trend: TrendPoint[] = Array.from({ length: 10 }, (_, i) => ({
  date: `2026-08-${String(i + 1).padStart(2, '0')}`,
  value: i / 10,
}))

describe('filterTrend', () => {
  it('returns the last 7 points for "7d"', () => {
    const result = filterTrend(trend, '7d', '', '')
    expect(result).toHaveLength(7)
    expect(result[0].date).toBe('2026-08-04')
  })

  it('returns everything for "90d" when fewer than 90 points exist', () => {
    expect(filterTrend(trend, '90d', '', '')).toHaveLength(10)
  })

  it('filters by inclusive custom date range', () => {
    const result = filterTrend(trend, 'custom', '2026-08-03', '2026-08-05')
    expect(result.map((p) => p.date)).toEqual(['2026-08-03', '2026-08-04', '2026-08-05'])
  })

  it('falls back to the full trend when custom dates are incomplete', () => {
    expect(filterTrend(trend, 'custom', '', '')).toHaveLength(10)
  })
})
