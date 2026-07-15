import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import i18n from '../lib/i18n'
import { DocsPage } from './DocsPage'

describe('DocsPage', () => {
  const writeText = vi.fn().mockResolvedValue(undefined)

  beforeEach(async () => {
    writeText.mockClear()
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    await i18n.changeLanguage('en')
  })

  it('presents game rules and the API reference without card landmarks', () => {
    render(<MemoryRouter><DocsPage /></MemoryRouter>)
    expect(screen.getByRole('heading', { level: 1, name: 'Documentation' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Game rules' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '01 · Game rules' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /6 sections/ })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'API reference' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Movement and cell capacity' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'GET /api/v1/game/stream' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'POST /api/v1/game/commands' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Account and API key endpoints' })).not.toBeInTheDocument()
  })

  it('copies game rules and API reference as separate Markdown documents', async () => {
    const user = userEvent.setup()
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    render(<MemoryRouter><DocsPage /></MemoryRouter>)
    const rulesButton = screen.getByRole('button', { name: 'Copy game rules as Markdown' })
    const apiButton = screen.getByRole('button', { name: 'Copy API as Markdown' })
    await user.click(rulesButton)
    expect(writeText).toHaveBeenCalledOnce()
    expect(writeText.mock.calls[0][0]).toContain('# Arena Hero Game rules')
    expect(writeText.mock.calls[0][0]).not.toContain('GET /api/v1/game/stream')
    await user.click(apiButton)
    expect(writeText).toHaveBeenCalledTimes(2)
    expect(writeText.mock.calls[1][0]).toContain('# Arena Hero API reference')
    expect(writeText.mock.calls[1][0]).toContain('GET /api/v1/game/stream')
    expect(writeText.mock.calls[1][0]).not.toContain('/api/v1/auth')
    expect(writeText.mock.calls[1][0]).not.toContain('/api/v1/me')
    expect(writeText.mock.calls[1][0]).not.toContain('Session Cookie')
    expect(writeText.mock.calls[1][0]).not.toContain('What you are doing')
    expect(screen.getAllByRole('button', { name: 'Markdown copied' })).toHaveLength(2)
  })
})
