import { BowArrow } from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { resolvedShotMarkers, resolvedSweepMarkers, type ResolvedShotMarker } from '../../lib/combatAnimation'
import type { ShotMarker, SweepMarker } from '../../lib/combatPreview'
import type { ExploredCell } from '../../lib/exploration'
import { collectEntityPositions, continueOrStartMotionAnimation, interpolatePosition, type EntityMotion, type EntityMotionAnimation } from '../../lib/movementAnimation'
import type { MoveArrow } from '../../lib/movementPreview'
import type { PlayerState, Position, WorldObject } from '../../lib/types'
import { computeVisibility, positionKey } from '../../lib/visibility'
import type { MapAnchor } from './UnitActionDialog'

interface Props {
  state: PlayerState
  explored: Map<string, ExploredCell>
  selectedId: string | null
  targeting: boolean
  targetableIds: Set<string>
  moveTargets: Position[]
  moveArrows: MoveArrow[]
  sweepMarkers: SweepMarker[]
  shotMarkers: ShotMarker[]
  centerRequest: number
  zoomRequest: number
  onSelect: (object: WorldObject | null) => void
  onTarget: (object: WorldObject) => void
  onMoveTarget: (position: Position) => void
  onAnchorChange: (anchor: MapAnchor | null) => void
}

interface Camera { x: number; y: number; cell: number }
const WORKER_CARGO_CAPACITY = 1
const CORE_RESOURCE_REFERENCE = 20
const MOVE_ANIMATION_MS = 420
const SWEEP_ANIMATION_MS = 560
const SHOT_ANIMATION_MS = 520
const SELECTION_RIPPLE_MS = 900
const SELECTED_GOLD = '#f6c453'
const PRIMARY_BLUE = '#4591c5'
const PRIMARY_BLUE_LIGHT = '#a8c8dd'
const HOSTILE_CORAL = '#c66370'
const RESOURCE_GREEN = '#76b889'
const RESOURCE_GREEN_LIGHT = '#b2d2ba'

