export type DateRangeOption = '7d' | '30d' | '90d' | 'custom'

interface DateRangeFilterProps {
  value: DateRangeOption
  onChange: (value: DateRangeOption) => void
  customStart: string
  customEnd: string
  onCustomStartChange: (value: string) => void
  onCustomEndChange: (value: string) => void
}

const OPTIONS: Array<{ value: DateRangeOption; label: string }> = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: 'custom', label: 'Custom' },
]

export function DateRangeFilter({
  value,
  onChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
}: DateRangeFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={`min-h-11 rounded-full border px-4 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
            value === option.value
              ? 'border-primary bg-primary text-white'
              : 'border-border bg-card text-text-secondary'
          }`}
        >
          {option.label}
        </button>
      ))}
      {value === 'custom' && (
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="date-range-start">
            Start date
          </label>
          <input
            id="date-range-start"
            type="date"
            value={customStart}
            onChange={(event) => onCustomStartChange(event.target.value)}
            className="min-h-11 rounded-lg border border-border bg-card px-2 text-sm text-text"
          />
          <span className="text-text-secondary">to</span>
          <label className="sr-only" htmlFor="date-range-end">
            End date
          </label>
          <input
            id="date-range-end"
            type="date"
            value={customEnd}
            onChange={(event) => onCustomEndChange(event.target.value)}
            className="min-h-11 rounded-lg border border-border bg-card px-2 text-sm text-text"
          />
        </div>
      )}
    </div>
  )
}
