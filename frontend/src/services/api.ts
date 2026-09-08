import type {
  AnalyticsSummary,
  DetectionConfidence,
  FeedbackSummary,
  OutageInfo,
  RecentFeedback,
  RouterCatalogEntry,
  RouterDiagnosis,
  SupportTicket,
  TicketStatus,
  TroubleshootingStep,
  VerifyResult,
} from '../types'
import { parseLedReadings } from '../utils/led'
import { MOCK_OUTAGE, MOCK_REPEAT_CONTACT_RATE, ROUTER_CATALOG } from '../data/mockData'
import { clearAdminToken, getAdminToken } from './adminAuth'

interface BackendStepInfo {
  instruction: string
  step_number: number
  total_steps: number
  checklist?: string[]
  note?: string | null
}

interface BackendDiagnosisResponse {
  session_id: string
  scan_id: string
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

interface BackendTicket {
  id: string
  session_id: string | null
  equipment: string
  status: string
  status_lights: Record<string, string>
  history: Array<{ step: string; outcome: 'completed' | 'failed' | 'skipped' }>
  contact_phone: string | null
  contact_phone_verified: boolean
  created_at: string
}

interface BackendSkipStepResponse {
  escalate: boolean
  next_step: BackendStepInfo | null
}

interface BackendFeedback {
  id: string
  session_id: string | null
  equipment: string
  outcome: string
  rating: number
  feedback: string | null
  created_at: string
}

interface BackendFeedbackSummary {
  total: number
  average_rating: number | null
  five_star_percent: number
  low_rating_count: number
}

function toRecentFeedback(entry: BackendFeedback): RecentFeedback {
  return {
    id: entry.id,
    sessionId: entry.session_id,
    equipment: entry.equipment,
    outcome: entry.outcome,
    rating: entry.rating,
    feedback: entry.feedback,
    createdAt: entry.created_at,
  }
}

interface BackendAnalyticsSummary {
  total_scans: number
  resolution_rate: number
  escalation_rate: number
  avg_resolution_time: string
  first_contact_resolution: number
  csat: number | null
  resolution_trend: Array<{ date: string; value: number }>
  escalation_trend: Array<{ date: string; value: number }>
  top_troubleshooting_steps: Array<{ label: string; count: number }>
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
  return {
    stepNumber: step.step_number,
    totalSteps: step.total_steps,
    title: `Step ${step.step_number}`,
    description: step.instruction,
    checklist: step.checklist ?? [],
    note: step.note ?? undefined,
  }
}

// There's no login, so a real ticket has no actual customer identity to
// show -- "Anonymous customer" is honest about that rather than fabricating
// a fake customer number the way the old mock data did.
function toSupportTicket(raw: BackendTicket): SupportTicket {
  const issue = deriveIssueMessage(raw.status_lights)
  return {
    id: raw.id,
    customer: 'Anonymous customer',
    issue,
    router: raw.equipment === 'unknown' ? 'Unknown router' : raw.equipment,
    status: (raw.status as TicketStatus) || 'escalated',
    createdAt: raw.created_at,
    ledStatus: parseLedReadings(raw.status_lights),
    history: raw.history,
    aiDiagnosis: issue,
    contactPhone: raw.contact_phone ?? undefined,
    contactPhoneVerified: raw.contact_phone_verified,
  }
}

function toAnalyticsSummary(raw: BackendAnalyticsSummary): AnalyticsSummary {
  return {
    totalScans: raw.total_scans,
    resolutionRate: raw.resolution_rate,
    escalationRate: raw.escalation_rate,
    avgResolutionTime: raw.avg_resolution_time,
    firstContactResolution: raw.first_contact_resolution,
    csat: raw.csat,
    resolutionTrend: raw.resolution_trend,
    escalationTrend: raw.escalation_trend,
    topTroubleshootingSteps: raw.top_troubleshooting_steps,
  }
}

function toDiagnosis(res: BackendDiagnosisResponse): RouterDiagnosis {
  const { manufacturer, model } = splitEquipmentName(res.equipment)
  return {
    sessionId: res.session_id,
    scanId: res.scan_id,
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

// Only the admin-facing calls below need this -- everything else in this
// file is the customer flow, which has no login at all. A 401 here means
// the token expired or was never set, so drop it: the admin route guard
// checks getAdminToken() on the next render and sends the user back to
// /admin/login instead of leaving them stuck on a page that 401s forever.
async function adminFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getAdminToken()
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (res.status === 401) {
    clearAdminToken()
  }
  return res
}

export async function analyzeRouter(imageBase64: string): Promise<RouterDiagnosis> {
  const res = await postJson<BackendDiagnosisResponse>('/diagnose', { image_base64: imageBase64 })
  return toDiagnosis(res)
}

// Manual-selection fallback: the customer told us the equipment and what
// its one meaningful light looks like, instead of a photo. Goes through the
// same /select-equipment -> real session/orchestration path as a photo
// would, so everything downstream (Troubleshoot, Verify, Escalate) works
// identically either way.
export async function selectEquipment(equipment: string, faultLightState: string): Promise<RouterDiagnosis> {
  const res = await postJson<BackendDiagnosisResponse>('/select-equipment', {
    equipment,
    fault_light_state: faultLightState,
  })
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

export async function escalate(
  sessionId: string,
  contactPhone?: string,
  phoneVerifiedToken?: string,
): Promise<{ ticketId: string }> {
  const res = await postJson<{ ticket_id: string }>('/escalate', {
    session_id: sessionId,
    contact_phone: contactPhone || null,
    phone_verified_token: phoneVerifiedToken || null,
  })
  return { ticketId: res.ticket_id }
}

// Optional customer identity verification before escalating (PRD IT-5) --
// never blocks the "Contact Support" button itself, just lets a verified
// phone number ride along on the ticket when the customer chooses to confirm it.
export async function sendEscalationOtp(contactPhone: string): Promise<void> {
  await postJson('/escalate/send-otp', { contact_phone: contactPhone })
}

export async function verifyEscalationOtp(contactPhone: string, code: string): Promise<string> {
  const res = await postJson<{ verified_token: string }>('/escalate/verify-otp', {
    contact_phone: contactPhone,
    code,
  })
  return res.verified_token
}

export async function skipStep(sessionId: string): Promise<{ escalate: boolean; nextStep: TroubleshootingStep | null }> {
  const res = await postJson<BackendSkipStepResponse>('/skip-step', { session_id: sessionId })
  return { escalate: res.escalate, nextStep: toStep(res.next_step) }
}

export async function getTickets(): Promise<SupportTicket[]> {
  const res = await adminFetch('/tickets')
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`)
  }
  const raw = (await res.json()) as BackendTicket[]
  return raw.map(toSupportTicket)
}

export async function getTicket(id: string): Promise<SupportTicket | undefined> {
  const res = await adminFetch(`/tickets/${id}`)
  if (res.status === 404) {
    return undefined
  }
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`)
  }
  const raw = (await res.json()) as BackendTicket
  return toSupportTicket(raw)
}

export async function updateTicketStatus(id: string, status: TicketStatus): Promise<SupportTicket> {
  const res = await adminFetch(`/tickets/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`)
  }
  const raw = (await res.json()) as BackendTicket
  return toSupportTicket(raw)
}

