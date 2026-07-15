import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import '../../lib/i18n'
import { StatusPanel } from './StatusPanel'

const state = { resources: 42, population: 6, population_tier: 0, upkeep_next_tick: 1, objects: [], events: [] }

describe('StatusPanel', () => {
  it('shows player stats and events without the manual-order section', () => {
    render(<StatusPanel mobileOpen state={state} tick={42} events={[]} error="" onCloseMobile={() => undefined} />)
    expect(screen.getByText('42', { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByText('Resources')).toBeInTheDocument()
    expect(screen.getByText('Population')).toBeInTheDocument()
    expect(screen.getByText('Next upkeep')).toBeInTheDocument()
    expect(screen.getByText('Private events')).toBeInTheDocument()
    expect(screen.queryByText('Manual orders')).not.toBeInTheDocument()
    expect(screen.queryByText(/OVERRIDES/)).not.toBeInTheDocument()
  })
})
