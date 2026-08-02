import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import '../../lib/i18n'
import i18n from '../../lib/i18n'
import type { PlayerState } from '../../lib/types'
import { UpkeepWarning } from './UpkeepWarning'

const state = (resources: number, upkeep: number): PlayerState => ({
  status: 'ACTIVE',
  resources,
  population: 22,
  population_tier: 3,
  upkeep_next_tick: upkeep,
  champion_beacon: { position: [0, 0] },
  objects: [],
  events: [],
})

describe('UpkeepWarning', () => {
  afterEach(() => void i18n.changeLanguage('en'))

  it('warns about the exact upcoming shortfall and its consequence', () => {
    render(<UpkeepWarning state={state(1, 3)} />)

    const warning = screen.getByRole('alert')
    expect(warning).toHaveTextContent('Next Tick upkeep is short by 2')
    expect(warning).toHaveTextContent('Unpaid upkeep damages Units outside the protected 19, farthest from your Core first.')
  })

  it('stays hidden when the Core can pay the full upkeep', () => {
    const view = render(<UpkeepWarning state={state(3, 3)} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    view.rerender(<UpkeepWarning state={state(4, 3)} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('renders the warning in Chinese', async () => {
    await i18n.changeLanguage('zh')
    render(<UpkeepWarning state={state(0, 3)} />)

    expect(screen.getByRole('alert')).toHaveTextContent('下 Tick 维护费还差 3 点资源')
    expect(screen.getByRole('alert')).toHaveTextContent('欠费会伤害保护名额之外的单位，离 Core 最远的优先。')
  })
})
