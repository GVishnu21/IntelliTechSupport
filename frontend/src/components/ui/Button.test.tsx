import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'
import { SecondaryButton } from './SecondaryButton'

describe('Button', () => {
  it('renders children and responds to clicks', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Scan My Router</Button>)
    fireEvent.click(screen.getByRole('button', { name: 'Scan My Router' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not fire onClick when disabled', () => {
    const onClick = vi.fn()
    render(
      <Button onClick={onClick} disabled>
        Scan My Router
      </Button>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Scan My Router' }))
    expect(onClick).not.toHaveBeenCalled()
  })
})

describe('SecondaryButton', () => {
  it('renders children and responds to clicks', () => {
    const onClick = vi.fn()
    render(<SecondaryButton onClick={onClick}>Retake</SecondaryButton>)
    fireEvent.click(screen.getByRole('button', { name: 'Retake' }))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
