import { describe, expect, it } from 'vitest'
import { UNIT_SPRITE_PATHS, positionNearViewport, unitArtType, unitSpriteRect } from './unitArt'

describe('unit art', () => {
  it('maps every unit type to its game sprite', () => {
    expect(UNIT_SPRITE_PATHS).toEqual({
      CORE: '/assets/game/units/core.png',
      WORKER: '/assets/game/units/worker.png',
      VANGUARD: '/assets/game/units/vanguard.png',
      RANGER: '/assets/game/units/ranger.png',
    })
    expect(unitArtType({ kind: 'CORE' })).toBe('CORE')
    expect(unitArtType({ kind: 'UNIT', unit_type: 'VANGUARD' })).toBe('VANGUARD')
    expect(unitArtType({ kind: 'UNIT', unit_type: 'RANGER' })).toBe('RANGER')
    expect(unitArtType({ kind: 'UNIT', unit_type: 'WORKER' })).toBe('WORKER')
  })

  it('preserves sprite aspect ratio and locks placement to integer pixels', () => {
    expect(unitSpriteRect(100.2, 200.2, 44, 'CORE', 1)).toEqual({ left: 84, top: 184, width: 32, height: 32 })
    expect(unitSpriteRect(100.2, 200.2, 44, 'RANGER', .65)).toEqual({ left: 90, top: 185, width: 20, height: 30 })
  })

  it('culls distant units while retaining a movement margin', () => {
    const viewport = { minX: -5, maxX: 5, minY: -4, maxY: 4 }
    expect(positionNearViewport([0, 0], viewport)).toBe(true)
    expect(positionNearViewport([7, 4], viewport)).toBe(true)
    expect(positionNearViewport([8, 4], viewport)).toBe(false)
    expect(positionNearViewport([0, -7], viewport)).toBe(false)
  })
})
