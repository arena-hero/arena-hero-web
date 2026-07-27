import { describe, expect, it } from 'vitest'
import { BEACON_SPRITE_PATH, beaconSpriteRect } from './beaconArt'

describe('beacon art', () => {
  it('uses the game Beacon sprite', () => {
    expect(BEACON_SPRITE_PATH).toBe('/assets/game/beacon.png')
  })

  it('keeps a ground Beacon prominent and a carried Beacon compact', () => {
    expect(beaconSpriteRect(100.2, 200.2, 44, false)).toEqual({ left: 79, top: 179, width: 43, height: 43 })
    expect(beaconSpriteRect(100.2, 200.2, 44, true)).toEqual({ left: 87, top: 187, width: 26, height: 26 })
  })
})
