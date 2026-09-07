// Marks a metric/chart as computed from real ticket data, since most of the
// admin surface still shows mock numbers (no backend support for tracking
// non-escalated sessions yet). Unmarked = demo data.
export function LiveBadge() {
  return (
    <span className="ml-2 inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-success">
      Live
    </span>
  )
}
