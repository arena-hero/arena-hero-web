import { describe, expect, it } from 'vitest'
import type { PlayerState } from './types'
import { coreResourceCapacity, visibleCoreShieldLimit } from './gameRules'

describe('coreResourceCapacity', () => {
  it('keeps a minimum of ten, then allows five resources per living Unit', () => {
    expect(coreResourceCapacity(0)).toBe(10)
    expect(coreResourceCapacity(1)).toBe(10)
    expect(coreResourceCapacity(2)).toBe(10)
    expect(coreResourceCapacity(6)).toBe(30)
  })
})

describe('visibleCoreShieldLimit', () => {
  const state = (carrierId?: string): PlayerState => ({
    status: 'ACTIVE', resources: 0, population: 0, population_tier: 0, upkeep_next_tick: 0,
    champion_beacon: carrierId ? { position: [0, 0], status: 'CARRIED', carrier_id: carrierId } : { position: [0, 0] },
    objects: [], events: [],
  })

  it('uses the Beacon cap only for the visible Core carrying it', () => {
    expect(visibleCoreShieldLimit(state('enemy-core'), 'enemy-core')).toBe(10)
    expect(visibleCoreShieldLimit(state('enemy-core'), 'own-core')).toBe(5)
    expect(visibleCoreShieldLimit(state(), 'enemy-core')).toBe(5)
  })
})
