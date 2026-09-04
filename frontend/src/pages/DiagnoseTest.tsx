import { useState } from 'react'
import CameraCapture from '../components/CameraCapture'
import { analyzeRouter } from '../services/api'
import type { RouterDiagnosis } from '../types'

// Throwaway route for manually verifying the real /diagnose wiring end to
// end. Removed once verified — see vertical-slice plan Task 3.
export default function DiagnoseTest() {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<RouterDiagnosis | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleCapture(base64: string) {
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const diagnosis = await analyzeRouter(base64)
      setResult(diagnosis)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      <CameraCapture busy={busy} prompt="Photograph a router to test real diagnosis" onCapture={handleCapture} />
      {error && <p className="text-error">{error}</p>}
      {result && (
        <pre className="whitespace-pre-wrap rounded-lg border border-border bg-card p-4 text-xs text-text">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}
