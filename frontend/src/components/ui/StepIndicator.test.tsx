import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StepIndicator } from './StepIndicator'

describe('StepIndicator', () => {
  it('renders "Step X of Y"', () => {
    render(<StepIndicator currentStep={2} totalSteps={4} />)
    expect(screen.getByText('Step 2 of 4')).toBeInTheDocument()
  })

  it('sets progress to 50% for step 2 of 4', () => {
    render(<StepIndicator currentStep={2} totalSteps={4} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50')
  })
})
