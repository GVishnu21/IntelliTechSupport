import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  analyzeRouter,
  checkOutage,
  escalate,
  getAnalyticsSummary,
  getRepeatContactRate,
  getRouterCatalog,
  getTicket,
  getTickets,
  selectEquipment,
  skipStep,
  submitScanFeedback,
  updateTicketStatus,
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
        scan_id: 'abc-123',
        equipment: 'Netgear Nighthawk R7000',
        confidence: 0.92,
        status_lights: { power: 'solid_green', internet: 'blinking_red', wifi: 'solid_green' },
        next_step: { instruction: 'Restart your router.', step_number: 1, total_steps: 3 },
        low_confidence: false,
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await analyzeRouter('base64-image-data')

    expect(fetchMock).toHaveBeenCalledWith('/api/diagnose', expect.objectContaining({ method: 'POST' }))
    expect(result.sessionId).toBe('abc-123')
    expect(result.scanId).toBe('abc-123')
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
          session_id: '',
          scan_id: 'scan-only-id',
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
    expect(result.scanId).toBe('scan-only-id')
  })

  it('throws when the backend responds with an error status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    await expect(analyzeRouter('img')).rejects.toThrow('Request failed: 500')
  })
})

describe('selectEquipment', () => {
  it('posts the equipment and light state, and maps the response like analyzeRouter', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        session_id: 'manual-session-1',
        scan_id: 'manual-session-1',
        equipment: 'Generic Router/Modem',
        confidence: 1.0,
        status_lights: { internet: 'blinking_red' },
        next_step: { instruction: 'Power cycle the device.', step_number: 1, total_steps: 3 },
        low_confidence: false,
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await selectEquipment('Generic Router/Modem', 'blinking_red')

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/select-equipment',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ equipment: 'Generic Router/Modem', fault_light_state: 'blinking_red' }),
      })
    )
    expect(result.sessionId).toBe('manual-session-1')
    expect(result.scanId).toBe('manual-session-1')
    expect(result.firstStep?.description).toBe('Power cycle the device.')
  })

  it('throws when the backend rejects the equipment or light state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 400 }))
    await expect(selectEquipment('Not A Real Router', 'off')).rejects.toThrow('Request failed: 400')
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
          next_step: { instruction: 'Check the cable.', step_number: 2, total_steps: 3 },
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

  it('reports the real total step count from the backend, not an assumed one', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          resolved: false,
          escalate: false,
          next_step: { instruction: 'Check the cable.', step_number: 2, total_steps: 5 },
          status_lights: {},
        }),
      })
    )

    const result = await verifyStepWithPhoto('session-1', 'img')
    expect(result.nextStep?.totalSteps).toBe(5)
  })

  it('passes through checklist and note when the backend provides them', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          resolved: false,
          escalate: false,
          next_step: {
            instruction: 'Check the cable.',
            step_number: 2,
            total_steps: 3,
            checklist: ['Cable is connected to the correct port', 'Cable is firmly connected'],
            note: "Don't bend the fiber cable sharply.",
          },
          status_lights: {},
        }),
      })
    )

    const result = await verifyStepWithPhoto('session-1', 'img')
    expect(result.nextStep?.checklist).toEqual([
      'Cable is connected to the correct port',
      'Cable is firmly connected',
    ])
    expect(result.nextStep?.note).toBe("Don't bend the fiber cable sharply.")
  })
})

