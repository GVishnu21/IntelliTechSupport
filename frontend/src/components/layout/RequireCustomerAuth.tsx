import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getCustomerToken } from '../../services/customerAuth'

// Client-side gate, same convention as RequireAdminAuth -- except there's no
// dedicated login page to send a customer to. Home is the mandatory sign-up
// popup's home (see Home.tsx + CustomerSignupModal), so an unauthenticated
// deep link bounces back there with the attempted path in state; Home opens
// the popup immediately and sends the customer on once they finish.
export function RequireCustomerAuth({ children }: { children: ReactNode }) {
  const location = useLocation()

  if (!getCustomerToken()) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
