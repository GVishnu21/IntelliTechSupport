import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LedStatus } from './LedStatus'
import { LedStatusList } from './LedStatusList'

describe('LedStatus', () => {
  it('always pairs color with a text label, never color alone', () => {
    render(<LedStatus light={{ name: 'Internet', color: 'red', state: 'blinking' }} />)
    expect(screen.getByText('Internet')).toBeInTheDocument()
    expect(screen.getByText(/Red — Problem/)).toBeInTheDocument()
    expect(screen.getByText(/Blinking/)).toBeInTheDocument()
  })

  it('labels a normal green light', () => {
    render(<LedStatus light={{ name: 'Power', color: 'green', state: 'solid' }} />)
    expect(screen.getByText(/Green — Normal/)).toBeInTheDocument()
  })
})

describe('LedStatusList', () => {
  it('renders one row per light', () => {
    render(
      <LedStatusList
        lights={[
          { name: 'Power', color: 'green', state: 'solid' },
          { name: 'Wi-Fi', color: 'green', state: 'solid' },
        ]}
      />
    )
    expect(screen.getByText('Power')).toBeInTheDocument()
    expect(screen.getByText('Wi-Fi')).toBeInTheDocument()
  })
})
