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
}

export interface RouterCatalogEntry {
  id: string
  provider: string
  brand: string
  model: string
}

export interface TrendPoint {
  date: string
  value: number
}

export interface LabeledCount {
  label: string
  count: number
}

export interface AnalyticsSummary {
  totalScans: number
  resolutionRate: number
  escalationRate: number
  avgResolutionTime: string
  firstContactResolution: number
  repeatContactRate: number
  csat: number
  resolutionTrend: TrendPoint[]
  escalationTrend: TrendPoint[]
  commonIssues: LabeledCount[]
  commonRouterModels: LabeledCount[]
}
