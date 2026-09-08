import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchNotifications, getNotificationsLastSeen, setNotificationsLastSeen } from './notifications'

function mockFetch(ticketsBody: unknown, feedbackBody: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      const body = url.includes('/feedback/recent') ? feedbackBody : ticketsBody
      return Promise.resolve({ ok: true, json: async () => body })
    })
  )
}

describe('notifications last-seen tracking', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('has no last-seen timestamp before anything is recorded', () => {
    expect(getNotificationsLastSeen()).toBeNull()
  })

  it('stores and retrieves the last-seen timestamp', () => {
    setNotificationsLastSeen('2026-09-08T10:00:00Z')
    expect(getNotificationsLastSeen()).toBe('2026-09-08T10:00:00Z')
  })
})

describe('fetchNotifications', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('maps tickets and feedback into a single list sorted by recency', async () => {
    mockFetch(
      [
        {
          id: 'ITS-1',
          session_id: null,
          equipment: 'unknown',
          status: 'escalated',
          status_lights: {},
          history: [],
          contact_phone: null,
          created_at: '2026-09-08T09:00:00Z',
        },
      ],
      [
        {
          id: 'scan-1',
          session_id: 'session-1',
          equipment: 'Arris SB8200',
          outcome: 'resolved',
          rating: 5,
          feedback: 'Great experience',
          created_at: '2026-09-08T10:00:00Z',
        },
      ]
    )

    const result = await fetchNotifications()

    expect(result).toHaveLength(2)
    // Feedback is newer (10:00 vs 09:00), so it sorts first.
    expect(result[0].type).toBe('feedback')
    expect(result[0].description).toContain('Great experience')
    expect(result[0].href).toBe('/admin/feedback/scan-1')
    expect(result[1].type).toBe('ticket')
    expect(result[1].href).toBe('/admin/tickets/ITS-1')
  })

  it('falls back to a rating-only description when there is no written comment', async () => {
    mockFetch(
      [],
      [
        {
          id: 'scan-1',
          session_id: 'session-1',
          equipment: 'Arris SB8200',
          outcome: 'resolved',
          rating: 4,
          feedback: null,
          created_at: '2026-09-08T10:00:00Z',
        },
      ]
    )

    const result = await fetchNotifications()

    expect(result[0].description).toBe('4-star rating received for Arris SB8200.')
  })

  it('returns an empty list when there is nothing new', async () => {
    mockFetch([], [])

    expect(await fetchNotifications()).toEqual([])
  })
})
