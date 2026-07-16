import type { ShotMarker, SweepMarker } from './combatPreview'
import type { PlayerState, Position } from './types'

export interface ResolvedShotMarker extends ShotMarker {
  eventId: string
  hit: boolean
}

function entityPositions(state: PlayerState) {
  return new Map(state.objects.flatMap((object) => object.id && object.position ? [[object.id, object.position] as const] : []))
}

export function resolvedSweepMarkers(state: PlayerState, previousPositions: Map<string, Position>, seenEventIds: Set<string>): SweepMarker[] {
  const currentPositions = entityPositions(state)
  return state.events.flatMap((event) => {
    if (event.event_type !== 'SWEEP_RESOLVED' || seenEventIds.has(event.event_id) || !event.actor_id || !event.position) return []
    const from = previousPositions.get(event.actor_id) ?? currentPositions.get(event.actor_id)
    return from ? [{ objectId: event.actor_id, from, to: event.position }] : []
  })
}

export function resolvedShotMarkers(state: PlayerState, previousPositions: Map<string, Position>, seenEventIds: Set<string>): ResolvedShotMarker[] {
  const currentPositions = entityPositions(state)
  return state.events.flatMap((event) => {
    if ((event.event_type !== 'SHOT_HIT' && event.event_type !== 'SHOT_MISSED') || seenEventIds.has(event.event_id) || !event.actor_id || !event.position) return []
    const from = previousPositions.get(event.actor_id) ?? currentPositions.get(event.actor_id)
    return from ? [{ eventId: event.event_id, objectId: event.actor_id, from, to: event.position, hit: event.event_type === 'SHOT_HIT' }] : []
  })
}
