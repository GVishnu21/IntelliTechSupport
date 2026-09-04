import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Scan from './pages/Scan'
import Analyzing from './pages/Analyzing'
import Diagnosis from './pages/Diagnosis'
import Troubleshoot from './pages/Troubleshoot'
import Verify from './pages/Verify'
import Success from './pages/Success'
import Escalate from './pages/Escalate'
import DiagnoseTest from './pages/DiagnoseTest'

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center p-8 text-center">
      <div>
        <h1 className="text-xl font-bold text-text">{label}</h1>
        <p className="text-text-secondary">Coming soon.</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/diagnose-test" element={<DiagnoseTest />} />
      <Route path="/scan" element={<Scan />} />
      <Route path="/analyzing" element={<Analyzing />} />
      <Route path="/diagnosis" element={<Diagnosis />} />
      <Route path="/outage" element={<ComingSoon label="Service Status" />} />
      <Route path="/troubleshoot" element={<Troubleshoot />} />
      <Route path="/verify" element={<Verify />} />
      <Route path="/success" element={<Success />} />
      <Route path="/escalate" element={<Escalate />} />
      <Route path="/select-router" element={<ComingSoon label="Select Your Router" />} />
      <Route path="/admin" element={<ComingSoon label="Admin Dashboard" />} />
      <Route path="/admin/tickets" element={<ComingSoon label="Support Tickets" />} />
      <Route path="/admin/tickets/:id" element={<ComingSoon label="Ticket Details" />} />
      <Route path="/admin/analytics" element={<ComingSoon label="Analytics" />} />
    </Routes>
  )
}
