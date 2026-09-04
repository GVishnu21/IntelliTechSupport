import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAnalytics } from '../../services/api'
import type { AnalyticsSummary } from '../../types'

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null)

  useEffect(() => {
    getAnalytics().then(setAnalytics)
  }, [])

  if (!analytics) {
    return <p className="p-8 text-text-secondary">Loading…</p>
  }

  const stats: Array<[string, string]> = [
    ['Resolution Rate', `${Math.round(analytics.resolutionRate * 100)}%`],
    ['Escalation Rate', `${Math.round(analytics.escalationRate * 100)}%`],
    ['Average Resolution Time', analytics.avgResolutionTime],
    ['First Contact Resolution', `${Math.round(analytics.firstContactResolution * 100)}%`],
    ['Repeat Contact Rate', `${Math.round(analytics.repeatContactRate * 100)}%`],
    ['CSAT', analytics.csat.toFixed(1)],
  ]

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">Analytics</h1>
        <Link to="/admin" className="text-sm font-medium text-primary">
          Back to Dashboard
        </Link>
      </header>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <p className="text-sm text-text-secondary">{label}</p>
            <p className="mt-1 text-2xl font-bold text-text">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h3 className="mb-2 text-lg font-bold text-text">Common router problems</h3>
          <ul className="space-y-2">
            {analytics.commonIssues.map((issue) => (
              <li key={issue.label} className="flex items-center justify-between text-base text-text">
                <span>{issue.label}</span>
                <span className="font-medium">{issue.count}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h3 className="mb-2 text-lg font-bold text-text">Most scanned router models</h3>
          <ul className="space-y-2">
            {analytics.commonRouterModels.map((model) => (
              <li key={model.label} className="flex items-center justify-between text-base text-text">
                <span>{model.label}</span>
                <span className="font-medium">{model.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
