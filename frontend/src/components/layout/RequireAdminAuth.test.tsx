import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { RequireAdminAuth } from './RequireAdminAuth'

function renderGuarded(path = '/admin') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/admin/login" element={<p>login page</p>} />
        <Route
          path={path}
          element={
            <RequireAdminAuth>
              <p>protected content</p>
            </RequireAdminAuth>
          }
        />
      </Routes>
    </MemoryRouter>
  )
}

describe('RequireAdminAuth', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('redirects to /admin/login when there is no token', () => {
    renderGuarded()

    expect(screen.getByText('login page')).toBeInTheDocument()
    expect(screen.queryByText('protected content')).not.toBeInTheDocument()
  })

  it('renders the protected content when a token is present', () => {
    localStorage.setItem('admin_token', 'some-token')

    renderGuarded()

    expect(screen.getByText('protected content')).toBeInTheDocument()
  })
})
