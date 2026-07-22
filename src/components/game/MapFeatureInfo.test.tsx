import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import '../../lib/i18n'
import i18n from '../../lib/i18n'
import { MapFeatureInfo } from './MapFeatureInfo'

const anchor = { x: 100, y: 100, side: 'right' as const }

describe('MapFeatureInfo', () => {
  afterEach(() => void i18n.changeLanguage('en'))

  it('keeps resource information to its name and coordinate', () => {
    render(<MapFeatureInfo feature={{ kind: 'RESOURCE', position: [2, 1] }} anchor={anchor} onClose={() => undefined} />)
    expect(screen.getByRole('dialog', { name: 'Resource deposit' })).toBeInTheDocument()
    expect(screen.getByText('[2, 1]')).toBeInTheDocument()
    expect(screen.queryByText('Unlimited resources')).not.toBeInTheDocument()
  })

  it('explains the Beacon bonus and closes', async () => {
    await i18n.changeLanguage('zh')
    const onClose = vi.fn()
    render(<MapFeatureInfo feature={{ kind: 'BEACON', position: [0, 0], status: 'GROUND' }} anchor={anchor} onClose={onClose} />)
    expect(screen.getByText('携带者的工人每次采集 2 资源。')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '关闭' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('states that obstacles cannot be crossed', () => {
    render(<MapFeatureInfo feature={{ kind: 'OBSTACLE', position: [4, 1] }} anchor={anchor} onClose={() => undefined} />)
    expect(screen.getByText('Units cannot enter or move through this cell.')).toBeInTheDocument()
  })
})
