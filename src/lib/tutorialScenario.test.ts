import { describe, expect, it } from 'vitest'
import { positionKey } from './visibility'
import { createTutorialExplored, createTutorialState, TUTORIAL_IDS, TUTORIAL_POSITIONS } from './tutorialScenario'

const object = (step: number, id: string) => createTutorialState(step).objects.find((candidate) => candidate.id === id)

describe('tutorialScenario', () => {
  it('restores the correct deterministic state for resumed chapters', () => {
    expect(object(0, TUTORIAL_IDS.worker)).toMatchObject({ position: TUTORIAL_POSITIONS.worker, cargo: 0 })
    expect(TUTORIAL_POSITIONS.worker).not.toEqual(TUTORIAL_POSITIONS.beacon)
    expect(object(4, TUTORIAL_IDS.worker)).toMatchObject({ position: TUTORIAL_POSITIONS.resource, cargo: 0 })
    expect(object(5, TUTORIAL_IDS.worker)).toMatchObject({ position: TUTORIAL_POSITIONS.resource, cargo: 1 })
    expect(createTutorialState(5).objects.some((candidate) => candidate.kind === 'RESOURCE')).toBe(false)
    expect(createTutorialState(5).events).toContainEqual(expect.objectContaining({ event_type: 'HARVEST_SUCCEEDED' }))
    expect(object(6, TUTORIAL_IDS.worker)).toMatchObject({ position: TUTORIAL_POSITIONS.core, cargo: 1 })
    expect(createTutorialState(7).resources).toBe(21)
    expect(object(8, TUTORIAL_IDS.worker)).toMatchObject({ position: TUTORIAL_POSITIONS.beacon })
    expect(object(9, TUTORIAL_IDS.vanguard)).toMatchObject({ position: TUTORIAL_POSITIONS.core, unit_type: 'VANGUARD' })
  })

  it('records combat outcomes and the final Beacon carrier', () => {
    expect(createTutorialState(10).events).toContainEqual(expect.objectContaining({ event_type: 'SWEEP_RESOLVED' }))
    expect(createTutorialState(11).events).toContainEqual(expect.objectContaining({ event_type: 'SHOT_HIT' }))
    expect(createTutorialState(12).champion_beacon).toMatchObject({ status: 'CARRIED', carrier_id: TUTORIAL_IDS.worker })
  })

  it('provides a fully explored fixed training field', () => {
    const explored = createTutorialExplored()
    expect(explored.get(positionKey(TUTORIAL_POSITIONS.resource))?.kind).toBe('RESOURCE')
    expect(explored.get('-4,-3')?.kind).toBe('OBSTACLE')
    expect(explored.get('6,6')?.kind).toBe('EMPTY')
  })
})
