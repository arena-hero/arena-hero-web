import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import '../../lib/i18n'
import { RespawnOverlay } from './RespawnOverlay'

describe('RespawnOverlay', () => {
  it('shows the remaining respawn ticks', () => {
    render(<RespawnOverlay remainingTicks={19} destroyedBy="nova" />)
    expect(screen.getByRole('status')).toHaveTextContent('Your Core was destroyed by nova. Reconstructing now.')
    expect(screen.getAllByText('19 Ticks remaining')).toHaveLength(1)
    expect(screen.queryByText('Core signal lost')).not.toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Core reconstruction progress' })).toHaveAttribute('aria-valuenow', '1')
  })

  it('shows deployment state when the countdown reaches zero', () => {
    render(<RespawnOverlay remainingTicks={0} destroyedBy="nova" />)
    expect(screen.getByText('Deploying on the next state…')).toBeInTheDocument()
  })
})
