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
import Faq from './pages/Faq'
import { LoadingState } from './components/ui/LoadingState'

// Code-split: only the admin pages pull in Recharts. Lazy-loading them keeps
// that weight out of the customer-facing bundle, which is the actual demo path.
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const AdminTickets = lazy(() => import('./pages/admin/Tickets'))
const AdminTicketDetails = lazy(() => import('./pages/admin/TicketDetails'))
const AdminAnalytics = lazy(() => import('./pages/admin/Analytics'))

function AdminFallback() {
  return <LoadingState />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/scan" element={<Scan />} />
      <Route path="/analyzing" element={<Analyzing />} />
      <Route path="/diagnosis" element={<Diagnosis />} />
      <Route path="/outage" element={<Outage />} />
      <Route path="/troubleshoot" element={<Troubleshoot />} />
      <Route path="/verify" element={<Verify />} />
      <Route path="/success" element={<Success />} />
      <Route path="/escalate" element={<Escalate />} />
      <Route path="/select-router" element={<SelectRouter />} />
      <Route path="/faq" element={<Faq />} />
      <Route
        path="/admin"
        element={
          <Suspense fallback={<AdminFallback />}>
            <AdminDashboard />
          </Suspense>
        }
      />
      <Route
        path="/admin/tickets"
        element={
          <Suspense fallback={<AdminFallback />}>
            <AdminTickets />
          </Suspense>
        }
      />
      <Route
        path="/admin/tickets/:id"
        element={
          <Suspense fallback={<AdminFallback />}>
            <AdminTicketDetails />
          </Suspense>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <Suspense fallback={<AdminFallback />}>
            <AdminAnalytics />
          </Suspense>
        }
      />
    </Routes>
  )
}
