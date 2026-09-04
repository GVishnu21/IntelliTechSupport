export interface DiagnosisResult {
  session_id: string
  equipment: string
  confidence: number
  status_lights: Record<string, string>
  next_step: {
    instruction: string
    step_number: number
  } | null
  low_confidence: boolean
}

export interface VerifyStepResult {
  resolved: boolean
  escalate: boolean
  next_step: {
    instruction: string
    step_number: number
  } | null
  status_lights: Record<string, string>
}

async function postImage<T>(path: string, imageBase64: string, sessionId?: string): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_base64: imageBase64, session_id: sessionId }),
  })
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export function diagnose(imageBase64: string): Promise<DiagnosisResult> {
  return postImage<DiagnosisResult>('/diagnose', imageBase64)
}

export function verifyStep(imageBase64: string, sessionId: string): Promise<VerifyStepResult> {
  return postImage<VerifyStepResult>('/verify-step', imageBase64, sessionId)
}

export async function escalate(sessionId: string): Promise<{ ticket_id: string }> {
  const res = await fetch('/api/escalate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId }),
  })
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`)
  }
  return res.json()
}
