import { describe, expect, it } from 'vitest'
import {
  deriveCommonIssues,
  deriveCommonLedPatterns,
  deriveCommonRouterModels,
  deriveEscalationCountTrend,
} from './ticketStats'
import type { SupportTicket } from '../types'

function makeTicket(overrides: Partial<SupportTicket>): SupportTicket {
  return {
    id: 'ITS-1',
    customer: 'Anonymous customer',
    issue: "We're not receiving an internet signal.",
    router: 'Netgear Nighthawk R7000',
    status: 'escalated',
    createdAt: '2026-09-05T10:00:00Z',
    ledStatus: [{ name: 'Internet', color: 'red', state: 'blinking' }],
    history: [],
    aiDiagnosis: "We're not receiving an internet signal.",
    ...overrides,
  }
}

describe('deriveCommonIssues', () => {
  it('counts and sorts by frequency descending', () => {
    const tickets = [
      makeTicket({ issue: 'A' }),
      makeTicket({ issue: 'B' }),
      makeTicket({ issue: 'A' }),
    ]
    expect(deriveCommonIssues(tickets)).toEqual([
      { label: 'A', count: 2 },
      { label: 'B', count: 1 },
    ])
  })

  it('returns an empty array for no tickets', () => {
    expect(deriveCommonIssues([])).toEqual([])
  })
})

describe('deriveCommonRouterModels', () => {
  it('counts by router', () => {
    const tickets = [makeTicket({ router: 'unknown' }), makeTicket({ router: 'unknown' })]
    expect(deriveCommonRouterModels(tickets)).toEqual([{ label: 'unknown', count: 2 }])
  })
})

describe('deriveCommonLedPatterns', () => {
  it('describes the fault light by name/state/color', () => {
    const tickets = [makeTicket({ ledStatus: [{ name: 'Internet', color: 'red', state: 'blinking' }] })]
    expect(deriveCommonLedPatterns(tickets)).toEqual([{ label: 'Internet — Blinking Red', count: 1 }])
  })

  it('falls back when no light is in a fault color', () => {
    const tickets = [makeTicket({ ledStatus: [{ name: 'Power', color: 'green', state: 'solid' }] })]
    expect(deriveCommonLedPatterns(tickets)).toEqual([{ label: 'No fault light detected', count: 1 }])
  })
})

describe('deriveEscalationCountTrend', () => {
  it('buckets tickets by date and sorts chronologically', () => {
    const tickets = [
      makeTicket({ createdAt: '2026-09-05T10:00:00Z' }),
      makeTicket({ createdAt: '2026-09-03T08:00:00Z' }),
      makeTicket({ createdAt: '2026-09-05T22:00:00Z' }),
    ]
    expect(deriveEscalationCountTrend(tickets)).toEqual([
      { date: '2026-09-03', value: 1 },
      { date: '2026-09-05', value: 2 },
    ])
  })

  it('returns an empty array for no tickets', () => {
    expect(deriveEscalationCountTrend([])).toEqual([])
  })
})
