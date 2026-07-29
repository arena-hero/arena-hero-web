import type { ExploredCell } from './exploration'
import type { PlayerState, Position, WorldObject } from './types'
import { positionKey } from './visibility'

export const TUTORIAL_IDS = {
  core: 'tutorial-core',
  worker: 'tutorial-worker',
  ranger: 'tutorial-ranger',
  vanguard: 'tutorial-vanguard',
  enemyVanguard: 'tutorial-enemy-vanguard',
  enemyRanger: 'tutorial-enemy-ranger',
} as const

export const TUTORIAL_POSITIONS = {
  core: [0, 0] as Position,
  worker: [-1, 0] as Position,
  resource: [-1, -2] as Position,
  enemyVanguard: [1, 0] as Position,
  ranger: [0, 2] as Position,
  enemyRanger: [0, 4] as Position,
  beacon: [-2, 0] as Position,
} as const

const obstacles: Position[] = [
  [-4, -3], [-3, -3], [-2, -3], [2, -3], [3, -3], [4, -3],
  [-4, 2], [-3, 2], [3, 2], [4, 2], [4, 3],
]

const event = (suffix: string, tick: number, event_type: string, actor_id: string, position: Position) => ({
  event_id: `tutorial-${suffix}`,
  tick,
  event_type,
  actor_id,
  position,
})

export function createTutorialState(step: number): PlayerState {
  const workerPosition = step >= 8 ? TUTORIAL_POSITIONS.beacon
    : step >= 6 ? TUTORIAL_POSITIONS.core
      : step >= 4 ? TUTORIAL_POSITIONS.resource
        : TUTORIAL_POSITIONS.worker
  const workerCargo = step === 5 || step === 6 ? 1 : 0
  const resources = step >= 9 ? 11 : step >= 7 ? 21 : 20
  const vanguardSpawned = step >= 9
  const beaconCarried = step >= 12
  const objects: WorldObject[] = [
    { kind: 'OBSTACLE', positions: obstacles },
    { kind: 'CORE', id: TUTORIAL_IDS.core, controlled: true, owner_username: 'you', position: TUTORIAL_POSITIONS.core, hp: 5, shield: 5, state: 'NORMAL' },
    { kind: 'UNIT', id: TUTORIAL_IDS.worker, controlled: true, position: workerPosition, hp: 2, unit_type: 'WORKER', cargo: workerCargo },
    { kind: 'UNIT', id: TUTORIAL_IDS.ranger, controlled: true, position: TUTORIAL_POSITIONS.ranger, hp: 2, unit_type: 'RANGER' },
    { kind: 'UNIT', id: TUTORIAL_IDS.enemyVanguard, controlled: false, position: TUTORIAL_POSITIONS.enemyVanguard, hp: step >= 10 ? 3 : 4, unit_type: 'VANGUARD' },
    { kind: 'UNIT', id: TUTORIAL_IDS.enemyRanger, controlled: false, position: TUTORIAL_POSITIONS.enemyRanger, hp: step >= 11 ? 1 : 2, unit_type: 'RANGER' },
  ]
  if (step <= 4) objects.splice(1, 0, { kind: 'RESOURCE', positions: [TUTORIAL_POSITIONS.resource] })
  if (vanguardSpawned) objects.push({ kind: 'UNIT', id: TUTORIAL_IDS.vanguard, controlled: true, position: TUTORIAL_POSITIONS.core, hp: 4, unit_type: 'VANGUARD' })

  return {
    status: 'ACTIVE',
    resources,
    population: vanguardSpawned ? 3 : 2,
    population_tier: 0,
    upkeep_next_tick: 0,
    champion_beacon: beaconCarried
      ? { position: TUTORIAL_POSITIONS.beacon, status: 'CARRIED', carrier_id: TUTORIAL_IDS.worker }
      : { position: TUTORIAL_POSITIONS.beacon, status: 'GROUND' },
    objects,
    events: [
      ...(step === 5 ? [event('harvest', 7005, 'HARVEST_SUCCEEDED', TUTORIAL_IDS.worker, TUTORIAL_POSITIONS.resource)] : []),
      ...(step >= 10 ? [event('sweep', 7010, 'SWEEP_RESOLVED', TUTORIAL_IDS.vanguard, TUTORIAL_POSITIONS.enemyVanguard)] : []),
      ...(step >= 11 ? [event('shot', 7011, 'SHOT_HIT', TUTORIAL_IDS.ranger, TUTORIAL_POSITIONS.enemyRanger)] : []),
    ],
  }
}

export function createTutorialExplored(): Map<string, ExploredCell> {
  const cells = new Map<string, ExploredCell>()
  for (let y = -7; y <= 7; y++) {
    for (let x = -7; x <= 7; x++) {
      const position: Position = [x, y]
      cells.set(positionKey(position), { position, kind: 'EMPTY' })
    }
  }
  for (const position of obstacles) cells.set(positionKey(position), { position, kind: 'OBSTACLE' })
  cells.set(positionKey(TUTORIAL_POSITIONS.resource), { position: TUTORIAL_POSITIONS.resource, kind: 'RESOURCE' })
  return cells
}

export function moveTutorialObject(state: PlayerState, objectId: string, position: Position): PlayerState {
  return {
    ...state,
    objects: state.objects.map((object) => object.id === objectId ? { ...object, position } : object),
    events: [],
  }
}
