import type { ExploredCell } from './exploration'
import { MAX_ENTITIES_PER_CELL } from './gameRules'
import { directionTo, projectedEntityCount } from './movementPreview'
import type { CommandPlan, Position, WorldObject, PlayerState } from './types'
import { computeVisibility, positionKey } from './visibility'

export type MovementGoals = Record<string, Position>
export type PathFailure = 'UNKNOWN_DESTINATION' | 'NO_ROUTE' | 'SEARCH_LIMIT'

export interface PathResult {
  path: Position[] | null
  reason?: PathFailure
}

export interface MovementRoute {
  objectId: string
  destination: Position
  path: Position[]
  blocked: boolean
}

interface SearchNode {
  position: Position
  key: string
  g: number
  h: number
  order: number
}

const directions: Position[] = [[0, -1], [1, 0], [0, 1], [-1, 0]]
const MAX_SEARCHED_CELLS = 50_000

export function findMovementPath(state: PlayerState, explored: Map<string, ExploredCell>, object: WorldObject, destination: Position, plan?: CommandPlan): PathResult {
  if (!object.id || !object.controlled || !object.position || (object.kind !== 'UNIT' && object.kind !== 'CORE')) return { path: null, reason: 'NO_ROUTE' }
  if (samePosition(object.position, destination)) return { path: [object.position] }

  const terrain = knownTerrain(state, explored)
  const destinationKey = positionKey(destination)
  if (!terrain.has(destinationKey)) return { path: null, reason: 'UNKNOWN_DESTINATION' }

  const canEnter = (position: Position) => {
    const kind = terrain.get(positionKey(position))
    if (!kind || kind === 'OBSTACLE' || (object.kind === 'CORE' && kind === 'RESOURCE')) return false
    const hasEnemy = state.objects.some((candidate) => candidate.id !== object.id && candidate.controlled === false && (candidate.kind === 'CORE' || candidate.kind === 'UNIT') && candidate.position && samePosition(candidate.position, position))
    if (hasEnemy) return false
    return projectedEntityCount(state, position, plan, object.id) < MAX_ENTITIES_PER_CELL
  }
  if (!canEnter(destination)) return { path: null, reason: 'NO_ROUTE' }

  const start = object.position
  const startKey = positionKey(start)
  const cameFrom = new Map<string, string>()
  const positions = new Map<string, Position>([[startKey, start]])
  const scores = new Map<string, number>([[startKey, 0]])
  const open = new MinHeap()
  let order = 0
  open.push({ position: start, key: startKey, g: 0, h: manhattan(start, destination), order: order++ })
  let searched = 0

  while (open.size > 0) {
    const current = open.pop()!
    if (current.g !== scores.get(current.key)) continue
    if (current.key === destinationKey) return { path: rebuildPath(current.key, cameFrom, positions) }
    if (++searched > MAX_SEARCHED_CELLS) return { path: null, reason: 'SEARCH_LIMIT' }

    for (const [dx, dy] of directions) {
      const next: Position = [current.position[0] + dx, current.position[1] + dy]
      const nextKey = positionKey(next)
      if (!terrain.has(nextKey) || !canEnter(next)) continue
      const nextScore = current.g + 1
      if (nextScore >= (scores.get(nextKey) ?? Number.POSITIVE_INFINITY)) continue
      cameFrom.set(nextKey, current.key)
      positions.set(nextKey, next)
      scores.set(nextKey, nextScore)
      open.push({ position: next, key: nextKey, g: nextScore, h: manhattan(next, destination), order: order++ })
    }
  }
  return { path: null, reason: 'NO_ROUTE' }
}

export function buildMovementRoutes(state: PlayerState, explored: Map<string, ExploredCell>, goals: MovementGoals, plan?: CommandPlan): MovementRoute[] {
  const routes: MovementRoute[] = []
  for (const objectId of Object.keys(goals).sort()) {
    const object = state.objects.find((candidate) => candidate.id === objectId && candidate.controlled && candidate.position && (candidate.kind === 'CORE' || candidate.kind === 'UNIT'))
    if (!object?.position) continue
    const destination = goals[objectId]
    if (object.kind === 'CORE' && object.state === 'MOVING' && object.destination) {
      const prefix: Position[] = [object.position, object.destination]
      if (samePosition(object.destination, destination)) {
        routes.push({ objectId, destination, path: prefix, blocked: false })
        continue
      }
      const fromDestination = { ...object, position: object.destination, state: 'NORMAL' as const }
      const result = findMovementPath(state, explored, fromDestination, destination, plan)
      routes.push({ objectId, destination, path: result.path ? [...prefix, ...result.path.slice(1)] : prefix, blocked: !result.path })
      continue
    }
    const result = findMovementPath(state, explored, object, destination, plan)
    routes.push({ objectId, destination, path: result.path ?? [object.position], blocked: !result.path })
  }
  return routes
}

