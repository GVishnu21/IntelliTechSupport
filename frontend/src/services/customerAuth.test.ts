import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearCustomerSession, completeCustomerSignup, getCustomerProfile, getCustomerToken, sendCustomerOtp } from './customerAuth'

describe('customerAuth', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('has no token or profile before signing up', () => {
    expect(getCustomerToken()).toBeNull()
    expect(getCustomerProfile()).toBeNull()
  })

  it('sendCustomerOtp posts the phone number', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'sent' }) })
    vi.stubGlobal('fetch', fetchMock)

    await sendCustomerOtp('555-0100')

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/customer/send-otp',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ phone: '555-0100' }) })
    )
  })

  it('sendCustomerOtp throws on a failed request', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    await expect(sendCustomerOtp('555-0100')).rejects.toThrow('Request failed: 500')
  })

  it('stores the token and profile on a successful signup', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ token: 'signed-token-abc', name: 'Asha Rao', phone: '555-0100', city: 'Bengaluru' }),
      })
    )

    const profile = await completeCustomerSignup('Asha Rao', '555-0100', 'Bengaluru', '123456')

    expect(profile).toEqual({ name: 'Asha Rao', phone: '555-0100', city: 'Bengaluru' })
    expect(getCustomerToken()).toBe('signed-token-abc')
    expect(getCustomerProfile()).toEqual({ name: 'Asha Rao', phone: '555-0100', city: 'Bengaluru' })
  })

  it('throws a specific message on an incorrect code and stores nothing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }))

    await expect(completeCustomerSignup('Asha Rao', '555-0100', 'Bengaluru', '000000')).rejects.toThrow(
      'Incorrect code. Check the code and try again.'
    )
    expect(getCustomerToken()).toBeNull()
  })

  it('clearCustomerSession removes both the stored token and profile', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ token: 'x', name: 'Asha Rao', phone: '555-0100', city: 'Bengaluru' }),
      })
    )
    await completeCustomerSignup('Asha Rao', '555-0100', 'Bengaluru', '123456')
    expect(getCustomerToken()).toBe('x')

    clearCustomerSession()

    expect(getCustomerToken()).toBeNull()
    expect(getCustomerProfile()).toBeNull()
  })
})