export async function submitScanFeedback(scanId: string, rating: number, feedback?: string): Promise<void> {
  const res = await fetch(`/api/scans/${scanId}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating, feedback: feedback || null }),
  })
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`)
  }
}

export async function getRecentFeedback(limit = 20): Promise<RecentFeedback[]> {
  const res = await adminFetch(`/feedback/recent?limit=${limit}`)
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`)
  }
  const raw = (await res.json()) as BackendFeedback[]
  return raw.map(toRecentFeedback)
}

export async function getFeedback(id: string): Promise<RecentFeedback | undefined> {
  const res = await adminFetch(`/feedback/${id}`)
  if (res.status === 404) {
    return undefined
  }
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`)
  }
  const raw = (await res.json()) as BackendFeedback
  return toRecentFeedback(raw)
}

export async function getFeedbackSummary(): Promise<FeedbackSummary> {
  const res = await adminFetch('/feedback/summary')
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`)
  }
  const raw = (await res.json()) as BackendFeedbackSummary
  return {
    total: raw.total,
    averageRating: raw.average_rating,
    fiveStarPercent: raw.five_star_percent,
    lowRatingCount: raw.low_rating_count,
  }
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const res = await adminFetch('/analytics/summary')
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`)
  }
  const raw = (await res.json()) as BackendAnalyticsSummary
  return toAnalyticsSummary(raw)
}

// No backend support for outages, the router catalog, or repeat-contact
// detection (needs a login we don't have) -- the following are mock-backed.

export async function checkOutage(): Promise<OutageInfo> {
  return MOCK_OUTAGE
}

export function getRouterCatalog(): RouterCatalogEntry[] {
  return ROUTER_CATALOG
}

export function getRepeatContactRate(): number {
  return MOCK_REPEAT_CONTACT_RATE
}
