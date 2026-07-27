import { describe, expect, it } from 'vitest'
import { OBSTACLE_SPRITE_PATHS, obstacleCellShape, obstacleSpriteIndex, obstacleSpriteRect } from './obstacleArt'
import { positionKey } from './visibility'

const occupied = (...positions: [number, number][]) => new Set(positions.map(positionKey))

describe('obstacle art', () => {
  it('uses transparent object sprites rather than a clipped terrain slab', () => {
    expect(OBSTACLE_SPRITE_PATHS).toEqual([
      '/assets/game/obstacles/asteroid-large-1.png',
      '/assets/game/obstacles/asteroid-large-2.png',
    ])
  })

  it('detects only cardinal neighbors for narrow rock connections', () => {
    const cells = occupied([0, 0], [1, 0], [1, 1])
    expect(obstacleCellShape([0, 0], cells)).toEqual({ north: false, east: true, south: false, west: false })
    expect(obstacleCellShape([1, 1], cells)).toEqual({ north: true, east: false, south: false, west: false })
  })

  it('selects sprite variants deterministically', () => {
    expect(obstacleSpriteIndex([4, -7])).toBe(obstacleSpriteIndex([4, -7]))
    expect(obstacleSpriteIndex([4, -7])).toBeGreaterThanOrEqual(0)
    expect(obstacleSpriteIndex([4, -7])).toBeLessThan(OBSTACLE_SPRITE_PATHS.length)
    expect(obstacleSpriteIndex([0, 0], 0)).toBe(0)
  })

  it('locks sprite sampling to an integer pixel rectangle while panning', () => {
    expect(obstacleSpriteRect(100.2, 200.2, 44)).toEqual({ left: 81, top: 181, size: 38 })
    expect(obstacleSpriteRect(100.4, 200.4, 44)).toEqual({ left: 81, top: 181, size: 38 })
  })
})
