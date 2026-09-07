import { useId, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAdminTheme } from '../layout/AdminThemeContext'
import type { TrendPoint } from '../../types'

interface TrendLineChartProps {
  title: string
  data: TrendPoint[]
  color: string
  // Optional dark-mode variant of `color` -- Recharts is styled via inline
  // SVG props, not CSS classes, so it can't pick up the .dark scope the way
  // everything else does; this is re-picked for contrast against a dark
  // card, not derived automatically from `color`. Falls back to `color`
  // itself when omitted.
  darkColor?: string
  valueFormatter?: (value: number) => string
  emptyMessage?: string
}

const defaultFormatter = (value: number) => `${Math.round(value * 100)}%`

export function TrendLineChart({
  title,
  data,
  color,
  darkColor,
  valueFormatter = defaultFormatter,
  emptyMessage,
}: TrendLineChartProps) {
  const { dark } = useAdminTheme()
  const [showTable, setShowTable] = useState(false)
  const panelId = useId()
  const latest = data[data.length - 1]
  const lineColor = dark ? (darkColor ?? color) : color
  const gridColor = dark ? '#334155' : '#E2E8F0'
  const axisTickColor = dark ? '#94A3B8' : '#64748B'
  const tooltipStyle = {
    borderRadius: 8,
    borderColor: gridColor,
    fontSize: 13,
    backgroundColor: dark ? '#1E293B' : '#FFFFFF',
    color: dark ? '#F1F5F9' : '#0F172A',
  }

  if (data.length === 0 && emptyMessage) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h3 className="text-lg font-bold text-text">{title}</h3>
        <p className="py-8 text-center text-text-secondary">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-bold text-text">{title}</h3>
        <button
          type="button"
          onClick={() => setShowTable((value) => !value)}
          aria-expanded={showTable}
          aria-controls={panelId}
          className="text-sm font-medium text-primary underline"
        >
          {showTable ? 'View chart' : 'View as table'}
        </button>
      </div>

      {showTable ? (
        <div id={panelId} className="max-h-64 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-text-secondary">
              <tr>
                <th className="py-1 pr-4 font-medium">Date</th>
                <th className="py-1 font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {data.map((point) => (
                <tr key={point.date} className="border-t border-border">
                  <td className="py-1 pr-4 text-text">{point.date}</td>
                  <td className="py-1 text-text">{valueFormatter(point.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          id={panelId}
          className="h-56 w-full"
          role="img"
          aria-label={`${title} line chart, ${data.length} data points, most recent value ${latest ? valueFormatter(latest.value) : 'unavailable'}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke={gridColor} vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: axisTickColor }}
                tickLine={false}
                axisLine={{ stroke: gridColor }}
                minTickGap={32}
              />
              <YAxis
                tickFormatter={(value: number) => valueFormatter(value)}
                tick={{ fontSize: 12, fill: axisTickColor }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip formatter={(value) => valueFormatter(Number(value))} contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="value" stroke={lineColor} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
