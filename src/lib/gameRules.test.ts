import { describe, expect, it } from 'vitest'
import type { PlayerState } from './types'
import { coreResourceCapacity, unitCost, visibleCoreShieldLimit } from './gameRules'

describe('coreResourceCapacity', () => {
  it('keeps a minimum of ten, then allows five resources per living Unit', () => {
    expect(coreResourceCapacity(0)).toBe(10)
    expect(coreResourceCapacity(1)).toBe(10)
    expect(coreResourceCapacity(2)).toBe(10)
    expect(coreResourceCapacity(6)).toBe(30)
  })
})

describe('unitCost', () => {
  it('uses exact 30% tiers and rounds halves up', () => {
    expect(unitCost('WORKER', 19)).toBe(5)
    expect(unitCost('WORKER', 20)).toBe(7)
    expect(unitCost('VANGUARD', 25)).toBe(17)
    expect(unitCost('RANGER', 100)).toBe(1038)
  })
})

describe('visibleCoreShieldLimit', () => {
  const state = (carrierId?: string): PlayerState => ({
    status: 'ACTIVE', resources: 0, population: 0,
    champion_beacon: carrierId ? { position: [0, 0], status: 'CARRIED', carrier_id: carrierId } : { position: [0, 0] },
    objects: [], events: [],
  })

  it('uses the Beacon cap only for the visible Core carrying it', () => {
    expect(visibleCoreShieldLimit(state('enemy-core'), 'enemy-core')).toBe(10)
    expect(visibleCoreShieldLimit(state('enemy-core'), 'own-core')).toBe(5)
    expect(visibleCoreShieldLimit(state(), 'enemy-core')).toBe(5)
  })
})
