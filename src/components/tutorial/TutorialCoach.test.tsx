import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import '../../lib/i18n'
import { TutorialCoach } from './TutorialCoach'

describe('TutorialCoach', () => {
  it('supports continuation and skipping without hiding progress', async () => {
    const user = userEvent.setup()
    const onContinue = vi.fn()
    const onSkip = vi.fn()
    render(<TutorialCoach step={0} busy={false} feedback="" onContinue={onContinue} onSkip={onSkip} onEnterArena={() => undefined} />)

    expect(screen.getByText('1 of 12')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Begin training' }))
    await user.click(screen.getByRole('button', { name: 'Skip tutorial' }))
    expect(onContinue).toHaveBeenCalledOnce()
    expect(onSkip).toHaveBeenCalledOnce()
  })

  it('shows the final handoff without a skip control', async () => {
    const user = userEvent.setup()
    const onEnterArena = vi.fn()
    render(<TutorialCoach step={12} busy={false} feedback="" onContinue={() => undefined} onSkip={() => undefined} onEnterArena={onEnterArena} />)

    expect(screen.queryByRole('button', { name: 'Skip tutorial' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Enter the arena' }))
    expect(onEnterArena).toHaveBeenCalledOnce()
  })
})
