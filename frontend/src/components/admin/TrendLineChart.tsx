import { useId, useState, type ReactNode } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TrendPoint } from '../../types'

interface TrendLineChartProps {
  title: string
  data: TrendPoint[]
  color: string
  valueFormatter?: (value: number) => string
  badge?: ReactNode
  emptyMessage?: string
}

const defaultFormatter = (value: number) => `${Math.round(value * 100)}%`

export function TrendLineChart({
  title,
  data,
  color,
  valueFormatter = defaultFormatter,
  badge,
  emptyMessage,
}: TrendLineChartProps) {
  const [showTable, setShowTable] = useState(false)
  const panelId = useId()
  const latest = data[data.length - 1]

  if (data.length === 0 && emptyMessage) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h3 className="text-lg font-bold text-text">
          {title}
          {badge}
        </h3>
        <p className="py-8 text-center text-text-secondary">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-bold text-text">
          {title}
          {badge}
        </h3>
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
              <CartesianGrid stroke="#E2E8F0" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: '#64748B' }}
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
                minTickGap={32}
              />
              <YAxis
                tickFormatter={(value: number) => valueFormatter(value)}
                tick={{ fontSize: 12, fill: '#64748B' }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip
                formatter={(value) => valueFormatter(Number(value))}
                contentStyle={{ borderRadius: 8, borderColor: '#E2E8F0', fontSize: 13 }}
              />
              <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
