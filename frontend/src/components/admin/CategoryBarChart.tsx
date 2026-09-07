import { useId, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAdminTheme } from '../layout/AdminThemeContext'
import type { LabeledCount } from '../../types'

interface CategoryBarChartProps {
  title: string
  data: LabeledCount[]
  color?: string
  // See TrendLineChart's darkColor for why this can't be derived automatically.
  darkColor?: string
  emptyMessage?: string
}

export function CategoryBarChart({ title, data, color, darkColor, emptyMessage }: CategoryBarChartProps) {
  const { dark } = useAdminTheme()
  const [showTable, setShowTable] = useState(false)
  const panelId = useId()
  const sorted = [...data].sort((a, b) => b.count - a.count)
  const lightColor = color ?? '#2563EB'
  const barColor = dark ? (darkColor ?? color ?? '#3B82F6') : lightColor
  const gridColor = dark ? '#334155' : '#E2E8F0'
  const axisTickColor = dark ? '#94A3B8' : '#64748B'
  const categoryTickColor = dark ? '#F1F5F9' : '#0F172A'
  const tooltipStyle = {
    borderRadius: 8,
    borderColor: gridColor,
    fontSize: 13,
    backgroundColor: dark ? '#1E293B' : '#FFFFFF',
    color: dark ? '#F1F5F9' : '#0F172A',
  }

  if (sorted.length === 0 && emptyMessage) {
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
        <table id={panelId} className="w-full text-left text-sm">
          <thead className="text-text-secondary">
            <tr>
              <th className="py-1 pr-4 font-medium">Label</th>
              <th className="py-1 font-medium">Count</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((item) => (
              <tr key={item.label} className="border-t border-border">
                <td className="py-1 pr-4 text-text">{item.label}</td>
                <td className="py-1 text-text">{item.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div
          id={panelId}
          style={{ height: Math.max(160, sorted.length * 44) }}
          role="img"
          aria-label={`${title} bar chart, top result ${sorted[0]?.label ?? 'none'} with ${sorted[0]?.count ?? 0}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sorted} layout="vertical" margin={{ top: 4, right: 24, left: 4, bottom: 4 }}>
              <CartesianGrid stroke={gridColor} horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 12, fill: axisTickColor }}
                tickLine={false}
                axisLine={{ stroke: gridColor }}
              />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fontSize: 12, fill: categoryTickColor }}
                tickLine={false}
                axisLine={false}
                width={140}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill={barColor} radius={[0, 4, 4, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
