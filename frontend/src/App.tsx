import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'

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
      <Route path="/scan" element={<ComingSoon label="Scan Your Router" />} />
      <Route path="/analyzing" element={<ComingSoon label="Analyzing" />} />
      <Route path="/diagnosis" element={<ComingSoon label="Diagnosis" />} />
      <Route path="/outage" element={<ComingSoon label="Service Status" />} />
      <Route path="/troubleshoot" element={<ComingSoon label="Troubleshooting" />} />
      <Route path="/verify" element={<ComingSoon label="Step Complete?" />} />
      <Route path="/success" element={<ComingSoon label="You're Back Online!" />} />
      <Route path="/escalate" element={<ComingSoon label="We Couldn't Fix It" />} />
      <Route path="/select-router" element={<ComingSoon label="Select Your Router" />} />
      <Route path="/admin" element={<ComingSoon label="Admin Dashboard" />} />
      <Route path="/admin/tickets" element={<ComingSoon label="Support Tickets" />} />
      <Route path="/admin/tickets/:id" element={<ComingSoon label="Ticket Details" />} />
      <Route path="/admin/analytics" element={<ComingSoon label="Analytics" />} />
    </Routes>
  )
}
