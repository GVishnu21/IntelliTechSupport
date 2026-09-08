export type LedColor = 'green' | 'red' | 'amber' | 'gray'
export type LedState = 'solid' | 'blinking' | 'off'
export type LedSemanticStatus = 'normal' | 'problem' | 'attention' | 'unknown'

export interface LedReading {
  name: string
  color: LedColor
  state: LedState
}

export type DetectionConfidence = 'high' | 'medium' | 'low'

export interface RouterDiagnosis {
  sessionId: string
  // Undefined only for the manual-router-selection mock path, which never
  // calls the real backend and so has no real scan to attach feedback to.
  scanId?: string
  manufacturer: string
  model: string
  confidence: DetectionConfidence
  issue: string
  lowConfidence: boolean
  lights: LedReading[]
  firstStep: TroubleshootingStep | null
}

export interface TroubleshootingStep {
  stepNumber: number
  totalSteps: number
  title: string
  description: string
  checklist: string[]
  note?: string
}

export interface VerifyResult {
  resolved: boolean
  escalate: boolean
  nextStep: TroubleshootingStep | null
}

export interface OutageInfo {
  active: boolean
  area: string
  estimatedRestoration: string
  message: string
}

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'escalated'

export interface TroubleshootingHistoryItem {
  step: string
  outcome: 'completed' | 'failed' | 'skipped'
}

export interface SupportTicket {
  id: string
  customer: string
  issue: string
  router: string
  status: TicketStatus
  createdAt: string
  ledStatus: LedReading[]
  history: TroubleshootingHistoryItem[]
  aiDiagnosis: string
  // Optional -- captured only if the customer chose to leave a callback
  // number when escalating. There's no login, so this is the only real
  // contact info a ticket can ever have.
  contactPhone?: string
  // True only when the customer verified this number with an OTP before
  // escalating (PRD IT-5) -- verification is optional, so most tickets with
  // a contactPhone will still have this false.
  contactPhoneVerified: boolean
}

export interface RouterCatalogEntry {
  id: string
  provider: string
  brand: string
  model: string
  // The real backend playbook this entry maps to. Several provider-branded
  // entries have no SKU-specific playbook, so they map to the generic one --
  // see mockData.ts for which.
  backendEquipment: string
}

export interface TrendPoint {
  date: string
  value: number
}

export interface LabeledCount {
  label: string
  count: number
}

export interface RecentFeedback {
  id: string
  // Real, but disjoint from tickets -- feedback only happens on a resolved
  // session (Success page), tickets only exist for escalated ones, so a
  // feedback entry's session never has a matching ticket. sessionId is the
  // one real cross-reference these entries carry.
  sessionId: string | null
  equipment: string
  outcome: string
  rating: number
  feedback: string | null
  createdAt: string
}

export interface FeedbackSummary {
  total: number
  averageRating: number | null
  fiveStarPercent: number
  lowRatingCount: number
}

export type AppNotificationType = 'ticket' | 'feedback'

// Modular by design: today built from tickets + feedback, but any future
// source (e.g. a new alert type) only needs to map into this same shape --
// the bell/dropdown UI doesn't know or care where a notification came from.
export interface AppNotification {
  id: string
  type: AppNotificationType
  title: string
  description: string
  createdAt: string
  // Where clicking the notification navigates.
  href?: string
}

// Real, computed server-side from the scans table (every /diagnose call,
// not just escalations) -- see services/api.ts's getAnalyticsSummary().
// repeatContactRate isn't here: there's no login, so "the same customer
// contacted us again" can't be detected -- it stays a separate mock value.
export interface AnalyticsSummary {
  totalScans: number
  resolutionRate: number
  escalationRate: number
  avgResolutionTime: string
  firstContactResolution: number
  csat: number | null
  resolutionTrend: TrendPoint[]
  escalationTrend: TrendPoint[]
  topTroubleshootingSteps: LabeledCount[]
}
