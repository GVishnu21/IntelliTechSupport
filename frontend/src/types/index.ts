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
