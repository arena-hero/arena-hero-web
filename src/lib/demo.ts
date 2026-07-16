import type { PlayerState, Receipt } from './types'

const id = (suffix: string) => `00000000-0000-4000-8000-${suffix.padStart(12, '0')}`

export const demoState: PlayerState = {
  status: 'ACTIVE',
  resources: 42,
  population: 6,
  population_tier: 0,
  upkeep_next_tick: 0,
  objects: [
    { kind: 'OBSTACLE', positions: [[-6,-4],[-6,-3],[-6,-2],[-2,-5],[-1,-5],[0,-5],[4,-3],[5,-3],[6,-3],[6,-2],[6,-1],[-4,4],[-3,4],[-2,4],[3,5],[4,5]] },
    { kind: 'RESOURCE', amount: 7, capacity: 10, regen_interval_ticks: 5, positions: [[-4,-2],[3,-1],[5,2],[-1,5]] },
    { kind: 'RESOURCE', amount: 10, capacity: 10, regen_interval_ticks: 5, positions: [[1,-4],[-5,1],[2,4]] },
    { kind: 'CORE', id: id('1'), controlled: true, position: [0,0], hp: 20, shield: 14, state: 'NORMAL' },
    { kind: 'UNIT', id: id('2'), controlled: true, position: [-1,0], hp: 2, unit_type: 'WORKER', cargo: 1 },
    { kind: 'UNIT', id: id('3'), controlled: true, position: [1,0], hp: 4, unit_type: 'VANGUARD' },
    { kind: 'UNIT', id: id('4'), controlled: true, position: [0,1], hp: 2, unit_type: 'RANGER' },
    { kind: 'UNIT', id: id('5'), controlled: true, position: [0,1], hp: 2, unit_type: 'RANGER' },
    { kind: 'UNIT', id: id('6'), controlled: true, position: [2,1], hp: 2, unit_type: 'WORKER', cargo: 0 },
    { kind: 'UNIT', id: id('7'), controlled: true, position: [-2,1], hp: 4, unit_type: 'VANGUARD' },
    { kind: 'CORE', id: id('91'), controlled: false, position: [6,3], hp: 16, shield: 4, state: 'MOVING', move_direction: 'LEFT', move_progress: 2, move_required_ticks: 4, destination: [5,3] },
    { kind: 'UNIT', id: id('92'), controlled: false, position: [-3,1], hp: 2, unit_type: 'RANGER' },
    { kind: 'UNIT', id: id('93'), controlled: false, position: [5,3], hp: 4, unit_type: 'VANGUARD' },
    { kind: 'UNIT', id: id('94'), controlled: false, position: [0,3], hp: 4, unit_type: 'VANGUARD' },
  ],
  events: [
    { event_id: id('101'), tick: 10582, event_type: 'SHOT_MISSED', reason_code: 'SHOT_MISSED', actor_id: id('4'), position: [5,3] },
    { event_id: id('102'), tick: 10582, event_type: 'RESOURCE_DEPOSITED', actor_id: id('2'), position: [0,0], values: { amount: 1 } },
  ],
}

export const demoReceipt: Receipt = { accepted: true, tick: 10583, source: 'MANUAL', received_at: new Date().toISOString() }
