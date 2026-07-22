import type { ExploredCell } from './exploration'
import { MAX_ENTITIES_PER_CELL } from './gameRules'
import { directionTo } from './movementPreview'
import type { CommandPlan, Direction, Position, WorldObject, PlayerState } from './types'
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

interface NavigationContext {
  explored: ReadonlyMap<string, ExploredCell>
  visible: ReadonlySet<string>
  terrainOverrides: Map<string, ExploredCell['kind']>
  enemyCells: Set<string>
  entityCounts: Map<string, number>
  objectsById: Map<string, WorldObject>
}

const directions: Position[] = [[0, -1], [1, 0], [0, 1], [-1, 0]]
const MAX_SEARCHED_CELLS = 50_000

export function findMovementPath(state: PlayerState, explored: Map<string, ExploredCell>, object: WorldObject, destination: Position, plan?: CommandPlan): PathResult {
  return findMovementPathInContext(createNavigationContext(state, explored), object, destination, plan)
}

function findMovementPathInContext(context: NavigationContext, object: WorldObject, destination: Position, plan?: CommandPlan): PathResult {
  if (!object.id || !object.controlled || !object.position || (object.kind !== 'UNIT' && object.kind !== 'CORE')) return { path: null, reason: 'NO_ROUTE' }
  if (samePosition(object.position, destination)) return { path: [object.position] }

  const destinationKey = positionKey(destination)
  if (!terrainKind(context, destinationKey)) return { path: null, reason: 'UNKNOWN_DESTINATION' }
  const projectedCounts = projectedEntityCounts(context, plan, object.id)

  const canEnter = (position: Position) => {
    const key = positionKey(position)
    const kind = terrainKind(context, key)
    if (!kind || kind === 'OBSTACLE' || (object.kind === 'CORE' && kind === 'RESOURCE')) return false
    if (context.enemyCells.has(key)) return false
    return (projectedCounts.get(key) ?? 0) < MAX_ENTITIES_PER_CELL
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
      if (!terrainKind(context, nextKey) || !canEnter(next)) continue
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

export function reachableMovementDestinations(state: PlayerState, explored: Map<string, ExploredCell>, object: WorldObject, plan?: CommandPlan): Position[] {
  if (!object.id || !object.controlled || !object.position || (object.kind !== 'UNIT' && object.kind !== 'CORE')) return []
  const context = createNavigationContext(state, explored)
  const projectedCounts = projectedEntityCounts(context, plan, object.id)
  const canEnter = (position: Position) => {
    const key = positionKey(position)
    const kind = terrainKind(context, key)
    if (!kind || kind === 'OBSTACLE' || (object.kind === 'CORE' && kind === 'RESOURCE')) return false
    if (context.enemyCells.has(key)) return false
    return (projectedCounts.get(key) ?? 0) < MAX_ENTITIES_PER_CELL
  }

  const queue: Position[] = [object.position]
  const visited = new Set([positionKey(object.position)])
  const destinations: Position[] = []
  for (let index = 0; index < queue.length && visited.size <= MAX_SEARCHED_CELLS; index++) {
    const current = queue[index]
    for (const [dx, dy] of directions) {
      const next: Position = [current[0] + dx, current[1] + dy]
      const key = positionKey(next)
      if (visited.has(key) || !canEnter(next)) continue
      visited.add(key); queue.push(next); destinations.push(next)
    }
  }
  return destinations
}

export function buildMovementRoutes(state: PlayerState, explored: Map<string, ExploredCell>, goals: MovementGoals, plan?: CommandPlan): MovementRoute[] {
  const routes: MovementRoute[] = []
  const context = createNavigationContext(state, explored)
  for (const objectId of Object.keys(goals).sort()) {
    const candidate = context.objectsById.get(objectId)
    const object = candidate?.controlled && candidate.position && (candidate.kind === 'CORE' || candidate.kind === 'UNIT') ? candidate : undefined
    if (!object?.position) continue
    const destination = goals[objectId]
    if (object.kind === 'CORE' && object.state === 'MOVING' && object.destination) {
      const prefix: Position[] = [object.position, object.destination]
      if (samePosition(object.destination, destination)) {
        routes.push({ objectId, destination, path: prefix, blocked: false })
        continue
      }
      const fromDestination = { ...object, position: object.destination, state: 'NORMAL' as const }
      const result = findMovementPathInContext(context, fromDestination, destination, plan)
      routes.push({ objectId, destination, path: result.path ? [...prefix, ...result.path.slice(1)] : prefix, blocked: !result.path })
      continue
    }
    const result = findMovementPathInContext(context, object, destination, plan)
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
  const context = createNavigationContext(state, explored)

  for (const objectId of Object.keys(goals).sort()) {
    const candidate = context.objectsById.get(objectId)
    const object = candidate?.controlled && candidate.position && (candidate.kind === 'CORE' || candidate.kind === 'UNIT') ? candidate : undefined
    if (!object?.position) { removed.push(objectId); continue }
    nextPlan = clearObjectAction(nextPlan, object)
    if (samePosition(object.position, goals[objectId])) { completed.push(objectId); continue }
    if (object.kind === 'CORE' && object.state === 'MOVING') continue

    const result = findMovementPathInContext(context, object, goals[objectId], nextPlan)
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

function createNavigationContext(state: PlayerState, explored: Map<string, ExploredCell>): NavigationContext {
  const terrainOverrides = new Map<string, ExploredCell['kind']>()
  const enemyCells = new Set<string>()
  const entityCounts = new Map<string, number>()
  const objectsById = new Map<string, WorldObject>()
  for (const object of state.objects) {
    if (object.id) objectsById.set(object.id, object)
    if (object.kind === 'OBSTACLE' || object.kind === 'RESOURCE') {
      for (const position of object.positions ?? []) terrainOverrides.set(positionKey(position), object.kind)
      continue
    }
    if ((object.kind === 'CORE' || object.kind === 'UNIT') && object.position) {
      const key = positionKey(object.position)
      entityCounts.set(key, (entityCounts.get(key) ?? 0) + 1)
      if (object.controlled === false) enemyCells.add(key)
    }
  }
  return { explored, visible: computeVisibility(state), terrainOverrides, enemyCells, entityCounts, objectsById }
}

function terrainKind(context: NavigationContext, key: string): ExploredCell['kind'] | undefined {
  return context.terrainOverrides.get(key) ?? context.explored.get(key)?.kind ?? (context.visible.has(key) ? 'EMPTY' : undefined)
}

function projectedEntityCounts(context: NavigationContext, plan: CommandPlan | undefined, excludedEntityId: string) {
  const counts = new Map(context.entityCounts)
  const excluded = context.objectsById.get(excludedEntityId)
  if (excluded?.position) adjustCount(counts, positionKey(excluded.position), -1)
  if (!plan) return counts
  for (const [objectId, action] of Object.entries(plan.unit_actions)) {
    if (objectId === excludedEntityId || action.type !== 'MOVE' || !action.direction) continue
    const object = context.objectsById.get(objectId)
    if (object?.kind !== 'UNIT' || !object.controlled || !object.position) continue
    const destination = stepPosition(object.position, action.direction)
    if (!destination) continue
    adjustCount(counts, positionKey(object.position), -1)
    adjustCount(counts, positionKey(destination), 1)
  }
  return counts
}

function adjustCount(counts: Map<string, number>, key: string, delta: number) {
  const next = (counts.get(key) ?? 0) + delta
  if (next) counts.set(key, next)
  else counts.delete(key)
}

function stepPosition([x, y]: Position, direction: Direction): Position | null {
  switch (direction) {
    case 'UP': return [x, y - 1]
    case 'RIGHT': return [x + 1, y]
    case 'DOWN': return [x, y + 1]
    case 'LEFT': return [x - 1, y]
    default: return null
  }
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