export function WorldCanvas({ state, explored, selectedId, targeting, targetableIds, moveTargets, moveArrows, sweepMarkers, shotMarkers, centerRequest, zoomRequest, onSelect, onTarget, onMoveTarget, onAnchorChange }: Props) {
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bufferRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 800, height: 600 })
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, cell: 44 })
  const drag = useRef<{ x: number; y: number; cameraX: number; cameraY: number; moved: boolean } | null>(null)
  const previousPositionsRef = useRef<Map<string, Position>>(new Map())
  const activeMovementRef = useRef<EntityMotionAnimation | null>(null)
  const activeSweepRef = useRef<{ markers: SweepMarker[]; startedAt: number } | null>(null)
  const activeShotRef = useRef<{ markers: ResolvedShotMarker[]; startedAt: number } | null>(null)
  const selectionRippleRef = useRef<{ objectId: string; startedAt: number } | null>(null)
  const previousSelectedIdRef = useRef<string | null>(null)
  const seenEventIdsRef = useRef<Set<string>>(new Set())
  const animationFrameRef = useRef<number | null>(null)
  const centeredCoreId = useRef<string | null>(null); const previousCenterRequest = useRef(centerRequest)
  const visible = useMemo(() => computeVisibility(state), [state])
  const entities = useMemo(() => state.objects.filter((object) => object.position), [state])

  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }))
    observer.observe(element); return () => observer.disconnect()
  }, [])
  useEffect(() => {
    const explicitlyRequested = centerRequest !== previousCenterRequest.current
    previousCenterRequest.current = centerRequest
    const core = entities.find((object) => object.kind === 'CORE' && object.controlled)
    if (!core?.position) { centeredCoreId.current = null; return }
    if (!explicitlyRequested && centeredCoreId.current === core.id) return
    centeredCoreId.current = core.id ?? 'controlled-core'
    setCamera((current) => ({ ...current, x: core.position![0], y: core.position![1] }))
  }, [centerRequest, entities])
  useEffect(() => { if (zoomRequest) setCamera((current) => ({ ...current, cell: Math.min(78, Math.max(24, current.cell + Math.sign(zoomRequest) * 8)) })) }, [zoomRequest])
  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || size.width <= 0 || size.height <= 0) return
    const ratio = window.devicePixelRatio || 1
    const pixelWidth = Math.max(1, Math.round(size.width * ratio)), pixelHeight = Math.max(1, Math.round(size.height * ratio))
    const buffer = bufferRef.current ?? document.createElement('canvas'); bufferRef.current = buffer
    buffer.width = pixelWidth; buffer.height = pixelHeight
    const bufferContext = buffer.getContext('2d'); if (!bufferContext) return
    bufferContext.setTransform(ratio, 0, 0, ratio, 0, 0)
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight
    const context = canvas.getContext('2d'); if (!context) return
    const nextPositions = collectEntityPositions(state)
    const reduceMotion = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const animationStart = performance.now()
    if (selectedId !== previousSelectedIdRef.current) {
      previousSelectedIdRef.current = selectedId
      selectionRippleRef.current = !reduceMotion && selectedId ? { objectId: selectedId, startedAt: animationStart } : null
    }
    activeMovementRef.current = continueOrStartMotionAnimation(previousPositionsRef.current, nextPositions, activeMovementRef.current, animationStart, reduceMotion)
    const newSweeps = resolvedSweepMarkers(state, previousPositionsRef.current, seenEventIdsRef.current)
    const newShots = resolvedShotMarkers(state, previousPositionsRef.current, seenEventIdsRef.current)
    seenEventIdsRef.current = new Set(state.events.map((event) => event.event_id))
    if (reduceMotion) {
      activeSweepRef.current = null
      activeShotRef.current = null
    } else {
      if (newSweeps.length) activeSweepRef.current = { markers: newSweeps, startedAt: animationStart }
      if (newShots.length) activeShotRef.current = { markers: newShots, startedAt: animationStart }
    }
    previousPositionsRef.current = nextPositions
    const renderFrame = (now: number) => {
      const activeMovement = activeMovementRef.current
      const activeSweep = activeSweepRef.current
      const activeShot = activeShotRef.current
      const selectionRipple = selectionRippleRef.current
      const linearProgress = activeMovement ? Math.min(1, (now - activeMovement.startedAt) / MOVE_ANIMATION_MS) : 1
      const sweepProgress = activeSweep ? Math.min(1, (now - activeSweep.startedAt) / SWEEP_ANIMATION_MS) : 1
      const shotProgress = activeShot ? Math.min(1, (now - activeShot.startedAt) / SHOT_ANIMATION_MS) : 1
      const selectionProgress = selectionRipple?.objectId === selectedId ? Math.min(1, (now - selectionRipple.startedAt) / SELECTION_RIPPLE_MS) : 1
      const easedProgress = linearProgress * linearProgress * (3 - 2 * linearProgress)
      try { drawWorld(bufferContext, size, camera, state, explored, visible, selectedId, targetableIds, moveTargets, moveArrows, sweepMarkers, shotMarkers, activeMovement?.motions ?? new Map(), easedProgress, activeSweep?.markers ?? [], sweepProgress, activeShot?.markers ?? [], shotProgress, selectionProgress) }
      catch (error) { console.error('WORLD_RENDER_FAILED', error); return }
      context.setTransform(1, 0, 0, 1, 0, 0); context.clearRect(0, 0, pixelWidth, pixelHeight); context.drawImage(buffer, 0, 0)
      if ((activeMovement && linearProgress < 1) || (activeSweep && sweepProgress < 1) || (activeShot && shotProgress < 1) || (selectionRipple && selectionProgress < 1)) animationFrameRef.current = requestAnimationFrame(renderFrame)
      else {
        if (activeMovementRef.current === activeMovement) activeMovementRef.current = null
        if (activeSweepRef.current === activeSweep) activeSweepRef.current = null
        if (activeShotRef.current === activeShot) activeShotRef.current = null
        if (selectionRippleRef.current === selectionRipple) selectionRippleRef.current = null
      }
    }
    renderFrame(performance.now())
    return () => { if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current); animationFrameRef.current = null }
  }, [size, camera, state, explored, visible, selectedId, targetableIds, moveTargets, moveArrows, sweepMarkers, shotMarkers])
  useEffect(() => {
    const selected = entities.find((object) => object.id === selectedId)
    if (!selected?.position) { onAnchorChange(null); return }
    const pointX = size.width / 2 + (selected.position[0] - camera.x) * camera.cell
    const pointY = size.height / 2 + (selected.position[1] - camera.y) * camera.cell
    const dialogWidth = Math.min(288, size.width - 24), gap = camera.cell * .65 + 12
    const selectedArrow = moveArrows.find((arrow) => arrow.objectId === selectedId)
    const horizontalSides: ('left' | 'right')[] = selectedArrow && selectedArrow.to[0] > selectedArrow.from[0] ? ['left', 'right'] : ['right', 'left']
    for (const side of horizontalSides) {
      if (side === 'right' && pointX + gap + dialogWidth <= size.width - 12) {
        onAnchorChange({ x: pointX + gap, y: Math.min(size.height - 190, Math.max(190, pointY)), side }); return
      }
      if (side === 'left' && pointX - gap - dialogWidth >= 12) {
        onAnchorChange({ x: pointX - gap, y: Math.min(size.height - 190, Math.max(190, pointY)), side }); return
      }
    }
    const x = Math.min(size.width - dialogWidth - 12, Math.max(12, pointX - dialogWidth / 2))
    onAnchorChange(pointY > size.height / 2 ? { x, y: pointY - gap, side: 'top' } : { x, y: pointY + gap, side: 'bottom' })
  }, [camera, entities, moveArrows, onAnchorChange, selectedId, size])

  const screenToWorld = (clientX: number, clientY: number): Position => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return [Math.floor(camera.x + (clientX - rect.left - size.width / 2) / camera.cell + .5), Math.floor(camera.y + (clientY - rect.top - size.height / 2) / camera.cell + .5)]
  }
  const worldToScreen = ([x, y]: Position) => ({ left: size.width / 2 + (x - camera.x) * camera.cell, top: size.height / 2 + (y - camera.y) * camera.cell })
  const choose = (position: Position) => {
    if (moveTargets.length) { if (moveTargets.some((target) => target[0] === position[0] && target[1] === position[1])) onMoveTarget(position); return }
    const candidates = entities.filter((object) => object.position?.[0] === position[0] && object.position?.[1] === position[1])
    if (targeting) { const target = candidates.find((object) => object.id && targetableIds.has(object.id)); if (target) onTarget(target); return }
    const currentIndex = candidates.findIndex((object) => object.id === selectedId)
    onSelect(candidates.length ? candidates[(currentIndex + 1) % candidates.length] : null)
  }
  return <div ref={containerRef} className={`relative h-full min-h-[420px] w-full overflow-hidden bg-space-950 ${targeting || moveTargets.length ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}`}>
    <canvas
      ref={canvasRef} className="h-full w-full touch-none" aria-label="Tactical world map"
      onWheel={(event) => { event.preventDefault(); setCamera((current) => ({ ...current, cell: Math.min(78, Math.max(24, current.cell - Math.sign(event.deltaY) * 5)) })) }}
      onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); drag.current = { x: event.clientX, y: event.clientY, cameraX: camera.x, cameraY: camera.y, moved: false } }}
      onPointerMove={(event) => { const activeDrag = drag.current; if (!activeDrag) return; const dx = event.clientX - activeDrag.x, dy = event.clientY - activeDrag.y; if (Math.abs(dx) + Math.abs(dy) > 5) activeDrag.moved = true; const cameraX = activeDrag.cameraX, cameraY = activeDrag.cameraY; setCamera((current) => ({ ...current, x: cameraX - dx / current.cell, y: cameraY - dy / current.cell })) }}
      onPointerUp={(event) => { if (drag.current && !drag.current.moved) choose(screenToWorld(event.clientX, event.clientY)); drag.current = null }}
      onPointerCancel={() => { drag.current = null }}
    />
    {shotMarkers.map((marker) => {
      const from = worldToScreen(marker.from), to = worldToScreen(marker.to), dx = to.left - from.left, dy = to.top - from.top, length = Math.hypot(dx, dy)
      const ux = dx / length, uy = dy / length, px = -uy, py = ux, side = dx > 0 ? -1 : dx < 0 ? 1 : dy > 0 ? -1 : 1
      const iconSize = Math.max(19, camera.cell * .46), left = from.left + px * side * camera.cell * .31 + ux * camera.cell * .1, top = from.top + py * side * camera.cell * .31 + uy * camera.cell * .1
      return <BowArrow key={marker.objectId} aria-hidden="true" size={iconSize} strokeWidth={1.8} style={{ left, top, transform: `translate(-50%, -50%) rotate(${Math.atan2(dy, dx) * 180 / Math.PI + 45}deg)` }} className="pointer-events-none absolute z-10 text-cyan-signal drop-shadow-[0_0_6px_rgba(69,145,197,.5)]" />
    })}
    {moveTargets.map((target) => {
      const point = worldToScreen(target), hitSize = Math.max(36, camera.cell)
      return <button key={`${target[0]},${target[1]}`} type="button" onClick={(event) => { event.stopPropagation(); onMoveTarget(target) }} aria-label={t('game.moveTo', { x: target[0], y: target[1] })} style={{ ...point, width: hitSize, height: hitSize, transform: 'translate(-50%, -50%)' }} className="focus-ring absolute z-20 rounded-gold-sm border border-cyan-signal/55 bg-indigo-deep/20 shadow-[inset_0_0_16px_rgba(69,145,197,.06)] hover:border-cyan-signal hover:bg-indigo-deep/35" />
    })}
  </div>
}

