import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import '../../lib/i18n'
import { CommandCountdown } from './CommandCountdown'

describe('CommandCountdown', () => {
  afterEach(() => vi.useRealTimers())

  it('counts down from the local state receipt time', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:10Z'))
    render(<CommandCountdown phase="open" startedAt={Date.now() - 5_000} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '10')
    expect(screen.getByText('10.0s')).toBeInTheDocument()
  })

  it('is hidden outside the open phase', () => {
    render(<CommandCountdown phase="syncing" startedAt={Date.now()} />)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })
})
