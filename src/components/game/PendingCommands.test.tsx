import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import '../../lib/i18n'
import i18n from '../../lib/i18n'
import { demoState } from '../../lib/demo'
import { PendingCommands } from './PendingCommands'

const workerID = '00000000-0000-4000-8000-000000000002'

describe('PendingCommands', () => {
  afterEach(() => void i18n.changeLanguage('en'))

  it('shows authoritative Agent and Manual plans with override precedence', async () => {
    await i18n.changeLanguage('en')
    render(<PendingCommands
      tick={42}
      state={demoState}
      receipts={{
        AGENT: {
          tick: 42,
          source: 'AGENT',
          received_at: '2026-07-26T00:00:00Z',
          plan: {
            tick: 42,
            unit_actions: { [workerID]: { type: 'MOVE', direction: 'RIGHT' } },
            core_action: { type: 'REPAIR_SHIELD' },
          },
        },
        MANUAL: {
          tick: 42,
          source: 'MANUAL',
          received_at: '2026-07-26T00:00:01Z',
          plan: { tick: 42, unit_actions: { [workerID]: { type: 'HARVEST' } } },
        },
      }}
    />)

    expect(screen.getByText('Pending orders')).toBeInTheDocument()
    expect(screen.getByText('2 effective orders')).toBeInTheDocument()
    expect(screen.getByText('Move · Right')).toBeInTheDocument()
    expect(screen.getByText('Harvest')).toBeInTheDocument()
    expect(screen.getByText('Repair shield')).toBeInTheDocument()
    expect(screen.getByText('Manual orders replace Agent orders for the same asset.')).toBeInTheDocument()

    const toggle = screen.getByRole('button', { expanded: true })
    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Move · Right')).not.toBeInTheDocument()
  })

  it('stays hidden when the current Tick has no received plan', () => {
    const { container } = render(<PendingCommands
      tick={43}
      state={demoState}
      receipts={{
        AGENT: {
          tick: 42,
          source: 'AGENT',
          received_at: '2026-07-26T00:00:00Z',
          plan: { tick: 42, unit_actions: {} },
        },
      }}
    />)
    expect(container).toBeEmptyDOMElement()
  })
})