function drawWorld(ctx: CanvasRenderingContext2D, size: { width: number; height: number }, camera: Camera, state: PlayerState, explored: Map<string, ExploredCell>, visible: Set<string>, selectedId: string | null, targetableIds: Set<string>, moveTargets: Position[], moveArrows: MoveArrow[], sweepMarkers: SweepMarker[], shotMarkers: ShotMarker[], motions: Map<string, EntityMotion>, movementProgress: number, resolvedSweeps: SweepMarker[], sweepProgress: number, resolvedShots: ResolvedShotMarker[], shotProgress: number, selectionProgress: number) {
  ctx.clearRect(0, 0, size.width, size.height); ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, size.width, size.height)
  const toScreen = ([x, y]: Position) => [size.width / 2 + (x - camera.x) * camera.cell, size.height / 2 + (y - camera.y) * camera.cell] as const
  const minX = Math.floor(camera.x - size.width / camera.cell / 2) - 1, maxX = Math.ceil(camera.x + size.width / camera.cell / 2) + 1
  const minY = Math.floor(camera.y - size.height / camera.cell / 2) - 1, maxY = Math.ceil(camera.y + size.height / camera.cell / 2) + 1
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
    const key = `${x},${y}`, isVisible = visible.has(key), memory = explored.get(key)
    if (!isVisible && !memory) continue
    const [sx, sy] = toScreen([x, y]); const half = camera.cell / 2
    ctx.fillStyle = isVisible ? '#0d0d0f' : '#050505'; ctx.fillRect(sx - half, sy - half, camera.cell, camera.cell)
    ctx.strokeStyle = isVisible ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.05)'; ctx.lineWidth = 1; ctx.strokeRect(sx - half + .5, sy - half + .5, camera.cell - 1, camera.cell - 1)
    if (memory?.kind === 'OBSTACLE') drawObstacle(ctx, sx, sy, camera.cell, isVisible)
    if (memory?.kind === 'RESOURCE') drawResource(ctx, sx, sy, camera.cell, isVisible, memory.amount ?? 0, memory.capacity ?? 1)
  }
  for (const target of moveTargets) {
    const [sx, sy] = toScreen(target), size = camera.cell * .76
    ctx.fillStyle = 'rgba(31,37,91,.22)'; ctx.strokeStyle = 'rgba(69,145,197,.72)'; ctx.lineWidth = 1.5
    ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.roundRect(sx - size / 2, sy - size / 2, size, size, Math.max(3, camera.cell * .09)); ctx.fill(); ctx.stroke(); ctx.setLineDash([])
    ctx.fillStyle = PRIMARY_BLUE; ctx.beginPath(); ctx.arc(sx, sy, Math.max(2, camera.cell * .055), 0, Math.PI * 2); ctx.fill()
  }
  for (const arrow of moveArrows) drawMoveArrow(ctx, toScreen(arrow.from), toScreen(arrow.to), camera.cell, arrow.hostile ? HOSTILE_CORAL : PRIMARY_BLUE, arrow.dashed === true)
  for (const marker of sweepMarkers) drawSweepSword(ctx, toScreen(marker.from), toScreen(marker.to), camera.cell)
  for (const marker of shotMarkers) drawShotArc(ctx, toScreen(marker.from), toScreen(marker.to), camera.cell)
  const grouped = new Map<string, WorldObject[]>()
  for (const object of state.objects) if (object.position) grouped.set(positionKey(object.position), [...(grouped.get(positionKey(object.position)) ?? []), object])
  for (const objects of grouped.values()) {
    const selected = objects.find((object) => object.id === selectedId)
    const ordered = selected ? [...objects.filter((object) => object !== selected), selected] : objects
    const displayed = ordered.slice(0, 4), offsetStep = camera.cell * .065
    const placements = displayed.map((object, index) => {
      const offset = (index - (displayed.length - 1) / 2) * offsetStep
      const motion = object.id ? motions.get(object.id) : undefined
      const position = motion ? interpolatePosition(motion, movementProgress) : object.position!
      const [baseX, baseY] = toScreen(position)
      return { object, x: baseX + offset, y: baseY - offset }
    })
    placements.forEach(({ object, x, y }) => drawEntity(ctx, x, y, camera.cell, object, object.id === selectedId, Boolean(object.id && targetableIds.has(object.id)), selectionProgress))
    const meterX = placements.reduce((sum, placement) => sum + placement.x, 0) / placements.length
    const meterY = placements.reduce((sum, placement) => sum + placement.y, 0) / placements.length
    const controlledCore = objects.find((object) => object.kind === 'CORE' && object.controlled === true)
    const cargoWorker = selected?.unit_type === 'WORKER' ? selected : displayed.find((object) => object.unit_type === 'WORKER')
    const topMeterObject = selected?.kind === 'CORE' && selected.controlled ? selected : selected?.unit_type === 'WORKER' ? selected : controlledCore ?? cargoWorker
    const topMeterPlacement = placements.find(({ object }) => object === topMeterObject) ?? { x: meterX, y: meterY }
    const meterOffset = camera.cell * .34
    if (topMeterObject?.kind === 'CORE') drawCoreResources(ctx, topMeterPlacement.x, topMeterPlacement.y - meterOffset, camera.cell, state.resources)
    else if (topMeterObject?.unit_type === 'WORKER' && topMeterObject.cargo !== undefined) drawWorkerCargo(ctx, topMeterPlacement.x, topMeterPlacement.y - meterOffset, camera.cell, topMeterObject.cargo)
    const hp = objects.reduce((sum, object) => sum + (object.hp ?? 0), 0)
    const maxHp = objects.reduce((sum, object) => sum + maximumHealth(object), 0)
    if (maxHp > 0) {
      const healthY = meterY + meterOffset
      const color = objects.every((object) => object.controlled === true) ? PRIMARY_BLUE : objects.every((object) => object.controlled === false) ? HOSTILE_CORAL : '#d4d4d8'
      if (objects.length > 1) drawStackBadge(ctx, meterX + camera.cell * .36, meterY, camera.cell, objects.length, color)
      drawHealthBar(ctx, meterX, healthY, camera.cell, hp, maxHp, color)
    }
  }
  for (const marker of resolvedSweeps) drawResolvedSweep(ctx, toScreen(marker.from), toScreen(marker.to), camera.cell, sweepProgress)
  for (const marker of resolvedShots) drawResolvedShot(ctx, toScreen(marker.from), toScreen(marker.to), camera.cell, shotProgress, marker.hit)
}

