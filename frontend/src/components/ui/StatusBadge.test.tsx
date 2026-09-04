import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusBadge } from './StatusBadge'
import type { TicketStatus } from '../../types'

describe('StatusBadge', () => {
  const cases: Array<[TicketStatus, string]> = [
    ['open', 'Open'],
    ['in_progress', 'In Progress'],
    ['resolved', 'Resolved'],
    ['escalated', 'Escalated'],
  ]

  it.each(cases)('renders the label for status %s', (status, label) => {
    render(<StatusBadge status={status} />)
    expect(screen.getByText(label)).toBeInTheDocument()
  })
})
