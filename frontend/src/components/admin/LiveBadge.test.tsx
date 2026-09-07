import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LiveBadge } from './LiveBadge'

describe('LiveBadge', () => {
  it('renders the Live label', () => {
    render(<LiveBadge />)
    expect(screen.getByText('Live')).toBeInTheDocument()
  })
})
