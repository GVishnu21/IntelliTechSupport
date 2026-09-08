import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CustomerLayout } from '../components/layout/CustomerLayout'
import { EmptyState } from '../components/ui/EmptyState'
import { getRouterCatalog } from '../services/api'
import type { RouterCatalogEntry } from '../types'

export default function SelectRouter() {
  const navigate = useNavigate()
  const catalog = getRouterCatalog()
  const [search, setSearch] = useState('')
  const [provider, setProvider] = useState<string | null>(null)

  const providers = useMemo(() => Array.from(new Set(catalog.map((entry) => entry.provider))), [catalog])

  const filtered = catalog.filter((entry) => {
    if (provider && entry.provider !== provider) return false
    const term = search.trim().toLowerCase()
    if (!term) return true
    return (
      entry.brand.toLowerCase().includes(term) ||
      entry.model.toLowerCase().includes(term) ||
      entry.provider.toLowerCase().includes(term)
    )
  })

  function handleSelect(entry: RouterCatalogEntry) {
    navigate('/select-light', { state: { entry } })
  }

  return (
    <CustomerLayout title="Select your router" showBack>
      <div className="flex flex-1 flex-col gap-4">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search router model"
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-base text-text placeholder:text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setProvider(null)}
            aria-pressed={provider === null}
            className={`min-h-11 rounded-full border px-4 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              provider === null ? 'border-primary bg-primary text-white' : 'border-border bg-card text-text-secondary'
            }`}
          >
            All
          </button>
          {providers.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setProvider(p)}
              aria-pressed={provider === p}
              className={`min-h-11 rounded-full border px-4 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                provider === p ? 'border-primary bg-primary text-white' : 'border-border bg-card text-text-secondary'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {filtered.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => handleSelect(entry)}
              className="flex min-h-11 w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <span>
                <span className="block text-base font-medium text-text">
                  {entry.brand} {entry.model}
                </span>
                <span className="block text-sm text-text-secondary">{entry.provider}</span>
              </span>
            </button>
          ))}
          {filtered.length === 0 && <EmptyState title="No routers match your search." />}
        </div>
      </div>
    </CustomerLayout>
  )
}
