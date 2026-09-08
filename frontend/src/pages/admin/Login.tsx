import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { adminLogin } from '../../services/adminAuth'

interface LoginLocationState {
  from?: string
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as LoginLocationState)?.from ?? '/admin'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forgotNote, setForgotNote] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await adminLogin(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
        <div className="absolute -mt-20 left-0 right-0 top-0 h-48 bg-gradient-to-b from-blue-100 via-blue-50 to-transparent opacity-40 blur-3xl"></div>
        <div className="p-8">
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-6 rounded-2xl bg-white p-4 shadow-lg">
              <svg width="48" height="48" viewBox="0 0 110 106" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M100.83 28.63L66.86 3.95c-7.25-5.26-17.07-5.26-24.35 0L8.54 28.63C1.29 33.89-1.76 43.23 1.01 51.77l12.98 39.93c2.77 8.53 10.72 14.3 19.7 14.3h41.97c8.98 0 16.93-5.76 19.7-14.3l12.98-39.93c2.77-8.53-.28-17.88-7.53-23.14ZM64.81 63.13l-10.13 18.55-10.13-18.55-18.55-10.13 18.55-10.13 10.13-18.55 10.13 18.55 18.55 10.13-18.55 10.13Z"
                  fill="#3B82F6"
                />
              </svg>
            </div>
            <div className="p-0">
              <h2 className="text-center text-2xl font-bold text-gray-900">Welcome Back</h2>
              <p className="mt-2 text-center text-gray-500">Sign in to continue to your account</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 p-0">
            <div className="space-y-1">
              <label htmlFor="admin-email" className="text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoFocus
                autoComplete="email"
                required
                className="h-12 w-full rounded-lg border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 ring-offset-background placeholder:text-gray-400 focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                placeholder="Enter your email"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="admin-password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setForgotNote(true)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                  className="h-12 w-full rounded-lg border-gray-200 bg-gray-50 px-3 py-2 pr-12 text-sm text-gray-900 ring-offset-background placeholder:text-gray-400 focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute right-1 top-1/2 inline-flex h-9 -translate-y-1/2 items-center justify-center whitespace-nowrap rounded-md px-3 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {forgotNote && (
                <p className="pt-1 text-xs text-gray-500">Contact your team lead to reset the password.</p>
              )}
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-12 w-full items-center justify-center whitespace-nowrap rounded-lg bg-gradient-to-t from-blue-600 via-blue-500 to-blue-400 text-sm font-medium text-white shadow-sm ring-offset-background transition-all duration-200 hover:from-blue-700 hover:via-blue-600 hover:to-blue-500 hover:shadow-md hover:shadow-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
            >
              {submitting ? 'Signing In…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
