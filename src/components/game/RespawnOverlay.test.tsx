import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import '../../lib/i18n'
import i18n from '../../lib/i18n'
import { RespawnOverlay } from './RespawnOverlay'

describe('RespawnOverlay', () => {
  afterEach(() => void i18n.changeLanguage('en'))

  it('shows only the exceptional spawn retry state, without a cooldown', () => {
    render(<RespawnOverlay destroyedBy="nova" />)
    expect(screen.getByRole('status')).toHaveTextContent('Your Core was destroyed by nova.')
    expect(screen.getByText('No legal spawn point is available yet. Retrying next Tick…')).toBeInTheDocument()
    expect(screen.getByText('There is no respawn cooldown. A new Core and Worker deploy immediately when a valid point is available.')).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('explains the retry-only state in Chinese', async () => {
    await i18n.changeLanguage('zh')
    render(<RespawnOverlay destroyedBy={null} />)
    expect(screen.getByText('暂时找不到合法出生点，将在下一 Tick 重试……')).toBeInTheDocument()
    expect(screen.getByText('复活没有冷却；只要存在合法出生点，新的 Core 和 Worker 会立即部署。')).toBeInTheDocument()
  })
})
