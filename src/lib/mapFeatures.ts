import type { ChampionBeaconView, PlayerState, Position } from './types'
import type { ExploredCell } from './exploration'
import { positionKey } from './visibility'

export type MapFeatureKind = 'BEACON' | 'RESOURCE' | 'OBSTACLE'

export interface MapFeatureView {
  kind: MapFeatureKind
  position: Position
  status?: ChampionBeaconView['status']
}

export function mapFeaturesAt(position: Position, state: PlayerState, explored: ReadonlyMap<string, ExploredCell>): MapFeatureView[] {
  const features: MapFeatureView[] = []
  if (samePosition(state.champion_beacon.position, position)) features.push({ kind: 'BEACON', position, status: state.champion_beacon.status })

  const remembered = explored.get(positionKey(position))
  const visibleResource = state.objects.some((object) => object.kind === 'RESOURCE' && object.positions?.some((candidate) => samePosition(candidate, position)))
  if (visibleResource || remembered?.kind === 'RESOURCE') {
    features.push({ kind: 'RESOURCE', position })
  }

  const visibleObstacle = state.objects.some((object) => object.kind === 'OBSTACLE' && object.positions?.some((candidate) => samePosition(candidate, position)))
  if (visibleObstacle || remembered?.kind === 'OBSTACLE') features.push({ kind: 'OBSTACLE', position })
  return features
}

function samePosition(a: Position, b: Position) {
  return a[0] === b[0] && a[1] === b[1]
}
