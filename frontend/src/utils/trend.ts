import type { TrendPoint } from '../types'
import type { DateRangeOption } from '../components/admin/DateRangeFilter'

export function filterTrend(
  trend: TrendPoint[],
  range: DateRangeOption,
  customStart: string,
  customEnd: string
): TrendPoint[] {
  if (range === '7d') return trend.slice(-7)
  if (range === '30d') return trend.slice(-30)
  if (range === '90d') return trend
  if (!customStart || !customEnd) return trend
  return trend.filter((point) => point.date >= customStart && point.date <= customEnd)
}

export interface TrendChange {
  direction: 'up' | 'down' | 'flat'
  deltaPercentagePoints: number
}

// Compares the earliest and latest available point in the trend -- real
// signal from the same data the trend charts already plot, not a fabricated
// delta like "+12% from last month". Returns null when there isn't enough
// history yet to say anything, rather than a fake number.
export function computeTrendChange(trend: TrendPoint[]): TrendChange | null {
  if (trend.length < 2) return null
  const delta = trend[trend.length - 1].value - trend[0].value
  const EPSILON = 0.005
  const direction = delta > EPSILON ? 'up' : delta < -EPSILON ? 'down' : 'flat'
  return { direction, deltaPercentagePoints: Math.round(delta * 100) }
}
