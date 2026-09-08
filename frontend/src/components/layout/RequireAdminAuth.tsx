import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getAdminToken } from '../../services/adminAuth'

// Client-side gate is a UX convenience (skip rendering a page that's about
// to 401 and redirect to login instead). It is NOT the real security
// boundary -- every admin endpoint validates the token itself
// (app.main.require_admin), so this alone can't be bypassed for real access.
export function RequireAdminAuth({ children }: { children: ReactNode }) {
  const location = useLocation()

  if (!getAdminToken()) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
