import { describe, expect, it } from 'vitest'
import { MOCK_ANALYTICS, MOCK_OUTAGE, ROUTER_CATALOG } from './mockData'

describe('ROUTER_CATALOG', () => {
  it('has unique ids', () => {
    const ids = ROUTER_CATALOG.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every entry has provider, brand, and model', () => {
    for (const entry of ROUTER_CATALOG) {
      expect(entry.provider).toBeTruthy()
      expect(entry.brand).toBeTruthy()
      expect(entry.model).toBeTruthy()
    }
  })
})

describe('MOCK_OUTAGE', () => {
  it('has a restoration estimate and area', () => {
    expect(MOCK_OUTAGE.estimatedRestoration).toBeTruthy()
    expect(MOCK_OUTAGE.area).toBeTruthy()
  })
})

describe('MOCK_ANALYTICS', () => {
  it('rates are between 0 and 1', () => {
    expect(MOCK_ANALYTICS.resolutionRate).toBeGreaterThanOrEqual(0)
    expect(MOCK_ANALYTICS.resolutionRate).toBeLessThanOrEqual(1)
    expect(MOCK_ANALYTICS.escalationRate).toBeGreaterThanOrEqual(0)
    expect(MOCK_ANALYTICS.escalationRate).toBeLessThanOrEqual(1)
  })

  it('has 90 days of trend data for the date-range filter to slice into', () => {
    expect(MOCK_ANALYTICS.resolutionTrend).toHaveLength(90)
    expect(MOCK_ANALYTICS.escalationTrend).toHaveLength(90)
  })

  it('trend values stay within 0 and 1', () => {
    for (const point of [...MOCK_ANALYTICS.resolutionTrend, ...MOCK_ANALYTICS.escalationTrend]) {
      expect(point.value).toBeGreaterThanOrEqual(0)
      expect(point.value).toBeLessThanOrEqual(1)
    }
  })

  it('trend dates are in chronological order ending at the anchor date', () => {
    const dates = MOCK_ANALYTICS.resolutionTrend.map((p) => p.date)
    const sorted = [...dates].sort()
    expect(dates).toEqual(sorted)
    expect(dates[dates.length - 1]).toBe('2026-09-04')
  })

  it('has non-empty breakdown lists', () => {
    expect(MOCK_ANALYTICS.commonIssues.length).toBeGreaterThan(0)
    expect(MOCK_ANALYTICS.commonRouterModels.length).toBeGreaterThan(0)
    expect(MOCK_ANALYTICS.commonLedPatterns.length).toBeGreaterThan(0)
    expect(MOCK_ANALYTICS.topTroubleshootingSteps.length).toBeGreaterThan(0)
  })
})
