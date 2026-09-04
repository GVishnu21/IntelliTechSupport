import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { StarRating } from './StarRating'

describe('StarRating', () => {
  it('marks the selected star as checked', () => {
    render(<StarRating value={3} onChange={vi.fn()} />)
    expect(screen.getByRole('radio', { name: '3 stars' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: '4 stars' })).toHaveAttribute('aria-checked', 'false')
  })

  it('calls onChange with the clicked star value', () => {
    const onChange = vi.fn()
    render(<StarRating value={0} onChange={onChange} />)
    fireEvent.click(screen.getByRole('radio', { name: '5 stars' }))
    expect(onChange).toHaveBeenCalledWith(5)
  })
})
