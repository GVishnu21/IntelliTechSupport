import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { adminLogin, clearAdminToken, getAdminEmail, getAdminToken } from './adminAuth'

describe('adminAuth', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('has no token before logging in', () => {
    expect(getAdminToken()).toBeNull()
  })

  it('stores the returned token on a successful login', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'signed-token-abc' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await adminLogin('admin@example.com', 'correct-password')

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'admin@example.com', password: 'correct-password' }),
      })
    )
    expect(getAdminToken()).toBe('signed-token-abc')
    expect(getAdminEmail()).toBe('admin@example.com')
  })

  it('throws a specific message on wrong credentials and stores nothing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }))

    await expect(adminLogin('admin@example.com', 'wrong')).rejects.toThrow('Incorrect email or password.')
    expect(getAdminToken()).toBeNull()
    expect(getAdminEmail()).toBeNull()
  })

  it('throws a generic message for other failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))

    await expect(adminLogin('admin@example.com', 'anything')).rejects.toThrow('Request failed: 500')
  })

  it('clearAdminToken removes both the stored token and email', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ token: 'x' }) })
    )
    await adminLogin('admin@example.com', 'pw')
    expect(getAdminToken()).toBe('x')
    expect(getAdminEmail()).toBe('admin@example.com')

    clearAdminToken()

    expect(getAdminToken()).toBeNull()
    expect(getAdminEmail()).toBeNull()
  })
})
