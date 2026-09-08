import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CircleHelp, Router } from 'lucide-react'
import { CustomerLayout } from '../components/layout/CustomerLayout'
import { CustomerSignupModal } from '../components/auth/CustomerSignupModal'
import { BUTTON_PRIMARY_CLASS, BUTTON_SECONDARY_CLASS } from '../components/ui/buttonStyles'
import { loadActiveSession } from '../utils/sessionContinuity'
import { getCustomerToken } from '../services/customerAuth'

const SIGNUP_PROMPT_DELAY_MS = 4000

interface HomeLocationState {
  // Set by RequireCustomerAuth when an unauthenticated customer deep-links
  // into a protected route -- Home opens the sign-up popup immediately and
  // sends them on to this path once they finish, instead of stranding them
  // on a separate login page.
  from?: string
}

export default function Home() {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeSession] = useState(() => loadActiveSession())
  const redirectedFrom = (location.state as HomeLocationState)?.from ?? null
  // A deep-link redirect (RequireCustomerAuth) opens the popup immediately;
  // otherwise it opens after a short delay so the scanner screen is the
  // first thing a new visitor actually sees. Both are resolved as initial
  // state (derived from render, not an effect) since they only depend on
  // how this page was entered, not on anything that changes afterward.
  const [signupOpen, setSignupOpen] = useState(() => !getCustomerToken() && !!redirectedFrom)
  const [pendingPath, setPendingPath] = useState<string | null>(redirectedFrom)

  useEffect(() => {
    if (getCustomerToken() || redirectedFrom) return

    const timer = setTimeout(() => setSignupOpen(true), SIGNUP_PROMPT_DELAY_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only ever needs to run once, on mount
  }, [])

  function goTo(path: string) {
    if (getCustomerToken()) {
      navigate(path)
      return
    }
    setPendingPath(path)
    setSignupOpen(true)
  }

  function handleContinue() {
    if (!activeSession) return
    if (!getCustomerToken()) {
      setPendingPath(null)
      setSignupOpen(true)
      return
    }
    navigate('/troubleshoot', {
      state: {
        sessionId: activeSession.sessionId,
        scanId: activeSession.scanId,
        step: activeSession.step,
        issue: activeSession.issue,
        stepsCompleted: activeSession.stepsCompleted,
      },
    })
  }

  function handleSignupSuccess() {
    setSignupOpen(false)
    if (pendingPath) {
      navigate(pendingPath)
      setPendingPath(null)
    }
  }

  return (
    <CustomerLayout
      rightAction={
        <button
          type="button"
          aria-label="Help"
          onClick={() => navigate('/faq')}
          className="flex min-h-11 min-w-11 items-center justify-center"
        >
          <CircleHelp size={22} className="text-text-secondary" />
        </button>
      }
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
        <div
          role="img"
          aria-label="Router"
          className="flex h-24 w-24 items-center justify-center rounded-2xl border border-border bg-card"
        >
          <Router size={48} className="text-primary" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h2 className="text-[28px] font-bold leading-8 text-text">Is your internet not working?</h2>
          <p className="text-base leading-6 text-text-secondary">
            Let's check your router and help you get back online.
          </p>
        </div>

        <div className="w-full space-y-3">
          <button type="button" onClick={() => goTo('/scan')} className={BUTTON_PRIMARY_CLASS}>
            Scan My Router
          </button>
          <button type="button" onClick={() => goTo('/select-router')} className={BUTTON_SECONDARY_CLASS}>
            Select Router Manually
          </button>
        </div>
      </div>

      <div className="space-y-4 border-t border-border pt-4 text-center">
        {activeSession && (
          <div>
            <p className="text-sm text-text-secondary">
              Already started troubleshooting? Step {activeSession.step.stepNumber} of{' '}
              {activeSession.step.totalSteps}
            </p>
            <button
              type="button"
              onClick={handleContinue}
              className="text-sm font-medium text-primary underline"
            >
              Continue previous session
            </button>
          </div>
        )}
        <div>
          <p className="text-sm text-text-secondary">Need help?</p>
          <button type="button" onClick={() => navigate('/faq')} className="text-sm font-medium text-primary underline">
            View common internet issues
          </button>
        </div>
      </div>

      <CustomerSignupModal
        open={signupOpen}
        onClose={() => setSignupOpen(false)}
        onSuccess={handleSignupSuccess}
      />
    </CustomerLayout>
  )
}
