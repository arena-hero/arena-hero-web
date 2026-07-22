import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import '../../lib/i18n'
import i18n from '../../lib/i18n'
import { BeaconDirectionIndicator, offscreenBeaconPlacement } from './BeaconDirectionIndicator'

describe('BeaconDirectionIndicator', () => {
  afterEach(() => void i18n.changeLanguage('en'))

  it('stays hidden while the Beacon is inside the viewport', () => {
    expect(offscreenBeaconPlacement({ position: [0, 0] }, { x: 0, y: 0, cell: 44 }, { width: 800, height: 600 })).toBeNull()
  })

  it('pins to the correct edge and points toward the Beacon', () => {
    expect(offscreenBeaconPlacement({ position: [20, 0] }, { x: 0, y: 0, cell: 44 }, { width: 800, height: 600 })).toEqual({ left: 770, top: 300, angle: 0, edge: 'right' })
    expect(offscreenBeaconPlacement({ position: [0, -20] }, { x: 0, y: 0, cell: 44 }, { width: 800, height: 600 })).toEqual({ left: 400, top: 30, angle: -90, edge: 'top' })
  })

  it('shows the coordinate and explanation and centers on click', () => {
    const onCenter = vi.fn()
    render(<BeaconDirectionIndicator beacon={{ position: [20, -3] }} camera={{ x: 0, y: 0, cell: 44 }} viewport={{ width: 800, height: 600 }} onCenter={onCenter} />)
    expect(screen.getByText('[20, -3]')).toBeInTheDocument()
    expect(screen.getByText("The carrier's Workers harvest 2 resources per action.")).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Center on Champion Beacon [20, -3]' }))
    expect(onCenter).toHaveBeenCalledOnce()
  })
})
