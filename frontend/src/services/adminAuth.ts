// Single shared admin email+password, not per-user accounts -- see
// backend/app/auth.py. The token is an opaque, backend-signed string; this
// module only stores and forwards it, it never inspects or trusts its
// contents client-side.
const TOKEN_STORAGE_KEY = 'admin_token'
// Not part of the auth boundary (the token is) -- stored purely so the
// header can honestly show "Signed in as ___" instead of a made-up name.
const EMAIL_STORAGE_KEY = 'admin_email'

export function getAdminToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

export function getAdminEmail(): string | null {
  try {
    return localStorage.getItem(EMAIL_STORAGE_KEY)
  } catch {
    return null
  }
}

function setAdminToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
  } catch {
    // Private browsing / storage blocked -- login still works for the
    // current page load, it just won't survive a refresh.
  }
}

function setAdminEmail(email: string): void {
  try {
    localStorage.setItem(EMAIL_STORAGE_KEY, email)
  } catch {
    // Ignore -- same fallback as setAdminToken above.
  }
}

export function clearAdminToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(EMAIL_STORAGE_KEY)
  } catch {
    // Ignore.
  }
}

export async function adminLogin(email: string, password: string): Promise<void> {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    throw new Error(res.status === 401 ? 'Incorrect email or password.' : `Request failed: ${res.status}`)
  }
  const { token } = (await res.json()) as { token: string }
  setAdminToken(token)
  setAdminEmail(email)
}