function shotCurve([fromX, fromY]: readonly [number, number], [toX, toY]: readonly [number, number], cell: number) {
  const dx = toX - fromX, dy = toY - fromY, length = Math.hypot(dx, dy); if (!length) return
  const ux = dx / length, uy = dy / length, px = -uy, py = ux
  const side = dx > 0 ? -1 : dx < 0 ? 1 : dy > 0 ? -1 : 1, arcHeight = Math.min(cell * .8, length * .24)
  const arcNormalX = px * side, arcNormalY = py * side, bowX = fromX + arcNormalX * cell * .29 + ux * cell * .1, bowY = fromY + arcNormalY * cell * .29 + uy * cell * .1
  const startX = bowX + ux * cell * .08, startY = bowY + uy * cell * .08, endX = toX - ux * cell * .2, endY = toY - uy * cell * .2
  const controlX = (startX + endX) / 2 + px * arcHeight * side, controlY = (startY + endY) / 2 + py * arcHeight * side
  return { startX, startY, controlX, controlY, endX, endY }
}

function drawShotArc(ctx: CanvasRenderingContext2D, from: readonly [number, number], to: readonly [number, number], cell: number) {
  const curve = shotCurve(from, to, cell); if (!curve) return
  const { startX, startY, controlX, controlY, endX, endY } = curve
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.shadowColor = PRIMARY_BLUE; ctx.shadowBlur = 7
  ctx.strokeStyle = PRIMARY_BLUE; ctx.lineWidth = Math.max(2, cell * .055); ctx.beginPath(); ctx.moveTo(startX, startY); ctx.quadraticCurveTo(controlX, controlY, endX, endY); ctx.stroke()
  ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(244,244,245,.72)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(startX, startY); ctx.quadraticCurveTo(controlX, controlY, endX, endY); ctx.stroke()
  const tangentX = endX - controlX, tangentY = endY - controlY, tangentLength = Math.hypot(tangentX, tangentY), tx = tangentX / tangentLength, ty = tangentY / tangentLength
  const arrowSize = Math.max(7, cell * .16), arrowPX = -ty, arrowPY = tx
  ctx.fillStyle = '#f4f4f5'; ctx.beginPath(); ctx.moveTo(endX + tx * arrowSize * .35, endY + ty * arrowSize * .35); ctx.lineTo(endX - tx * arrowSize + arrowPX * arrowSize * .52, endY - ty * arrowSize + arrowPY * arrowSize * .52); ctx.lineTo(endX - tx * arrowSize - arrowPX * arrowSize * .52, endY - ty * arrowSize - arrowPY * arrowSize * .52); ctx.closePath(); ctx.fill()
  ctx.restore()
}

