import type { PlayerState, Position, WorldObject } from './types'

export const positionKey = ([x, y]: Position) => `${x},${y}`
const radiusFor = (object: WorldObject) => object.kind === 'CORE' ? 5 : object.unit_type === 'WORKER' ? 3 : object.unit_type === 'VANGUARD' ? 4 : 5

export function computeVisibility(state: PlayerState): Set<string> {
  const obstacles = new Set<string>()
  for (const object of state.objects) if (object.kind === 'OBSTACLE') for (const position of object.positions ?? []) obstacles.add(positionKey(position))
  const visible = new Set<string>()
  for (const object of state.objects) {
    if (!object.controlled || !object.position || (object.kind !== 'CORE' && object.kind !== 'UNIT')) continue
    const [ox, oy] = object.position; const radius = radiusFor(object)
    for (let dy = -radius; dy <= radius; dy++) {
      const remaining = radius - Math.abs(dy)
      for (let dx = -remaining; dx <= remaining; dx++) {
        const target: Position = [ox + dx, oy + dy]
        if (hasLineOfSight(object.position, target, obstacles)) visible.add(positionKey(target))
      }
    }
  }
  return visible
}

function hasLineOfSight(from: Position, to: Position, obstacles: Set<string>) {
  if (from[0] === to[0] && from[1] === to[1]) return true
  const dx = to[0] - from[0], dy = to[1] - from[1], nx = Math.abs(dx), ny = Math.abs(dy)
  const sx = Math.sign(dx), sy = Math.sign(dy); let x = from[0], y = from[1], ix = 0, iy = 0
  const blocked = (candidate: Position) => positionKey(candidate) !== positionKey(to) && obstacles.has(positionKey(candidate))
  while (ix < nx || iy < ny) {
    const decision = (1 + 2 * ix) * ny - (1 + 2 * iy) * nx
    if (decision === 0) {
      if (blocked([x + sx, y]) || blocked([x, y + sy])) return false
      x += sx; y += sy; ix++; iy++
    } else if (decision < 0) { x += sx; ix++ } else { y += sy; iy++ }
    if (blocked([x, y])) return false
  }
  return true
}
