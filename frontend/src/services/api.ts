import type {
  AnalyticsSummary,
  DetectionConfidence,
  OutageInfo,
  RouterCatalogEntry,
  RouterDiagnosis,
  SupportTicket,
  TroubleshootingStep,
  VerifyResult,
} from '../types'
import { parseLedReadings } from '../utils/led'
import { MOCK_ANALYTICS, MOCK_OUTAGE, MOCK_TICKETS, ROUTER_CATALOG, mockDiagnosisForRouter } from '../data/mockData'

interface BackendStepInfo {
  instruction: string
  step_number: number
}

interface BackendDiagnosisResponse {
  session_id: string
  equipment: string
  confidence: number
  status_lights: Record<string, string>
  next_step: BackendStepInfo | null
  low_confidence: boolean
}

interface BackendVerifyStepResponse {
  resolved: boolean
  escalate: boolean
  next_step: BackendStepInfo | null
  status_lights: Record<string, string>
}

function toConfidenceLevel(value: number): DetectionConfidence {
  if (value >= 0.75) return 'high'
  if (value >= 0.4) return 'medium'
  return 'low'
}

function splitEquipmentName(equipment: string): { manufacturer: string; model: string } {
  if (equipment === 'unknown') {
    return { manufacturer: 'Unknown', model: 'Router' }
  }
  if (equipment === 'Generic Router/Modem') {
    return { manufacturer: 'Unknown', model: equipment }
  }
  const [manufacturer, ...rest] = equipment.split(' ')
  return { manufacturer, model: rest.join(' ') || equipment }
}

const FAULT_ISSUE_MESSAGES: Record<string, string> = {
  internet: "We're not receiving an internet signal.",
  online: "We're not receiving a signal from your provider.",
  downstream: "We're not receiving a signal from your provider.",
  wifi: 'Your Wi-Fi is currently off.',
  power: 'Your device is not receiving power.',
}

function deriveIssueMessage(statusLights: Record<string, string>): string {
  for (const [light, raw] of Object.entries(statusLights)) {
    if (raw !== 'solid_green') {
      return FAULT_ISSUE_MESSAGES[light] ?? 'We found an issue with your equipment.'
    }
  }
  return "We're not receiving a fiber signal."
}

function toStep(step: BackendStepInfo | null): TroubleshootingStep | null {
  if (!step) return null
  // The backend never reports a total step count for the session, only the
  // current step number. Every playbook in backend/app/orchestration/playbooks.py
  // currently has 3 steps, so use that as a reasonable displayed denominator
  // rather than blocking the UI on a backend change.
  return {
    stepNumber: step.step_number,
    totalSteps: Math.max(step.step_number, 3),
    title: `Step ${step.step_number}`,
    description: step.instruction,
    checklist: [],
  }
}

function toDiagnosis(res: BackendDiagnosisResponse): RouterDiagnosis {
  const { manufacturer, model } = splitEquipmentName(res.equipment)
  return {
    sessionId: res.session_id,
    manufacturer,
    model,
    confidence: toConfidenceLevel(res.confidence),
    issue: deriveIssueMessage(res.status_lights),
    lowConfidence: res.low_confidence,
    lights: parseLedReadings(res.status_lights),
    firstStep: toStep(res.next_step),
  }
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export async function analyzeRouter(imageBase64: string): Promise<RouterDiagnosis> {
  const res = await postJson<BackendDiagnosisResponse>('/diagnose', { image_base64: imageBase64 })
  return toDiagnosis(res)
}

export async function verifyStepWithPhoto(sessionId: string, imageBase64: string): Promise<VerifyResult> {
  const res = await postJson<BackendVerifyStepResponse>('/verify-step', {
    image_base64: imageBase64,
    session_id: sessionId,
  })
  return {
    resolved: res.resolved,
    escalate: res.escalate,
    nextStep: toStep(res.next_step),
  }
}

export async function escalate(sessionId: string): Promise<{ ticketId: string }> {
  const res = await postJson<{ ticket_id: string }>('/escalate', { session_id: sessionId })
  return { ticketId: res.ticket_id }
}

// No backend support for outages, the router catalog, or the admin surface
// yet — the following are all mock-backed.

export async function checkOutage(): Promise<OutageInfo> {
  return MOCK_OUTAGE
}

export function getRouterCatalog(): RouterCatalogEntry[] {
  return ROUTER_CATALOG
}

export function getMockDiagnosis(entry: RouterCatalogEntry): RouterDiagnosis {
  return mockDiagnosisForRouter(entry)
}

export async function getTickets(): Promise<SupportTicket[]> {
  return MOCK_TICKETS
}

export async function getTicket(id: string): Promise<SupportTicket | undefined> {
  return MOCK_TICKETS.find((ticket) => ticket.id === id)
}

export async function getAnalytics(): Promise<AnalyticsSummary> {
  return MOCK_ANALYTICS
}
