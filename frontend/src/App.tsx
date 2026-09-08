import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Scan from './pages/Scan'
import Analyzing from './pages/Analyzing'
import Diagnosis from './pages/Diagnosis'
import Outage from './pages/Outage'
import Troubleshoot from './pages/Troubleshoot'
import Verify from './pages/Verify'
import Success from './pages/Success'
import Escalate from './pages/Escalate'
import SelectRouter from './pages/SelectRouter'
import SelectLight from './pages/SelectLight'
import Faq from './pages/Faq'
import AdminLogin from './pages/admin/Login'
import { LoadingState } from './components/ui/LoadingState'
import { RequireAdminAuth } from './components/layout/RequireAdminAuth'
import { RequireCustomerAuth } from './components/layout/RequireCustomerAuth'

// Code-split: only the admin pages pull in Recharts. Lazy-loading them keeps
// that weight out of the customer-facing bundle, which is the actual demo path.
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const AdminTickets = lazy(() => import('./pages/admin/Tickets'))
const AdminTicketDetails = lazy(() => import('./pages/admin/TicketDetails'))
const AdminFeedback = lazy(() => import('./pages/admin/Feedback'))
const AdminFeedbackDetails = lazy(() => import('./pages/admin/FeedbackDetails'))
const AdminAnalytics = lazy(() => import('./pages/admin/Analytics'))

function AdminFallback() {
  return <LoadingState />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/scan" element={<RequireCustomerAuth><Scan /></RequireCustomerAuth>} />
      <Route path="/analyzing" element={<RequireCustomerAuth><Analyzing /></RequireCustomerAuth>} />
      <Route path="/diagnosis" element={<RequireCustomerAuth><Diagnosis /></RequireCustomerAuth>} />
      <Route path="/outage" element={<RequireCustomerAuth><Outage /></RequireCustomerAuth>} />
      <Route path="/troubleshoot" element={<RequireCustomerAuth><Troubleshoot /></RequireCustomerAuth>} />
      <Route path="/verify" element={<RequireCustomerAuth><Verify /></RequireCustomerAuth>} />
      <Route path="/success" element={<RequireCustomerAuth><Success /></RequireCustomerAuth>} />
      <Route path="/escalate" element={<RequireCustomerAuth><Escalate /></RequireCustomerAuth>} />
      <Route path="/select-router" element={<RequireCustomerAuth><SelectRouter /></RequireCustomerAuth>} />
      <Route path="/select-light" element={<RequireCustomerAuth><SelectLight /></RequireCustomerAuth>} />
      <Route path="/faq" element={<RequireCustomerAuth><Faq /></RequireCustomerAuth>} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <RequireAdminAuth>
            <Suspense fallback={<AdminFallback />}>
              <AdminDashboard />
            </Suspense>
          </RequireAdminAuth>
        }
      />
      <Route
        path="/admin/tickets"
        element={
          <RequireAdminAuth>
            <Suspense fallback={<AdminFallback />}>
              <AdminTickets />
            </Suspense>
          </RequireAdminAuth>
        }
      />
      <Route
        path="/admin/tickets/:id"
        element={
          <RequireAdminAuth>
            <Suspense fallback={<AdminFallback />}>
              <AdminTicketDetails />
            </Suspense>
          </RequireAdminAuth>
        }
      />
      <Route
        path="/admin/feedback"
        element={
          <RequireAdminAuth>
            <Suspense fallback={<AdminFallback />}>
              <AdminFeedback />
            </Suspense>
          </RequireAdminAuth>
        }
      />
      <Route
        path="/admin/feedback/:id"
        element={
          <RequireAdminAuth>
            <Suspense fallback={<AdminFallback />}>
              <AdminFeedbackDetails />
            </Suspense>
          </RequireAdminAuth>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <RequireAdminAuth>
            <Suspense fallback={<AdminFallback />}>
              <AdminAnalytics />
            </Suspense>
          </RequireAdminAuth>
        }
      />
    </Routes>
  )
}
