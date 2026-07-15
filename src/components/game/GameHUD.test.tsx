import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import '../../lib/i18n'
import i18n from '../../lib/i18n'
import { GameHUD } from './GameHUD'

describe('GameHUD', () => {
  afterEach(() => void i18n.changeLanguage('en'))

  it('shows only the command countdown over the map', () => {
    render(<GameHUD phase="open" stateReceivedAt={Date.now()} />)
    expect(screen.getByRole('progressbar', { name: 'Command window' })).toBeInTheDocument()
    expect(screen.queryByText('ORDERS OPEN')).not.toBeInTheDocument()
    expect(screen.queryByText('Resources')).not.toBeInTheDocument()
  })

  it('renders the localized countdown label', async () => {
    await i18n.changeLanguage('zh')
    render(<GameHUD phase="open" stateReceivedAt={Date.now()} />)
    expect(screen.getByRole('progressbar', { name: '指令窗口' })).toBeInTheDocument()
    expect(screen.queryByText('指令已开放')).not.toBeInTheDocument()
  })
})
