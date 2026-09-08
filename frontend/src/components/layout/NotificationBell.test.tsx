import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { NotificationBell } from './NotificationBell'

function mockFetch(ticketsBody: unknown = [], feedbackBody: unknown = []) {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      const body = url.includes('/feedback/recent') ? feedbackBody : ticketsBody
      return Promise.resolve({ ok: true, json: async () => body })
    })
  )
}

function renderBell() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/admin" element={<NotificationBell />} />
        <Route path="/admin/tickets/:id" element={<p>ticket detail page</p>} />
        <Route path="/admin/feedback/:id" element={<p>feedback detail page</p>} />
      </Routes>
    </MemoryRouter>
  )
}

const ticket = {
  id: 'ITS-1',
  session_id: null,
  equipment: 'unknown',
  status: 'escalated',
  status_lights: {},
  history: [],
  contact_phone: null,
  created_at: new Date().toISOString(),
}

describe('NotificationBell', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows no badge when there is nothing new', async () => {
    mockFetch([], [])
    renderBell()

    await waitFor(() => expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument())
    expect(screen.queryByText(/unread notification/)).not.toBeInTheDocument()
  })

  it('shows a badge count for a newly created ticket', async () => {
    mockFetch([ticket], [])
    renderBell()

    await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument())
  })

  it('shows the empty state when there is nothing to show', async () => {
    mockFetch([], [])
    renderBell()

    fireEvent.click(await screen.findByRole('button', { name: 'Notifications' }))

    expect(screen.getByText("You're all caught up")).toBeInTheDocument()
  })

  it('clears the badge on open but keeps the notification listed', async () => {
    mockFetch([ticket], [])
    renderBell()

    await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }))

    expect(screen.queryByText('1')).not.toBeInTheDocument()
    expect(screen.getByText('New Ticket')).toBeInTheDocument()
  })

  it('navigates to the ticket when its notification is clicked', async () => {
    mockFetch([ticket], [])
    renderBell()

    await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }))
    fireEvent.click(screen.getByRole('menuitem', { name: /New Ticket/ }))

    expect(await screen.findByText('ticket detail page')).toBeInTheDocument()
  })

  it('navigates to the feedback detail page when its notification is clicked', async () => {
    mockFetch(
      [],
      [
        {
          id: 'scan-1',
          session_id: 'session-1',
          equipment: 'Arris SB8200',
          outcome: 'resolved',
          rating: 5,
          feedback: 'Great',
          created_at: new Date().toISOString(),
        },
      ]
    )
    renderBell()

    await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }))
    fireEvent.click(screen.getByRole('menuitem', { name: /New Feedback/ }))

    expect(await screen.findByText('feedback detail page')).toBeInTheDocument()
  })
})
