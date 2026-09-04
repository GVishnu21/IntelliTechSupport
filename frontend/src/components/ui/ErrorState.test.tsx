import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ErrorState } from './ErrorState'

describe('ErrorState', () => {
  it('renders the full variant with title, description, and calls onAction', () => {
    const onAction = vi.fn()
    render(
      <ErrorState
        title="We're having trouble connecting."
        description="Check your connection and try again."
        actionLabel="Try Again"
        onAction={onAction}
      />
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Check your connection and try again.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }))
    expect(onAction).toHaveBeenCalledOnce()
  })

  it('renders without an action button when none is given', () => {
    render(<ErrorState title="Oops" description="Something went wrong." />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders a compact inline message when inline is true', () => {
    render(<ErrorState title="We're having trouble connecting." inline />)
    expect(screen.getByRole('alert')).toHaveTextContent("We're having trouble connecting.")
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })
})