function drawResolvedShot(ctx: CanvasRenderingContext2D, from: readonly [number, number], to: readonly [number, number], cell: number, progress: number, hit: boolean) {
  const curve = shotCurve(from, to, cell); if (!curve) return
  const [targetX, targetY] = to
  const flightEnd = .76, flight = Math.min(1, progress / flightEnd), eased = 1 - (1 - flight) ** 3
  const inverse = 1 - eased
  const x = inverse * inverse * curve.startX + 2 * inverse * eased * curve.controlX + eased * eased * curve.endX
  const y = inverse * inverse * curve.startY + 2 * inverse * eased * curve.controlY + eased * eased * curve.endY
  const tangentX = 2 * inverse * (curve.controlX - curve.startX) + 2 * eased * (curve.endX - curve.controlX)
  const tangentY = 2 * inverse * (curve.controlY - curve.startY) + 2 * eased * (curve.endY - curve.controlY)
  const tangentLength = Math.hypot(tangentX, tangentY); if (!tangentLength) return
  const tx = tangentX / tangentLength, ty = tangentY / tangentLength, px = -ty, py = tx
  const arrowLength = Math.max(12, cell * .3), head = Math.max(5, cell * .12)
  const tailX = x - tx * arrowLength, tailY = y - ty * arrowLength
  const arrowOpacity = progress <= flightEnd ? 1 : Math.max(0, 1 - (progress - flightEnd) / (1 - flightEnd))

  ctx.save(); ctx.globalAlpha = arrowOpacity; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.shadowColor = PRIMARY_BLUE; ctx.shadowBlur = Math.max(5, cell * .12)
  ctx.strokeStyle = PRIMARY_BLUE; ctx.lineWidth = Math.max(2, cell * .045); ctx.beginPath(); ctx.moveTo(tailX, tailY); ctx.lineTo(x, y); ctx.stroke()
  ctx.fillStyle = PRIMARY_BLUE_LIGHT; ctx.beginPath(); ctx.moveTo(x + tx * head * .25, y + ty * head * .25); ctx.lineTo(x - tx * head + px * head * .55, y - ty * head + py * head * .55); ctx.lineTo(x - tx * head - px * head * .55, y - ty * head - py * head * .55); ctx.closePath(); ctx.fill()
  ctx.restore()

  if (progress < flightEnd) return
  const impact = Math.min(1, (progress - flightEnd) / (1 - flightEnd)), fade = 1 - impact
  ctx.save(); ctx.globalAlpha = fade; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1.5, cell * .035)
  if (hit) {
    ctx.strokeStyle = HOSTILE_CORAL; ctx.shadowColor = HOSTILE_CORAL; ctx.shadowBlur = Math.max(5, cell * .11)
    const radius = cell * (.1 + impact * .28)
    ctx.beginPath(); ctx.arc(targetX, targetY, radius, 0, Math.PI * 2); ctx.stroke()
    for (let index = 0; index < 4; index++) {
      const angle = Math.PI / 2 * index + Math.PI / 4, inner = radius * .35, outer = radius * 1.25
      ctx.beginPath(); ctx.moveTo(targetX + Math.cos(angle) * inner, targetY + Math.sin(angle) * inner); ctx.lineTo(targetX + Math.cos(angle) * outer, targetY + Math.sin(angle) * outer); ctx.stroke()
    }
  } else {
    ctx.strokeStyle = '#d4d4d8'; ctx.setLineDash([Math.max(3, cell * .07), Math.max(2, cell * .05)])
    ctx.beginPath(); ctx.arc(targetX, targetY, cell * (.12 + impact * .22), 0, Math.PI * 2); ctx.stroke()
  }
  ctx.restore()
}

