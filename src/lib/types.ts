export type Position = [number, number]
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
export type UnitType = 'WORKER' | 'VANGUARD' | 'RANGER'
export type UnitActionType = 'MOVE' | 'HARVEST' | 'DEPOSIT' | 'SWEEP' | 'SHOOT' | 'WAIT'
export type CoreActionType = 'SPAWN' | 'REPAIR_SHIELD' | 'START_MOVE' | 'CANCEL_MOVE' | 'WAIT'

export interface WorldObject {
  kind: 'OBSTACLE' | 'RESOURCE' | 'CORE' | 'UNIT'
  positions?: Position[]
  amount?: number
  capacity?: number
  regen_interval_ticks?: number
  id?: string
  controlled?: boolean
  position?: Position
  hp?: number
  shield?: number
  state?: 'NORMAL' | 'MOVING'
  move_direction?: Direction
  move_progress?: number
  move_required_ticks?: number
  destination?: Position
  unit_type?: UnitType
  cargo?: number
}

export interface GameEvent {
  event_id: string
  tick: number
  event_type: string
  reason_code?: string
  actor_id?: string
  target_id?: string
  position?: Position
  values?: Record<string, unknown>
}

export interface PlayerState {
  status: 'ACTIVE' | 'RESPAWNING'
  respawn_at_tick?: number
  resources: number
  population: number
  population_tier: number
  upkeep_next_tick: number
  objects: WorldObject[]
  events: GameEvent[]
}

export interface UnitAction {
  type: UnitActionType
  direction?: Direction
  target_id?: string
  expected_cell?: Position
}

export interface CoreAction {
  type: CoreActionType
  direction?: Direction
  unit_type?: UnitType
}

export interface CommandPlan {
  tick: number
  unit_actions: Record<string, UnitAction>
  core_action?: CoreAction
}

export interface Receipt {
  accepted: boolean
  tick: number
  source: 'AGENT' | 'MANUAL'
  received_at: string
}

export interface User {
  email: string
  username: string
  auth_source: 'MANUAL'
}

export interface Session {
  csrf_token: string
  expires_at: string
  username: string
}

export interface PlayerStats {
  damage_dealt: number
  damage_received: number
  unit_destruction_participations: number
  core_destruction_participations: number
  resources_harvested: number
  resources_deposited: number
  units_spawned: number
  units_lost: number
  core_survival_ticks: number
  respawn_count: number
}

export interface APIKeyView {
  id: string
  name: string
  prefix: string
  created_at: string
  last_used_at?: string
  revoked_at?: string
  key?: string
}

export type StreamPhase = 'connecting' | 'syncing' | 'open' | 'settling' | 'offline'
