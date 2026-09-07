import { describe, expect, it } from 'vitest'
import { MOCK_OUTAGE, MOCK_REPEAT_CONTACT_RATE, ROUTER_CATALOG } from './mockData'

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

describe('MOCK_REPEAT_CONTACT_RATE', () => {
  it('is a plausible rate between 0 and 1', () => {
    expect(MOCK_REPEAT_CONTACT_RATE).toBeGreaterThanOrEqual(0)
    expect(MOCK_REPEAT_CONTACT_RATE).toBeLessThanOrEqual(1)
  })
})