function drawSweepSword(ctx: CanvasRenderingContext2D, [fromX, fromY]: readonly [number, number], [toX, toY]: readonly [number, number], cell: number) {
  const dx = toX - fromX, dy = toY - fromY, length = Math.hypot(dx, dy); if (!length) return
  const ux = dx / length, uy = dy / length, px = -uy, py = ux
  const handleX = fromX + ux * cell * .27, handleY = fromY + uy * cell * .27, bladeBaseX = fromX + ux * cell * .4, bladeBaseY = fromY + uy * cell * .4
  const tipX = toX - ux * cell * .12, tipY = toY - uy * cell * .12, bladeHalf = Math.max(2.5, cell * .055)
  ctx.save(); ctx.strokeStyle = '#f4f4f5'; ctx.fillStyle = PRIMARY_BLUE; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.shadowColor = PRIMARY_BLUE; ctx.shadowBlur = 6
  ctx.beginPath(); ctx.moveTo(tipX, tipY); ctx.lineTo(bladeBaseX + px * bladeHalf, bladeBaseY + py * bladeHalf); ctx.lineTo(bladeBaseX - px * bladeHalf, bladeBaseY - py * bladeHalf); ctx.closePath(); ctx.fill(); ctx.stroke()
  ctx.lineWidth = Math.max(2, cell * .05); ctx.beginPath(); ctx.moveTo(bladeBaseX + px * cell * .12, bladeBaseY + py * cell * .12); ctx.lineTo(bladeBaseX - px * cell * .12, bladeBaseY - py * cell * .12); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(handleX, handleY); ctx.lineTo(bladeBaseX, bladeBaseY); ctx.strokeStyle = '#a1a1aa'; ctx.stroke(); ctx.fillStyle = '#f4f4f5'; ctx.beginPath(); ctx.arc(handleX, handleY, Math.max(2, cell * .045), 0, Math.PI * 2); ctx.fill(); ctx.restore()
}

function drawResolvedSweep(ctx: CanvasRenderingContext2D, [fromX, fromY]: readonly [number, number], [toX, toY]: readonly [number, number], cell: number, progress: number) {
  const dx = toX - fromX, dy = toY - fromY, direction = Math.atan2(dy, dx); if (!Math.hypot(dx, dy)) return
  const attackProgress = Math.min(1, progress / .72), eased = 1 - (1 - attackProgress) ** 3
  const fade = progress < .72 ? 1 : Math.max(0, 1 - (progress - .72) / .28)
  const startAngle = direction - Math.PI * .42, currentAngle = startAngle + Math.PI * .84 * eased
  const radius = cell * .78, handleRadius = cell * .2, tipRadius = cell * .94
  const handleX = fromX + Math.cos(currentAngle) * handleRadius, handleY = fromY + Math.sin(currentAngle) * handleRadius
  const tipX = fromX + Math.cos(currentAngle) * tipRadius, tipY = fromY + Math.sin(currentAngle) * tipRadius
  ctx.save(); ctx.globalAlpha = fade; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.shadowColor = PRIMARY_BLUE; ctx.shadowBlur = cell * .14
  ctx.strokeStyle = 'rgba(69,145,197,.34)'; ctx.lineWidth = Math.max(5, cell * .13); ctx.beginPath(); ctx.arc(fromX, fromY, radius, startAngle, currentAngle); ctx.stroke()
  ctx.strokeStyle = PRIMARY_BLUE_LIGHT; ctx.lineWidth = Math.max(1.5, cell * .035); ctx.beginPath(); ctx.arc(fromX, fromY, radius, startAngle, currentAngle); ctx.stroke()
  ctx.strokeStyle = '#f4f4f5'; ctx.lineWidth = Math.max(2.5, cell * .065); ctx.beginPath(); ctx.moveTo(handleX, handleY); ctx.lineTo(tipX, tipY); ctx.stroke()
  const guardX = handleX + Math.cos(currentAngle) * cell * .17, guardY = handleY + Math.sin(currentAngle) * cell * .17, px = -Math.sin(currentAngle), py = Math.cos(currentAngle)
  ctx.beginPath(); ctx.moveTo(guardX - px * cell * .1, guardY - py * cell * .1); ctx.lineTo(guardX + px * cell * .1, guardY + py * cell * .1); ctx.stroke()
  if (progress > .42) {
    const impact = Math.min(1, (progress - .42) / .38)
    ctx.globalAlpha = fade * (1 - impact); ctx.strokeStyle = HOSTILE_CORAL; ctx.lineWidth = Math.max(1.5, cell * .04); ctx.beginPath(); ctx.arc(toX, toY, cell * (.12 + impact * .28), 0, Math.PI * 2); ctx.stroke()
  }
  ctx.restore()
}

