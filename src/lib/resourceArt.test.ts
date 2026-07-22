import { describe, expect, it } from 'vitest'
import { RESOURCE_SPRITE_PATHS, resourceSpriteIndex, resourceSpriteRect } from './resourceArt'

describe('resource art', () => {
  it('uses neo-expressionist crystal sprites', () => {
    expect(RESOURCE_SPRITE_PATHS).toEqual([
      '/assets/resources/neo-expressionist/sprites/crystal-1.png',
      '/assets/resources/neo-expressionist/sprites/crystal-2.png',
    ])
  })

  it('selects variants deterministically', () => {
    expect(resourceSpriteIndex([7, -3])).toBe(resourceSpriteIndex([7, -3]))
    expect(resourceSpriteIndex([7, -3])).toBeGreaterThanOrEqual(0)
    expect(resourceSpriteIndex([7, -3])).toBeLessThan(RESOURCE_SPRITE_PATHS.length)
    expect(resourceSpriteIndex([0, 0], 0)).toBe(0)
  })

  it('keeps infinite resource points at a stable integer-pixel size', () => {
    expect(resourceSpriteRect(100.2, 200.2, 44)).toEqual({ left: 80, top: 180, size: 40 })
  })
})
