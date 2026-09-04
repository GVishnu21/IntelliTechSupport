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
import AdminDashboard from './pages/admin/Dashboard'
import AdminTickets from './pages/admin/Tickets'
import AdminTicketDetails from './pages/admin/TicketDetails'
import AdminAnalytics from './pages/admin/Analytics'

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
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/tickets" element={<AdminTickets />} />
      <Route path="/admin/tickets/:id" element={<AdminTicketDetails />} />
      <Route path="/admin/analytics" element={<AdminAnalytics />} />
    </Routes>
  )
}