function drawMoveArrow(ctx: CanvasRenderingContext2D, [fromX, fromY]: readonly [number, number], [toX, toY]: readonly [number, number], cell: number, color: string, dashed: boolean) {
  const dx = toX - fromX, dy = toY - fromY, length = Math.hypot(dx, dy)
  if (!length) return
  const ux = dx / length, uy = dy / length, startOffset = cell * .29, endOffset = cell * .25
  const startX = fromX + ux * startOffset, startY = fromY + uy * startOffset, endX = toX - ux * endOffset, endY = toY - uy * endOffset
  ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = Math.max(2, cell * .055); ctx.lineCap = 'round'; ctx.shadowColor = color; ctx.shadowBlur = 9
  if (dashed) ctx.setLineDash([Math.max(4, cell * .12), Math.max(3, cell * .09)])
  ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(endX, endY); ctx.stroke()
  const head = Math.max(7, cell * .18), wingX = -uy, wingY = ux
  const tipX = toX - ux * cell * .12, tipY = toY - uy * cell * .12
  ctx.beginPath(); ctx.moveTo(tipX, tipY); ctx.lineTo(endX - ux * head + wingX * head * .58, endY - uy * head + wingY * head * .58); ctx.lineTo(endX - ux * head - wingX * head * .58, endY - uy * head - wingY * head * .58); ctx.closePath()
  if (dashed) ctx.stroke(); else ctx.fill()
  ctx.restore()
}

function drawObstacle(ctx: CanvasRenderingContext2D, x: number, y: number, cell: number, visible: boolean) {
  const size = cell * .72; ctx.fillStyle = visible ? '#262626' : '#111111'; ctx.strokeStyle = visible ? '#484848' : '#242424'; ctx.lineWidth = 1.2
  ctx.beginPath(); ctx.rect(x-size/2, y-size/2, size, size); ctx.fill(); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(x-size*.3,y+size*.2); ctx.lineTo(x+size*.25,y-size*.28); ctx.strokeStyle = visible ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.08)'; ctx.stroke()
}
function drawResource(ctx: CanvasRenderingContext2D, x: number, y: number, cell: number, visible: boolean, amount: number, capacity: number) {
  const ratio = Math.max(.2, amount / Math.max(1, capacity)), size = cell * (.18 + .18 * ratio)
  if (visible) { ctx.shadowColor = RESOURCE_GREEN; ctx.shadowBlur = 6 }
  ctx.fillStyle = visible ? RESOURCE_GREEN : '#24372b'; ctx.beginPath(); ctx.moveTo(x,y-size); ctx.lineTo(x+size*.72,y); ctx.lineTo(x,y+size); ctx.lineTo(x-size*.72,y); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0
}
function drawEntity(ctx: CanvasRenderingContext2D, x: number, y: number, cell: number, object: WorldObject, selected: boolean, target: boolean, selectionProgress: number) {
  const friendly = object.controlled === true, color = selected ? SELECTED_GOLD : friendly ? PRIMARY_BLUE : HOSTILE_CORAL, size = cell * .24
  if (selected) {
    drawSelectionRipple(ctx, x, y, cell, size, object, selectionProgress)
    ctx.save(); ctx.strokeStyle = SELECTED_GOLD; ctx.lineWidth = cell * .04; ctx.shadowColor = SELECTED_GOLD; ctx.shadowBlur = cell * .16
    traceEntityShape(ctx, x, y, size * 1.12, object); ctx.stroke(); ctx.restore()
  } else if (target) {
    ctx.save(); ctx.strokeStyle = HOSTILE_CORAL; ctx.lineWidth = cell * .034; ctx.setLineDash([cell * .07, cell * .07])
    ctx.beginPath(); ctx.arc(x,y,size*1.58,0,Math.PI*2); ctx.stroke(); ctx.restore()
  }
  ctx.shadowColor = color; ctx.shadowBlur = cell * (selected ? .24 : friendly ? .16 : .11); ctx.fillStyle = selected ? 'rgba(56,38,5,.72)' : '#090909'; ctx.strokeStyle = color; ctx.lineWidth = cell * (selected ? .062 : .045)
  traceEntityShape(ctx, x, y, size, object); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0
}