export function applyAutonomousMovement(state: PlayerState, explored: Map<string, ExploredCell>, goals: MovementGoals, plan: CommandPlan) {
  const original = JSON.stringify(plan)
  let nextPlan: CommandPlan = { ...plan, unit_actions: { ...plan.unit_actions } }
  const completed: string[] = []
  const removed: string[] = []
  const blocked: string[] = []

  for (const objectId of Object.keys(goals).sort()) {
    const object = state.objects.find((candidate) => candidate.id === objectId && candidate.controlled && candidate.position && (candidate.kind === 'CORE' || candidate.kind === 'UNIT'))
    if (!object?.position) { removed.push(objectId); continue }
    nextPlan = clearObjectAction(nextPlan, object)
    if (samePosition(object.position, goals[objectId])) { completed.push(objectId); continue }
    if (object.kind === 'CORE' && object.state === 'MOVING') continue

    const result = findMovementPath(state, explored, object, goals[objectId], nextPlan)
    if (!result.path || result.path.length < 2) { blocked.push(objectId); continue }
    const direction = directionTo(result.path[0], result.path[1])
    if (!direction) { blocked.push(objectId); continue }
    if (object.kind === 'CORE') nextPlan = { ...nextPlan, core_action: { type: 'START_MOVE', direction } }
    else nextPlan = { ...nextPlan, unit_actions: { ...nextPlan.unit_actions, [objectId]: { type: 'MOVE', direction } } }
  }

  return { plan: nextPlan, completed, removed, blocked, changed: JSON.stringify(nextPlan) !== original }
}

export function readMovementGoals(raw: string | null): MovementGoals {
  if (!raw) return {}
  try {
    const value = JSON.parse(raw) as Record<string, unknown>
    const goals: MovementGoals = {}
    for (const [objectId, destination] of Object.entries(value)) {
      if (!Array.isArray(destination) || destination.length !== 2 || !destination.every((coordinate) => Number.isSafeInteger(coordinate))) continue
      goals[objectId] = [destination[0] as number, destination[1] as number]
    }
    return goals
  } catch {
    return {}
  }
}

function clearObjectAction(plan: CommandPlan, object: WorldObject): CommandPlan {
  if (object.kind === 'CORE') {
    const next = { ...plan }
    delete next.core_action
    return next
  }
  const unitActions = { ...plan.unit_actions }
  if (object.id) delete unitActions[object.id]
  return { ...plan, unit_actions: unitActions }
}

function knownTerrain(state: PlayerState, explored: Map<string, ExploredCell>) {
  const terrain = new Map<string, ExploredCell['kind']>()
  for (const [key, cell] of explored) terrain.set(key, cell.kind)
  for (const key of computeVisibility(state)) if (!terrain.has(key)) terrain.set(key, 'EMPTY')
  for (const object of state.objects) {
    if (object.kind !== 'OBSTACLE' && object.kind !== 'RESOURCE') continue
    for (const position of object.positions ?? []) terrain.set(positionKey(position), object.kind)
  }
  return terrain
}

function rebuildPath(destinationKey: string, cameFrom: Map<string, string>, positions: Map<string, Position>) {
  const path: Position[] = []
  let key: string | undefined = destinationKey
  while (key) {
    path.push(positions.get(key) ?? parsePosition(key))
    key = cameFrom.get(key)
  }
  return path.reverse()
}

function parsePosition(key: string): Position {
  const [x, y] = key.split(',').map(Number)
  return [x, y]
}

function samePosition(left: Position, right: Position) {
  return left[0] === right[0] && left[1] === right[1]
}

function manhattan(left: Position, right: Position) {
  return Math.abs(left[0] - right[0]) + Math.abs(left[1] - right[1])
}

class MinHeap {
  private readonly entries: SearchNode[] = []
  get size() { return this.entries.length }

  push(node: SearchNode) {
    this.entries.push(node)
    let index = this.entries.length - 1
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2)
      if (!less(node, this.entries[parent])) break
      this.entries[index] = this.entries[parent]
      index = parent
    }
    this.entries[index] = node
  }

  pop() {
    if (!this.entries.length) return undefined
    const first = this.entries[0]
    const last = this.entries.pop()!
    if (!this.entries.length) return first
    let index = 0
    while (true) {
      const left = index * 2 + 1
      const right = left + 1
      if (left >= this.entries.length) break
      const child = right < this.entries.length && less(this.entries[right], this.entries[left]) ? right : left
      if (!less(this.entries[child], last)) break
      this.entries[index] = this.entries[child]
      index = child
    }
    this.entries[index] = last
    return first
  }
}

function less(left: SearchNode, right: SearchNode) {
  const leftF = left.g + left.h
  const rightF = right.g + right.h
  return leftF !== rightF ? leftF < rightF : left.h !== right.h ? left.h < right.h : left.order < right.order
}