describe('escalate', () => {
  it('returns a ticketId from the real backend', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ticket_id: 'TS-9001' }) }))
    const result = await escalate('session-1')
    expect(result).toEqual({ ticketId: 'TS-9001' })
  })

  it('sends a null contact_phone when none was given', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ticket_id: 'TS-9001' }) })
    vi.stubGlobal('fetch', fetchMock)

    await escalate('session-1')

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/escalate',
      expect.objectContaining({
        body: JSON.stringify({ session_id: 'session-1', contact_phone: null, phone_verified_token: null }),
      })
    )
  })

  it('sends the callback number when the customer provided one', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ticket_id: 'TS-9001' }) })
    vi.stubGlobal('fetch', fetchMock)

    await escalate('session-1', '555-0100')

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/escalate',
      expect.objectContaining({
        body: JSON.stringify({ session_id: 'session-1', contact_phone: '555-0100', phone_verified_token: null }),
      })
    )
  })

  it('sends the verified token when the customer confirmed their number', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ticket_id: 'TS-9001' }) })
    vi.stubGlobal('fetch', fetchMock)

    await escalate('session-1', '555-0100', 'tok-abc')

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/escalate',
      expect.objectContaining({
        body: JSON.stringify({ session_id: 'session-1', contact_phone: '555-0100', phone_verified_token: 'tok-abc' }),
      })
    )
  })
})

describe('skipStep', () => {
  it('maps an escalate response with no next step', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ escalate: true, next_step: null }) })
    )

    const result = await skipStep('session-1')
    expect(result).toEqual({ escalate: true, nextStep: null })
  })

  it('maps a response that advances to the next step', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        escalate: false,
        next_step: { instruction: 'Check the cable.', step_number: 2, total_steps: 3 },
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await skipStep('session-1')

    expect(fetchMock).toHaveBeenCalledWith('/api/skip-step', expect.objectContaining({ method: 'POST' }))
    expect(result.escalate).toBe(false)
    expect(result.nextStep).toEqual({
      stepNumber: 2,
      totalSteps: 3,
      title: 'Step 2',
      description: 'Check the cable.',
      checklist: [],
    })
  })

  it('throws when the backend responds with an error status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    await expect(skipStep('session-1')).rejects.toThrow('Request failed: 500')
  })
})

describe('getTickets', () => {
  it('maps real backend ticket rows into SupportTicket, with an honest anonymous customer', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: 'ITS-ABCD1234',
            session_id: 'session-1',
            equipment: 'Netgear Nighthawk R7000',
            status: 'escalated',
            status_lights: { power: 'solid_green', internet: 'blinking_red' },
            history: [{ step: 'Restart the router', outcome: 'failed' }],
            contact_phone_verified: false,
            created_at: '2026-09-07T12:00:00Z',
          },
        ],
      })
    )

    const tickets = await getTickets()
    expect(tickets).toEqual([
      {
        id: 'ITS-ABCD1234',
        customer: 'Anonymous customer',
        issue: "We're not receiving an internet signal.",
        router: 'Netgear Nighthawk R7000',
        status: 'escalated',
        createdAt: '2026-09-07T12:00:00Z',
        ledStatus: [
          { name: 'Power', color: 'green', state: 'solid' },
          { name: 'Internet', color: 'red', state: 'blinking' },
        ],
        history: [{ step: 'Restart the router', outcome: 'failed' }],
        aiDiagnosis: "We're not receiving an internet signal.",
        contactPhoneVerified: false,
      },
    ])
  })

  it('throws when the backend responds with an error status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    await expect(getTickets()).rejects.toThrow('Request failed: 500')
  })
})

describe('getTicket', () => {
  it('returns undefined for a 404 (ticket not found) rather than throwing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }))
    expect(await getTicket('does-not-exist')).toBeUndefined()
  })

  it('maps a found ticket', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'ITS-ABCD1234',
          session_id: null,
          equipment: 'unknown',
          status: 'escalated',
          status_lights: {},
          history: [],
          contact_phone_verified: false,
          created_at: '2026-09-07T12:00:00Z',
        }),
      })
    )

    const ticket = await getTicket('ITS-ABCD1234')
    expect(ticket?.router).toBe('Unknown router')
    expect(ticket?.contactPhone).toBeUndefined()
  })

  it('maps a real callback number when the customer provided one', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'ITS-ABCD1234',
          session_id: 'session-1',
          equipment: 'unknown',
          status: 'escalated',
          status_lights: {},
          history: [],
          contact_phone: '555-0100',
          contact_phone_verified: true,
          created_at: '2026-09-07T12:00:00Z',
        }),
      })
    )

    const ticket = await getTicket('ITS-ABCD1234')
    expect(ticket?.contactPhone).toBe('555-0100')
    expect(ticket?.contactPhoneVerified).toBe(true)
  })
})

