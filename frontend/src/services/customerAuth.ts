// Mandatory customer identity (phone + OTP, name, city -- no email, see
// backend/app/main.py's /customer/* endpoints). Mirrors adminAuth.ts's
// storage pattern: the token is the real auth boundary, name/phone/city are
// cached alongside it purely so the UI can show "Hi, {name}" and let Outage
// use a real city instead of the mock "Your area" string.
const TOKEN_STORAGE_KEY = 'customer_token'
const PROFILE_STORAGE_KEY = 'customer_profile'

export interface CustomerProfile {
  name: string
  phone: string
  city: string
}

export function getCustomerToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

export function getCustomerProfile(): CustomerProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CustomerProfile) : null
  } catch {
    return null
  }
}

function storeSession(token: string, profile: CustomerProfile): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
  } catch {
    // Private browsing / storage blocked -- login still works for the
    // current page load, it just won't survive a refresh.
  }
}

export function clearCustomerSession(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(PROFILE_STORAGE_KEY)
  } catch {
    // Ignore.
  }
}

export async function sendCustomerOtp(phone: string): Promise<void> {
  const res = await fetch('/api/customer/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  })
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`)
  }
}

export async function completeCustomerSignup(
  name: string,
  phone: string,
  city: string,
  code: string,
): Promise<CustomerProfile> {
  const res = await fetch('/api/customer/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, phone, city, code }),
  })
  if (!res.ok) {
    throw new Error(res.status === 401 ? 'Incorrect code. Check the code and try again.' : `Request failed: ${res.status}`)
  }
  const body = (await res.json()) as { token: string; name: string; phone: string; city: string }
  const profile: CustomerProfile = { name: body.name, phone: body.phone, city: body.city }
  storeSession(body.token, profile)
  return profile
}
