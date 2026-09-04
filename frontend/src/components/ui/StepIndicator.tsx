import { ProgressBar } from './ProgressBar'

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  const percent = totalSteps === 0 ? 0 : (currentStep / totalSteps) * 100
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-text-secondary">
        Step {currentStep} of {totalSteps}
      </p>
      <ProgressBar value={percent} label={`Step ${currentStep} of ${totalSteps}`} />
    </div>
  )
}
