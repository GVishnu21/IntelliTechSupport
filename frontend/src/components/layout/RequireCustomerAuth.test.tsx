import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { RequireCustomerAuth } from './RequireCustomerAuth'

function renderGuarded(path = '/scan') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<p>home page</p>} />
        <Route
          path={path}
          element={
            <RequireCustomerAuth>
              <p>protected content</p>
            </RequireCustomerAuth>
          }
        />
      </Routes>
    </MemoryRouter>
  )
}

describe('RequireCustomerAuth', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('redirects to / (where the sign-up popup lives) when there is no token', () => {
    renderGuarded()

    expect(screen.getByText('home page')).toBeInTheDocument()
    expect(screen.queryByText('protected content')).not.toBeInTheDocument()
  })

  it('renders the protected content when a token is present', () => {
    localStorage.setItem('customer_token', 'some-token')

    renderGuarded()

    expect(screen.getByText('protected content')).toBeInTheDocument()
  })
})