describe('updateTicketStatus', () => {
  it('sends a PATCH with the new status and maps the updated ticket', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'ITS-ABCD1234',
        session_id: 'session-1',
        equipment: 'Netgear Nighthawk R7000',
        status: 'resolved',
        status_lights: { internet: 'solid_green' },
        history: [],
        created_at: '2026-09-07T12:00:00Z',
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const ticket = await updateTicketStatus('ITS-ABCD1234', 'resolved')

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/tickets/ITS-ABCD1234',
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ status: 'resolved' }) })
    )
    expect(ticket.status).toBe('resolved')
  })

  it('throws when the backend rejects the update', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }))
    await expect(updateTicketStatus('does-not-exist', 'resolved')).rejects.toThrow('Request failed: 404')
  })
})

describe('getAnalyticsSummary', () => {
  it('maps the real backend analytics response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          total_scans: 42,
          resolution_rate: 0.75,
          escalation_rate: 0.25,
          avg_resolution_time: '4m 32s',
          first_contact_resolution: 0.6,
          csat: 4.2,
          resolution_trend: [{ date: '2026-09-07', value: 0.75 }],
          escalation_trend: [{ date: '2026-09-07', value: 0.25 }],
          top_troubleshooting_steps: [{ label: 'Restart the router', count: 10 }],
        }),
      })
    )

    const summary = await getAnalyticsSummary()
    expect(summary).toEqual({
      totalScans: 42,
      resolutionRate: 0.75,
      escalationRate: 0.25,
      avgResolutionTime: '4m 32s',
      firstContactResolution: 0.6,
      csat: 4.2,
      resolutionTrend: [{ date: '2026-09-07', value: 0.75 }],
      escalationTrend: [{ date: '2026-09-07', value: 0.25 }],
      topTroubleshootingSteps: [{ label: 'Restart the router', count: 10 }],
    })
  })

  it('passes through a null csat when no ratings exist yet', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          total_scans: 0,
          resolution_rate: 0,
          escalation_rate: 0,
          avg_resolution_time: '—',
          first_contact_resolution: 0,
          csat: null,
          resolution_trend: [],
          escalation_trend: [],
          top_troubleshooting_steps: [],
        }),
      })
    )

    const summary = await getAnalyticsSummary()
    expect(summary.csat).toBeNull()
  })

  it('throws when the backend responds with an error status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    await expect(getAnalyticsSummary()).rejects.toThrow('Request failed: 500')
  })
})

describe('submitScanFeedback', () => {
  it('posts the rating and feedback', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'ok' }) })
    vi.stubGlobal('fetch', fetchMock)

    await submitScanFeedback('scan-1', 5, 'Great experience')

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/scans/scan-1/feedback',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ rating: 5, feedback: 'Great experience' }),
      })
    )
  })

  it('sends null feedback when none was given', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'ok' }) })
    vi.stubGlobal('fetch', fetchMock)

    await submitScanFeedback('scan-1', 4)

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/scans/scan-1/feedback',
      expect.objectContaining({ body: JSON.stringify({ rating: 4, feedback: null }) })
    )
  })

  it('throws when the backend rejects the feedback', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }))
    await expect(submitScanFeedback('does-not-exist', 5)).rejects.toThrow('Request failed: 404')
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

  it('getRepeatContactRate returns a plausible rate', () => {
    const rate = getRepeatContactRate()
    expect(rate).toBeGreaterThanOrEqual(0)
    expect(rate).toBeLessThanOrEqual(1)
  })
})
