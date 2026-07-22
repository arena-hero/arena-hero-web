import { describe, expect, it } from 'vitest'
import { WORLD_BACKGROUND_PATH } from './worldArt'

describe('world art', () => {
  it('uses the low-contrast neo-expressionist deep-space background', () => {
    expect(WORLD_BACKGROUND_PATH).toBe('/assets/background/neo-expressionist/deep-space.webp')
  })
})
