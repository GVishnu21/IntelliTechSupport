import { Star } from 'lucide-react'

// Read-only counterpart to StarRating -- same fill-warning/text-border
// convention, just not interactive. Used anywhere a stored rating is shown
// rather than collected.
export function StarDisplay({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div role="img" aria-label={`${rating} out of 5 stars`} className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          aria-hidden="true"
          className={star <= rating ? 'fill-warning text-warning' : 'fill-none text-border'}
        />
      ))}
    </div>
  )
}
