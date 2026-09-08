import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquare, Percent, Star, ThumbsDown } from 'lucide-react'
import { getFeedbackSummary, getRecentFeedback } from '../../services/api'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { AdminHeaderActions } from '../../components/layout/AdminHeaderActions'
import { StarDisplay } from '../../components/ui/StarDisplay'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingState } from '../../components/ui/LoadingState'
import { formatRelativeTime } from '../../utils/time'
import type { FeedbackSummary, RecentFeedback } from '../../types'

type RatingFilter = 'all' | 1 | 2 | 3 | 4 | 5
type SortOrder = 'newest' | 'oldest'

const RATING_FILTERS: RatingFilter[] = ['all', 5, 4, 3, 2, 1]

// Customer-voice framing (individual ratings/comments), not operational
// performance -- that's what /admin/analytics is for. Deliberately a
// different, smaller set of numbers than the Dashboard/Analytics cards.
const SUMMARY_CARDS: Array<{
  key: string
  label: string
  icon: typeof Star
  chipClassName: string
  format: (s: FeedbackSummary) => string
}> = [
  {
    key: 'total',
    label: 'Total Feedback',
    icon: MessageSquare,
    chipClassName: 'bg-primary/10 text-primary',
    format: (s) => s.total.toLocaleString(),
  },
  {
    key: 'average',
    label: 'Average Rating',
    icon: Star,
    chipClassName: 'bg-amber-50 text-warning dark:bg-amber-950',
    format: (s) => (s.averageRating === null ? '—' : `${s.averageRating.toFixed(1)} / 5`),
  },
  {
    key: 'five-star',
    label: '5-Star %',
    icon: Percent,
    chipClassName: 'bg-green-50 text-success dark:bg-green-950',
    format: (s) => `${Math.round(s.fiveStarPercent * 100)}%`,
  },
  {
    key: 'low',
    label: 'Low Ratings (1-2★)',
    icon: ThumbsDown,
    chipClassName: 'bg-red-50 text-error dark:bg-red-950',
    format: (s) => s.lowRatingCount.toLocaleString(),
  },
]

export default function AdminFeedback() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState<FeedbackSummary | null>(null)
  const [feedback, setFeedback] = useState<RecentFeedback[] | null>(null)
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all')
  const [search, setSearch] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')

  useEffect(() => {
    getFeedbackSummary().then(setSummary)
    // 200 is plenty for a demo-scale table -- the notification bell uses the
    // same endpoint's default (20) for its own, much smaller purpose.
    getRecentFeedback(200).then(setFeedback)
  }, [])

  const filtered = useMemo(() => {
    if (!feedback) return []
    const term = search.trim().toLowerCase()
    return feedback
      .filter((entry) => ratingFilter === 'all' || entry.rating === ratingFilter)
      .filter((entry) => {
        if (!term) return true
        return (entry.feedback ?? '').toLowerCase().includes(term) || entry.equipment.toLowerCase().includes(term)
      })
      .sort((a, b) => {
        const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        return sortOrder === 'newest' ? -diff : diff
      })
  }, [feedback, ratingFilter, search, sortOrder])

  return (
    <AdminLayout>
      <div className="p-6 md:p-8">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text">Feedback</h1>
            <p className="text-text-secondary">What customers are saying, one rating at a time</p>
          </div>
          <AdminHeaderActions />
        </header>

        {!summary || !feedback ? (
          <LoadingState />
        ) : (
          <>
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {SUMMARY_CARDS.map((card) => (
                <div key={card.key} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className={`mb-3 inline-flex rounded-lg p-2 ${card.chipClassName}`}>
                    <card.icon size={18} aria-hidden="true" />
                  </div>
                  <p className="text-sm text-text-secondary">{card.label}</p>
                  <p className="mt-1 text-2xl font-bold text-text">{card.format(summary)}</p>
                </div>
              ))}
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {RATING_FILTERS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRatingFilter(value)}
                  aria-pressed={ratingFilter === value}
                  className={`min-h-11 rounded-full border px-4 text-sm font-medium ${
                    ratingFilter === value
                      ? 'border-primary bg-primary text-white'
                      : 'border-border bg-card text-text-secondary hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {value === 'all' ? 'All' : `${value}★`}
                </button>
              ))}
            </div>

            <div className="mb-4 flex flex-wrap gap-3">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search feedback…"
                className="min-h-11 w-full max-w-sm rounded-lg border border-border bg-card px-3 text-sm text-text placeholder:text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              />

              <label className="sr-only" htmlFor="feedback-sort">
                Sort by date
              </label>
              <select
                id="feedback-sort"
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value as SortOrder)}
                className="min-h-11 rounded-lg border border-border bg-card px-3 text-sm text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-text-secondary">
                  <tr>
                    <th className="px-4 py-3 font-medium">Rating</th>
                    <th className="px-4 py-3 font-medium">Equipment</th>
                    <th className="px-4 py-3 font-medium">Feedback</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((entry) => (
                    <tr
                      key={entry.id}
                      onClick={() => navigate(`/admin/feedback/${entry.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          navigate(`/admin/feedback/${entry.id}`)
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`View feedback for ${entry.equipment}, rated ${entry.rating} out of 5`}
                      className="cursor-pointer border-b border-border last:border-0 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary dark:hover:bg-slate-800"
                    >
                      <td className="px-4 py-3">
                        <StarDisplay rating={entry.rating} />
                      </td>
                      <td className="px-4 py-3 text-text">{entry.equipment}</td>
                      <td className="max-w-xs truncate px-4 py-3 text-text-secondary">
                        {entry.feedback ?? 'No written comment'}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{formatRelativeTime(entry.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <EmptyState
                  title={
                    feedback.length === 0
                      ? 'No feedback yet — it will show up here once a customer rates their experience.'
                      : 'No feedback matches your filters.'
                  }
                />
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
