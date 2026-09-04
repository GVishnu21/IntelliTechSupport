import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TrendLineChart } from './TrendLineChart'

const data = [
  { date: '2026-09-01', value: 0.7 },
  { date: '2026-09-02', value: 0.72 },
]

describe('TrendLineChart', () => {
  it('renders the chart with an accessible summary label', () => {
    render(<TrendLineChart title="Resolution trend" data={data} color="#16A34A" />)
    expect(screen.getByText('Resolution trend')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Resolution trend line chart/ })).toBeInTheDocument()
  })

  it('toggles to a data table and back', () => {
    render(<TrendLineChart title="Resolution trend" data={data} color="#16A34A" />)
    fireEvent.click(screen.getByRole('button', { name: 'View as table' }))
    expect(screen.getByText('2026-09-01')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'View chart' }))
    expect(screen.queryByText('2026-09-01')).not.toBeInTheDocument()
  })
})
