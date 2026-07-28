import { describe, expect, it } from 'vitest'
import type { ExploredCell } from './exploration'
import { mapFeaturesAt } from './mapFeatures'
import type { PlayerState } from './types'

const state: PlayerState = {
  status: 'ACTIVE', resources: 0, population: 0, population_tier: 0, upkeep_next_tick: 0, events: [],
  champion_beacon: { position: [0, 0], status: 'GROUND' },
  objects: [
    { kind: 'RESOURCE', positions: [[2, 1]] },
    { kind: 'OBSTACLE', positions: [[4, 1]] },
  ],
}

describe('mapFeaturesAt', () => {
  it('exposes the Champion Beacon at its current cell', () => {
    expect(mapFeaturesAt([0, 0], state, new Map())).toEqual([{ kind: 'BEACON', position: [0, 0], status: 'GROUND' }])
  })

  it('exposes a currently visible resource point', () => {
    const explored = new Map<string, ExploredCell>([['2,1', { kind: 'RESOURCE', position: [2, 1] }]])
    expect(mapFeaturesAt([2, 1], state, explored)).toEqual([{ kind: 'RESOURCE', position: [2, 1] }])
  })

  it('keeps remembered resources and obstacles inspectable', () => {
    const explored = new Map<string, ExploredCell>([
      ['8,8', { kind: 'RESOURCE', position: [8, 8] }],
      ['9,8', { kind: 'OBSTACLE', position: [9, 8] }],
    ])
    expect(mapFeaturesAt([8, 8], state, explored)[0]).toMatchObject({ kind: 'RESOURCE' })
    expect(mapFeaturesAt([9, 8], state, explored)[0]).toMatchObject({ kind: 'OBSTACLE' })
  })

  it('removes a depleted remembered resource as soon as its cell is visible', () => {
    const explored = new Map<string, ExploredCell>([['0,1', { kind: 'RESOURCE', position: [0, 1] }]])
    const visibleState: PlayerState = {
      ...state,
      objects: [
        ...state.objects,
        { kind: 'CORE', id: 'own-core', controlled: true, position: [0, 0], hp: 5, shield: 5, state: 'NORMAL' },
      ],
    }
    expect(mapFeaturesAt([0, 1], visibleState, explored)).toEqual([])
  })
})
