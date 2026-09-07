import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearActiveSession, loadActiveSession, saveActiveSession } from './sessionContinuity'
import type { TroubleshootingStep } from '../types'

const step: TroubleshootingStep = {
  stepNumber: 1,
  totalSteps: 3,
  title: 'Step 1',
  description: 'Restart your router.',
  checklist: [],
}

beforeEach(() => {
  localStorage.clear()
})

describe('sessionContinuity', () => {
  it('returns null when nothing has been saved', () => {
    expect(loadActiveSession()).toBeNull()
  })

  it('round-trips a saved session', () => {
    saveActiveSession({ sessionId: 'session-1', step, issue: 'Fiber signal problem', stepsCompleted: 2 })
    expect(loadActiveSession()).toEqual({
      sessionId: 'session-1',
      step,
      issue: 'Fiber signal problem',
      stepsCompleted: 2,
    })
  })

  it('round-trips the optional scanId', () => {
    saveActiveSession({ sessionId: 'session-1', scanId: 'scan-1', step, stepsCompleted: 0 })
    expect(loadActiveSession()?.scanId).toBe('scan-1')
  })

  it('clears the saved session', () => {
    saveActiveSession({ sessionId: 'session-1', step, stepsCompleted: 0 })
    clearActiveSession()
    expect(loadActiveSession()).toBeNull()
  })

  it('returns null instead of throwing on corrupted stored data', () => {
    localStorage.setItem('intelli-techsupport:activeSession', 'not valid json')
    expect(loadActiveSession()).toBeNull()
  })

  it('does not throw when localStorage.setItem fails', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded')
    })
    expect(() => saveActiveSession({ sessionId: 'session-1', step, stepsCompleted: 0 })).not.toThrow()
    spy.mockRestore()
  })
})
