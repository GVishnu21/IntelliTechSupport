import type { TroubleshootingStep } from '../../types'

export function TroubleshootingCard({ step }: { step: TroubleshootingStep }) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-text">{step.title}</h2>
      <p className="text-base text-text-secondary">{step.description}</p>
      {step.checklist.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <ul className="space-y-2">
            {step.checklist.map((item) => (
              <li key={item} className="flex items-start gap-2 text-base text-text">
                <span className="text-success" aria-hidden="true">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
      {step.note && <p className="rounded-lg bg-amber-50 p-3 text-sm text-warning">{step.note}</p>}
    </div>
  )
}
