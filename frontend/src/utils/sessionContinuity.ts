import type { TroubleshootingStep } from '../types'

const STORAGE_KEY = 'intelli-techsupport:activeSession'

export interface PersistedSession {
  sessionId: string
  scanId?: string
  step: TroubleshootingStep
  issue?: string
  stepsCompleted: number
}

// localStorage can throw in private browsing or when storage is full/disabled
// -- continuing without persistence is an acceptable degradation, not a
// reason to crash the troubleshooting flow.

export function saveActiveSession(session: PersistedSession): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch {
    // ignore
  }
}

export function loadActiveSession(): PersistedSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PersistedSession
  } catch {
    return null
  }
}

export function clearActiveSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
