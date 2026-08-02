export type Position = [number, number]
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
export type UnitType = 'WORKER' | 'VANGUARD' | 'RANGER'
export type HarvestSource = 'RESOURCE_NODE' | 'DROPPED_CARGO'
export type UnitActionType = 'MOVE' | 'HARVEST' | 'DEPOSIT' | 'SWEEP' | 'SHOOT' | 'PICKUP_BEACON' | 'DROP_BEACON' | 'SELF_DESTRUCT' | 'HEAL' | 'WAIT'
export type CoreActionType = 'SPAWN' | 'REPAIR_SHIELD' | 'START_MOVE' | 'CANCEL_MOVE' | 'PICKUP_BEACON' | 'DROP_BEACON' | 'HEAL' | 'WAIT'

export interface WorldObject {
  kind: 'OBSTACLE' | 'RESOURCE' | 'CORE' | 'UNIT'
  positions?: Position[]
  id?: string
  controlled?: boolean
  owner_username?: string
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
  values?: Record<string, unknown> & {
    amount?: number
  available?: number
  destroyed?: number
  capacity?: number
    source?: HarvestSource
  }
}

export interface ChampionBeaconView {
  position: Position
  status?: 'GROUND' | 'CARRIED'
  carrier_id?: string
}

export interface PlayerState {
  status: 'ACTIVE' | 'RESPAWNING'
  respawn_at_tick?: number
  resources: number
  population: number
  population_tier: number
  upkeep_next_tick: number
  champion_beacon: ChampionBeaconView
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

export type CommandSource = 'AGENT' | 'MANUAL'

export interface ReceiptMetadata {
  tick: number
  source: CommandSource
  received_at: string
}

export interface ReceivedNotice extends ReceiptMetadata {
  plan: CommandPlan
}

export interface Receipt extends ReceiptMetadata {
  accepted: true
}

export interface User {
  email: string
  username: string
  auth_source: 'MANUAL'
  oauth_providers: Array<'github' | 'linux_do'>
}

export interface Session {
  csrf_token: string
  expires_at: string
  username: string
}

export interface AuthOptions {
  email_registration_enabled: boolean
}

export interface PlayerStats {
  damage_dealt: number
  damage_received: number
  unit_destruction_participations: number
  core_destruction_participations: number
  resources_harvested: number
  resources_deposited: number
  beacon_pickups: number
  beacon_ticks_held: number
  beacon_bonus_resources_harvested: number
  units_spawned: number
  units_lost: number
  unit_hp_recovered: number
  core_hp_recovered: number
  core_survival_ticks: number
  respawn_count: number
}

export interface LeaderboardEntry {
  rank: number
  username: string
  score: number
}

export interface Leaderboard {
  beacon_ticks_held: LeaderboardEntry[]
  damage_dealt: LeaderboardEntry[]
  core_destruction_participations: LeaderboardEntry[]
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
