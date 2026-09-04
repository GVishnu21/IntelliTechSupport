import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAnalytics } from '../../services/api'
import type { AnalyticsSummary } from '../../types'

const METRICS: Array<{ key: keyof AnalyticsSummary; label: string; format: (value: AnalyticsSummary) => string }> = [
  { key: 'totalScans', label: 'Total Scans', format: (a) => a.totalScans.toLocaleString() },
  { key: 'resolutionRate', label: 'Resolution Rate', format: (a) => `${Math.round(a.resolutionRate * 100)}%` },
  { key: 'escalationRate', label: 'Escalation Rate', format: (a) => `${Math.round(a.escalationRate * 100)}%` },
  { key: 'avgResolutionTime', label: 'Average Resolution Time', format: (a) => a.avgResolutionTime },
]

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null)

  useEffect(() => {
    getAnalytics().then(setAnalytics)
  }, [])

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Intelli TechSupport</h1>
          <p className="text-text-secondary">Overview</p>
        </div>
        <nav className="flex gap-4 text-sm font-medium text-text-secondary">
          <Link to="/admin" className="text-primary">
            Dashboard
          </Link>
          <Link to="/admin/tickets" className="hover:text-text">
            Support Tickets
          </Link>
          <Link to="/admin/analytics" className="hover:text-text">
            Analytics
          </Link>
        </nav>
      </header>

      {!analytics ? (
        <p className="text-text-secondary">Loading…</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {METRICS.map((metric) => (
            <div key={metric.key} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <p className="text-sm text-text-secondary">{metric.label}</p>
              <p className="mt-1 text-2xl font-bold text-text">{metric.format(analytics)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
