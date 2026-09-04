import { useState } from 'react'
import CameraCapture from './components/CameraCapture'
import { diagnose, escalate, verifyStep, type DiagnosisResult } from './api/client'

type Screen = 'diagnose' | 'step' | 'resolved' | 'escalated' | 'low-confidence'

interface StepInfo {
  instruction: string
  step_number: number
}

function App() {
  const [screen, setScreen] = useState<Screen>('diagnose')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [equipment, setEquipment] = useState<string | null>(null)
  const [step, setStep] = useState<StepInfo | null>(null)
  const [ticketId, setTicketId] = useState<string | null>(null)

  async function handleDiagnose(imageBase64: string) {
    setBusy(true)
    setError(null)
    try {
      const result: DiagnosisResult = await diagnose(imageBase64)
      if (result.low_confidence) {
        setScreen('low-confidence')
        return
      }
      setSessionId(result.session_id)
      setEquipment(result.equipment)
      setStep(result.next_step)
      setScreen('step')
    } catch {
      setError('Could not reach the diagnosis service. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleVerify(imageBase64: string) {
    if (!sessionId) return
    setBusy(true)
    setError(null)
    try {
      const result = await verifyStep(imageBase64, sessionId)
      if (result.resolved) {
        setScreen('resolved')
        return
      }
      if (result.escalate) {
        await handleEscalate()
        return
      }
      setStep(result.next_step)
    } catch {
      setError('Could not verify the last step. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleEscalate() {
    setBusy(true)
    setError(null)
    try {
      const targetSession = sessionId ?? 'unknown'
      const result = await escalate(targetSession)
      setTicketId(result.ticket_id)
      setScreen('escalated')
    } catch {
      setError('Could not reach a live agent automatically — please call support directly.')
    } finally {
      setBusy(false)
    }
  }

  function restart() {
    setScreen('diagnose')
    setSessionId(null)
    setEquipment(null)
    setStep(null)
    setTicketId(null)
    setError(null)
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col gap-6 bg-slate-50 p-6">
      <header className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">Intelli TechSupport</h1>
        <p className="text-slate-500">Turn blinking lights into clear next steps.</p>
      </header>

      {error && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-800">
          {error}
        </div>
      )}

      {screen === 'diagnose' && (
        <CameraCapture
          busy={busy}
          prompt="Point your camera at your modem or router so we can read its status lights."
          onCapture={handleDiagnose}
        />
      )}

      {screen === 'low-confidence' && (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-lg font-medium text-slate-800">
            We couldn't confidently identify your equipment from that photo.
          </p>
          <button
            type="button"
            onClick={() => setScreen('diagnose')}
            className="w-full max-w-md rounded-full bg-blue-600 py-3 font-semibold text-white"
          >
            Try another photo
          </button>
        </div>
      )}

      {screen === 'step' && step && (
        <div className="flex flex-col gap-4">
          {equipment && (
            <p className="text-center text-sm text-slate-500">Detected equipment: {equipment}</p>
          )}
          <div className="rounded-lg bg-white p-4 shadow">
            <p className="text-sm font-semibold text-blue-600">Step {step.step_number}</p>
            <p className="text-lg text-slate-800">{step.instruction}</p>
          </div>
          <CameraCapture
            busy={busy}
            prompt="Once you've done that, take another photo so we can check it worked."
            onCapture={handleVerify}
          />
        </div>
      )}

      {screen === 'resolved' && (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-2xl">✅</p>
          <p className="text-lg font-medium text-slate-800">Your connection looks good now.</p>
          <button
            type="button"
            onClick={restart}
            className="w-full max-w-md rounded-full bg-blue-600 py-3 font-semibold text-white"
          >
            Start a new check
          </button>
        </div>
      )}

      {screen === 'escalated' && (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-lg font-medium text-slate-800">
            We're connecting you with a live agent who already has your diagnostic details.
          </p>
          {ticketId && <p className="text-sm text-slate-500">Reference: {ticketId}</p>}
        </div>
      )}

      {screen !== 'escalated' && (
        <button
          type="button"
          onClick={handleEscalate}
          disabled={busy}
          className="mt-auto text-sm font-medium text-slate-500 underline disabled:opacity-50"
        >
          Talk to a person instead
        </button>
      )}
    </div>
  )
}

export default App
