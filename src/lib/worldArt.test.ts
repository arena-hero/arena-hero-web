import { describe, expect, it } from 'vitest'
import { WORLD_BACKGROUND_PATH } from './worldArt'

describe('world art', () => {
  it('uses the game background', () => {
    expect(WORLD_BACKGROUND_PATH).toBe('/assets/game/background.webp')
  })
})
