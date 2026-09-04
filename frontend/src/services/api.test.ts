import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  analyzeRouter,
  checkOutage,
  escalate,
  getAnalytics,
  getRouterCatalog,
  getTicket,
  getTickets,
  verifyStepWithPhoto,
} from './api'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('analyzeRouter', () => {
  it('maps a real backend diagnosis response into RouterDiagnosis', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        session_id: 'abc-123',
        equipment: 'Netgear Nighthawk R7000',
        confidence: 0.92,
        status_lights: { power: 'solid_green', internet: 'blinking_red', wifi: 'solid_green' },
        next_step: { instruction: 'Restart your router.', step_number: 1 },
        low_confidence: false,
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await analyzeRouter('base64-image-data')

    expect(fetchMock).toHaveBeenCalledWith('/api/diagnose', expect.objectContaining({ method: 'POST' }))
    expect(result.sessionId).toBe('abc-123')
    expect(result.manufacturer).toBe('Netgear')
    expect(result.model).toBe('Nighthawk R7000')
    expect(result.confidence).toBe('high')
    expect(result.lowConfidence).toBe(false)
    expect(result.issue).toBe("We're not receiving an internet signal.")
    expect(result.lights).toEqual([
      { name: 'Power', color: 'green', state: 'solid' },
      { name: 'Internet', color: 'red', state: 'blinking' },
      { name: 'Wi-Fi', color: 'green', state: 'solid' },
    ])
    expect(result.firstStep).toEqual({
      stepNumber: 1,
      totalSteps: 3,
      title: 'Step 1',
      description: 'Restart your router.',
      checklist: [],
    })
  })

  it('buckets a low confidence score as low and handles unknown equipment', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          session_id: 'x',
          equipment: 'unknown',
          confidence: 0.1,
          status_lights: {},
          next_step: null,
          low_confidence: true,
        }),
      })
    )

    const result = await analyzeRouter('img')
    expect(result.confidence).toBe('low')
    expect(result.manufacturer).toBe('Unknown')
    expect(result.lowConfidence).toBe(true)
    expect(result.firstStep).toBeNull()
  })

  it('throws when the backend responds with an error status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    await expect(analyzeRouter('img')).rejects.toThrow('Request failed: 500')
  })
})

describe('verifyStepWithPhoto', () => {
  it('maps a resolved verify-step response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          resolved: true,
          escalate: false,
          next_step: null,
          status_lights: { internet: 'solid_green' },
        }),
      })
    )

    const result = await verifyStepWithPhoto('session-1', 'img')
    expect(result).toEqual({ resolved: true, escalate: false, nextStep: null })
  })

  it('maps a next-step verify-step response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          resolved: false,
          escalate: false,
          next_step: { instruction: 'Check the cable.', step_number: 2 },
          status_lights: {},
        }),
      })
    )

    const result = await verifyStepWithPhoto('session-1', 'img')
    expect(result.resolved).toBe(false)
    expect(result.nextStep).toEqual({
      stepNumber: 2,
      totalSteps: 3,
      title: 'Step 2',
      description: 'Check the cable.',
      checklist: [],
    })
  })
})

describe('escalate', () => {
  it('returns a ticketId from the real backend', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ticket_id: 'TS-9001' }) }))
    const result = await escalate('session-1')
    expect(result).toEqual({ ticketId: 'TS-9001' })
  })
})

describe('mock-backed functions', () => {
  it('checkOutage resolves the mock outage', async () => {
    const outage = await checkOutage()
    expect(outage.area).toBe('Your area')
  })

  it('getRouterCatalog returns a non-empty catalog', () => {
    expect(getRouterCatalog().length).toBeGreaterThan(0)
  })

  it('getTickets resolves the mock ticket list', async () => {
    const tickets = await getTickets()
    expect(tickets.length).toBeGreaterThan(0)
  })

  it('getTicket finds a ticket by id and returns undefined for unknown ids', async () => {
    const tickets = await getTickets()
    const found = await getTicket(tickets[0].id)
    expect(found?.id).toBe(tickets[0].id)
    expect(await getTicket('does-not-exist')).toBeUndefined()
  })

  it('getAnalytics resolves the mock analytics summary', async () => {
    const analytics = await getAnalytics()
    expect(analytics.totalScans).toBeGreaterThan(0)
  })
})
