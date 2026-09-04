import { describe, expect, it } from 'vitest'
import { MOCK_ANALYTICS, MOCK_OUTAGE, MOCK_TICKETS, ROUTER_CATALOG } from './mockData'

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

describe('MOCK_TICKETS', () => {
  const validStatuses = new Set(['open', 'in_progress', 'resolved', 'escalated'])

  it('every ticket has a valid status', () => {
    for (const ticket of MOCK_TICKETS) {
      expect(validStatuses.has(ticket.status)).toBe(true)
    }
  })

  it('every ticket has a non-empty history', () => {
    for (const ticket of MOCK_TICKETS) {
      expect(ticket.history.length).toBeGreaterThan(0)
    }
  })
})

describe('MOCK_ANALYTICS', () => {
  it('rates are between 0 and 1', () => {
    expect(MOCK_ANALYTICS.resolutionRate).toBeGreaterThanOrEqual(0)
    expect(MOCK_ANALYTICS.resolutionRate).toBeLessThanOrEqual(1)
    expect(MOCK_ANALYTICS.escalationRate).toBeGreaterThanOrEqual(0)
    expect(MOCK_ANALYTICS.escalationRate).toBeLessThanOrEqual(1)
  })

  it('has non-empty trend series', () => {
    expect(MOCK_ANALYTICS.resolutionTrend.length).toBeGreaterThan(0)
    expect(MOCK_ANALYTICS.escalationTrend.length).toBeGreaterThan(0)
  })
})
