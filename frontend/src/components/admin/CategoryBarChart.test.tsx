import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CategoryBarChart } from './CategoryBarChart'

const data = [
  { label: 'Wi-Fi disabled', count: 50 },
  { label: 'Power issue', count: 200 },
]

describe('CategoryBarChart', () => {
  it('renders the chart with an accessible summary naming the top result', () => {
    render(<CategoryBarChart title="Common issues" data={data} />)
    expect(screen.getByText('Common issues')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /top result Power issue with 200/ })).toBeInTheDocument()
  })

  it('toggles to a data table sorted by count descending', () => {
    render(<CategoryBarChart title="Common issues" data={data} />)
    fireEvent.click(screen.getByRole('button', { name: 'View as table' }))
    const rows = screen.getAllByRole('row')
    expect(rows[1]).toHaveTextContent('Power issue')
    expect(rows[2]).toHaveTextContent('Wi-Fi disabled')
  })
})
