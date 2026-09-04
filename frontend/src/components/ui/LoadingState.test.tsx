import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LoadingState } from './LoadingState'

describe('LoadingState', () => {
  it('renders a default loading message', () => {
    render(<LoadingState />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading…')
  })

  it('renders a custom message', () => {
    render(<LoadingState message="Fetching tickets…" />)
    expect(screen.getByRole('status')).toHaveTextContent('Fetching tickets…')
  })
})
