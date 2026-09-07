import { useId, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { LabeledCount } from '../../types'

interface CategoryBarChartProps {
  title: string
  data: LabeledCount[]
  color?: string
  emptyMessage?: string
}

export function CategoryBarChart({ title, data, color = '#2563EB', emptyMessage }: CategoryBarChartProps) {
  const [showTable, setShowTable] = useState(false)
  const panelId = useId()
  const sorted = [...data].sort((a, b) => b.count - a.count)

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
              <CartesianGrid stroke="#E2E8F0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#64748B' }} tickLine={false} axisLine={{ stroke: '#E2E8F0' }} />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fontSize: 12, fill: '#0F172A' }}
                tickLine={false}
                axisLine={false}
                width={140}
              />
              <Tooltip contentStyle={{ borderRadius: 8, borderColor: '#E2E8F0', fontSize: 13 }} />
              <Bar dataKey="count" fill={color} radius={[0, 4, 4, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