function traceEntityShape(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, object: WorldObject) {
  ctx.beginPath()
  if (object.kind === 'CORE') for (let i=0;i<6;i++) { const angle=Math.PI/3*i-Math.PI/6, px=x+Math.cos(angle)*size*1.05, py=y+Math.sin(angle)*size*1.05; if (i) ctx.lineTo(px,py); else ctx.moveTo(px,py) }
  else if (object.unit_type === 'VANGUARD') { ctx.moveTo(x,y-size); ctx.lineTo(x+size,y); ctx.lineTo(x,y+size); ctx.lineTo(x-size,y) }
  else if (object.unit_type === 'RANGER') { ctx.moveTo(x,y-size); ctx.lineTo(x+size*.85,y+size*.72); ctx.lineTo(x-size*.85,y+size*.72) }
  else { ctx.rect(x-size*.72,y-size*.72,size*1.44,size*1.44) }
  ctx.closePath()
}

function drawSelectionRipple(ctx: CanvasRenderingContext2D, x: number, y: number, cell: number, size: number, object: WorldObject, progress: number) {
  if (progress >= 1) return
  ctx.save(); ctx.strokeStyle = SELECTED_GOLD; ctx.shadowColor = SELECTED_GOLD; ctx.lineWidth = Math.max(1, cell * .025)
  for (let wave = 0; wave < 2; wave++) {
    const delay = wave * .18
    if (progress < delay) continue
    const waveProgress = Math.min(1, (progress - delay) / (1 - delay))
    const eased = 1 - (1 - waveProgress) ** 3
    ctx.globalAlpha = (1 - waveProgress) * (.62 - wave * .14)
    ctx.shadowBlur = cell * (.06 + eased * .06)
    traceEntityShape(ctx, x, y, size * (1.04 + eased * .3), object); ctx.stroke()
  }
  ctx.restore()
}

function drawWorkerCargo(ctx: CanvasRenderingContext2D, x: number, y: number, cell: number, cargo: number) {
  drawMeterBar(ctx, x, y, cell, cargo, WORKER_CARGO_CAPACITY, RESOURCE_GREEN, RESOURCE_GREEN_LIGHT)
}

function drawCoreResources(ctx: CanvasRenderingContext2D, x: number, y: number, cell: number, resources: number) {
  drawMeterBar(ctx, x, y, cell, resources, CORE_RESOURCE_REFERENCE, RESOURCE_GREEN, RESOURCE_GREEN_LIGHT, String(resources))
}

function maximumHealth(object: WorldObject) {
  if (object.hp === undefined) return 0
  return object.kind === 'CORE' ? 20 : object.unit_type === 'VANGUARD' ? 4 : 2
}

function drawStackBadge(ctx: CanvasRenderingContext2D, x: number, y: number, cell: number, count: number, color: string) {
  const fontSize = cell * .13, label = `×${count}`, padding = cell * .045, height = fontSize + padding * 2
  ctx.save(); ctx.font = `600 ${fontSize}px "JetBrains Mono", monospace`; const width = ctx.measureText(label).width + padding * 2
  ctx.fillStyle = 'rgba(0,0,0,.92)'; ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(x - width / 2, y - height / 2, width, height, height / 2); ctx.fill(); ctx.stroke()
  ctx.fillStyle = '#fafafa'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, x, y + .25); ctx.restore()
}

function drawHealthBar(ctx: CanvasRenderingContext2D, x: number, y: number, cell: number, hp: number, maxHp: number, color: string) {
  drawMeterBar(ctx, x, y, cell, hp, maxHp, color, '#d4d4d8')
}

function drawMeterBar(ctx: CanvasRenderingContext2D, x: number, y: number, cell: number, value: number, maximum: number, color: string, labelColor: string, displayLabel = `${value}/${maximum}`) {
  const gap = cell * .04, maxWidth = cell * .86, barHeight = cell * .06, ratio = Math.max(0, Math.min(1, value / maximum))
  let fontSize = cell * .15
  ctx.save(); ctx.font = `600 ${fontSize}px "JetBrains Mono", monospace`; ctx.textBaseline = 'middle'
  let labelWidth = ctx.measureText(displayLabel).width
  const preferredBarWidth = cell * .35
  if (labelWidth + gap + preferredBarWidth > maxWidth) {
    fontSize = Math.max(cell * .1, fontSize * (maxWidth - gap - preferredBarWidth) / labelWidth)
    ctx.font = `600 ${fontSize}px "JetBrains Mono", monospace`; labelWidth = ctx.measureText(displayLabel).width
  }
  const barWidth = Math.max(cell * .2, Math.min(preferredBarWidth, maxWidth - labelWidth - gap))
  const startX = x - (labelWidth + gap + barWidth) / 2, barX = startX + labelWidth + gap
  ctx.fillStyle = labelColor; ctx.shadowColor = '#000'; ctx.shadowBlur = 2; ctx.fillText(displayLabel, startX, y)
  ctx.shadowBlur = 0; ctx.fillStyle = '#27272a'; ctx.fillRect(barX, y - barHeight / 2, barWidth, barHeight)
  ctx.fillStyle = color; ctx.fillRect(barX, y - barHeight / 2, barWidth * ratio, barHeight)
  ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 1; ctx.strokeRect(barX + .5, y - barHeight / 2 + .5, barWidth - 1, barHeight - 1); ctx.restore()
}
