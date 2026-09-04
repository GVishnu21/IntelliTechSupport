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
