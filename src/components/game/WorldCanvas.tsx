import { BowArrow } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { BEACON_SPRITE_PATH, beaconSpriteRect } from '../../lib/beaconArt'
import { resolvedShotMarkers, resolvedSweepMarkers, type ResolvedShotMarker } from '../../lib/combatAnimation'
import type { ShotMarker, SweepMarker } from '../../lib/combatPreview'
import type { ExploredCell } from '../../lib/exploration'
import { CORE_MAX_HP, coreResourceCapacity } from '../../lib/gameRules'
import { mapFeaturesAt, type MapFeatureView } from '../../lib/mapFeatures'
import { collectEntityPositions, continueOrStartMotionAnimation, interpolatePosition, type EntityMotion, type EntityMotionAnimation } from '../../lib/movementAnimation'
import type { MoveArrow } from '../../lib/movementPreview'
import { OBSTACLE_SPRITE_PATHS, obstacleCellShape, obstacleSpriteIndex, obstacleSpriteRect, type ObstacleCellShape } from '../../lib/obstacleArt'
import { RESOURCE_SPRITE_PATHS, resourceSpriteIndex, resourceSpriteRect } from '../../lib/resourceArt'
import type { PlayerState, Position, WorldObject } from '../../lib/types'
import { UNIT_SPRITE_PATHS, unitArtType, unitSpriteRect, type UnitArtType } from '../../lib/unitArt'
import { computeVisibility, positionKey } from '../../lib/visibility'
import { WORLD_BACKGROUND_PATH } from '../../lib/worldArt'
import { canvasPixelRatio, MAX_WORLD_CELL_SIZE, MIN_WORLD_CELL_SIZE, prioritizeSelectionCandidates, TERRAIN_CHUNK_CELLS, terrainChunkBounds, wheelZoomCell, type WorldCamera } from '../../lib/worldCanvasPerformance'
import { BeaconDirectionIndicator } from './BeaconDirectionIndicator'
import { MapFeatureInfo } from './MapFeatureInfo'
import type { MapAnchor } from './UnitActionDialog'

interface Props {
  state: PlayerState
  explored: Map<string, ExploredCell>
  selectedId: string | null
  targeting: boolean
  destinationSelecting: boolean
  targetableIds: Set<string>
  routeDestinations: RouteDestination[]
  moveArrows: MoveArrow[]
  sweepMarkers: SweepMarker[]
  shotMarkers: ShotMarker[]
  centerPosition?: Position | null
  centerRequest: number
  zoomRequest: number
  onSelect: (object: WorldObject | null) => void
  onTarget: (object: WorldObject) => void
  onMoveDestination: (position: Position) => void
  onCenterBeacon: () => void
  onAnchorChange: (anchor: MapAnchor | null) => void
  highlightPositions?: Position[]
  preferredSelectionId?: string
}

export interface RouteDestination { objectId: string; position: Position; blocked: boolean; selectable?: boolean; immediate?: boolean }

type Camera = WorldCamera
const MOVE_ANIMATION_MS = 420
const SWEEP_ANIMATION_MS = 560
const SHOT_ANIMATION_MS = 520
const SELECTION_RIPPLE_MS = 900
const CAMERA_FRAME_INTERVAL_MS = 1000 / 60
const ZOOM_SETTLE_MS = 120
const TERRAIN_CHUNK_PADDING_CELLS = 1
const TERRAIN_CACHE_PIXEL_BUDGET = 12_000_000
const SELECTED_GOLD = '#f6c453'
const PRIMARY_BLUE = '#4591c5'
const PRIMARY_BLUE_LIGHT = '#a8c8dd'
const AGENT_VIOLET = '#8f91c7'
const HOSTILE_CORAL = '#c66370'
const RESOURCE_GREEN = '#76b889'
const RESOURCE_GREEN_LIGHT = '#b2d2ba'
const BEACON_GOLD = '#d9a62e'
const BEACON_GOLD_LIGHT = '#ffe29a'
interface CachedUnitSprite { canvas: HTMLCanvasElement; width: number; height: number; padding: number }
interface CachedBeaconSprite { canvas: HTMLCanvasElement; size: number }
interface TerrainScene {
  explored: Map<string, ExploredCell>
  visible: Set<string>
  visibleObstacleCells: Set<string>
  visibleResourceCells: Set<string>
  obstacleSprites: HTMLImageElement[]
  resourceSprites: HTMLImageElement[]
}
interface CachedTerrainTile { canvas: HTMLCanvasElement; pixels: number; cell: number }
interface TerrainTileCache {
  scene: TerrainScene
  cell: number
  ratio: number
  pixels: number
  tiles: Map<string, CachedTerrainTile>
}
const unitSpriteCache = new WeakMap<HTMLImageElement, Map<string, CachedUnitSprite>>()
const beaconSpriteCache = new WeakMap<HTMLImageElement, Map<string, CachedBeaconSprite>>()

export function WorldCanvas({ state, explored, selectedId, targeting, destinationSelecting, targetableIds, routeDestinations, moveArrows, sweepMarkers, shotMarkers, centerPosition, centerRequest, zoomRequest, onSelect, onTarget, onMoveDestination, onCenterBeacon, onAnchorChange, highlightPositions = [], preferredSelectionId }: Props) {
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const terrainCacheRef = useRef<TerrainTileCache | null>(null)
  const [size, setSize] = useState({ width: 800, height: 600 })
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, cell: 44 })
  const [obstacleSprites, setObstacleSprites] = useState<HTMLImageElement[]>([])
  const [resourceSprites, setResourceSprites] = useState<HTMLImageElement[]>([])
  const [unitSprites, setUnitSprites] = useState<Partial<Record<UnitArtType, HTMLImageElement>>>({})
  const [beaconSprite, setBeaconSprite] = useState<HTMLImageElement | null>(null)
  const [inspectedFeature, setInspectedFeature] = useState<MapFeatureView | null>(null)
  const [zooming, setZooming] = useState(false)
  const drag = useRef<{ x: number; y: number; cameraX: number; cameraY: number; moved: boolean } | null>(null)
  const previousPositionsRef = useRef<Map<string, Position>>(new Map())
  const activeMovementRef = useRef<EntityMotionAnimation | null>(null)
  const activeSweepRef = useRef<{ markers: SweepMarker[]; startedAt: number } | null>(null)
  const activeShotRef = useRef<{ markers: ResolvedShotMarker[]; startedAt: number } | null>(null)
  const selectionRippleRef = useRef<{ objectId: string; startedAt: number } | null>(null)
  const previousSelectedIdRef = useRef<string | null>(null)
  const seenEventIdsRef = useRef<Set<string>>(new Set())
  const animationFrameRef = useRef<number | null>(null)
  const cameraFrameRef = useRef<number | null>(null)
  const zoomEndTimeoutRef = useRef<number | null>(null)
  const lastCameraCommitAtRef = useRef(0)
  const pendingCameraRef = useRef<Camera | null>(null)
  const cameraRef = useRef(camera)
  const centeredCoreId = useRef<string | null>(null); const previousCenterRequest = useRef(centerRequest)
  const visible = useMemo(() => computeVisibility(state), [state])
  const entities = useMemo(() => state.objects.filter((object) => object.position), [state])
  const entityGroupsByPosition = useMemo(() => groupEntitiesByPosition(state.objects), [state.objects])
  const visibleObstacleCells = useMemo(() => collectTerrainObjectPositions(state.objects, 'OBSTACLE'), [state.objects])
  const visibleResourceCells = useMemo(() => collectTerrainObjectPositions(state.objects, 'RESOURCE'), [state.objects])
  const routeDestinationsByPosition = useMemo(() => groupRouteDestinations(routeDestinations), [routeDestinations])
  const moveArrowsByPosition = useMemo(() => groupMarkersByOrigin(moveArrows), [moveArrows])
  const sweepMarkersByPosition = useMemo(() => groupMarkersByOrigin(sweepMarkers), [sweepMarkers])
  const shotMarkersByPosition = useMemo(() => groupMarkersByOrigin(shotMarkers), [shotMarkers])
  const terrainScene = useMemo<TerrainScene>(() => ({
    explored,
    visible,
    visibleObstacleCells,
    visibleResourceCells,
    obstacleSprites,
    resourceSprites,
  }), [explored, obstacleSprites, resourceSprites, visible, visibleObstacleCells, visibleResourceCells])
  const visibleShotMarkers = useMemo(() => shotMarkers.filter((marker) => positionInViewport(marker.from, camera, size, 1) || positionInViewport(marker.to, camera, size, 1)), [camera, shotMarkers, size])
  const inspectedFeatureView = useMemo(() => inspectedFeature ? mapFeaturesAt(inspectedFeature.position, state, explored).find((feature) => feature.kind === inspectedFeature.kind) ?? null : null, [explored, inspectedFeature, state])

  const scheduleCamera = useCallback((update: (current: Camera) => Camera) => {
    const current = pendingCameraRef.current ?? cameraRef.current
    pendingCameraRef.current = update(current)
    if (cameraFrameRef.current !== null) return
    cameraFrameRef.current = requestAnimationFrame(function commitCamera(timestamp) {
      if (timestamp - lastCameraCommitAtRef.current < CAMERA_FRAME_INTERVAL_MS - 1) {
        cameraFrameRef.current = requestAnimationFrame(commitCamera)
        return
      }
      cameraFrameRef.current = null
      const pending = pendingCameraRef.current
      pendingCameraRef.current = null
      if (!pending) return
      lastCameraCommitAtRef.current = timestamp
      cameraRef.current = pending
      setCamera(pending)
    })
  }, [])
  const scheduleZoom = useCallback((nextCell: (current: number) => number) => {
    setZooming(true)
    scheduleCamera((current) => ({ ...current, cell: nextCell(current.cell) }))
    if (zoomEndTimeoutRef.current !== null) window.clearTimeout(zoomEndTimeoutRef.current)
    zoomEndTimeoutRef.current = window.setTimeout(() => {
      zoomEndTimeoutRef.current = null
      setZooming(false)
    }, ZOOM_SETTLE_MS)
  }, [scheduleCamera])

  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }))
    observer.observe(element); return () => observer.disconnect()
  }, [])
  useEffect(() => { if (selectedId) setInspectedFeature(null) }, [selectedId])
  useEffect(() => { if (inspectedFeature && !inspectedFeatureView) setInspectedFeature(null) }, [inspectedFeature, inspectedFeatureView])
  useLayoutEffect(() => { cameraRef.current = camera }, [camera])
  useEffect(() => () => {
    if (cameraFrameRef.current !== null) cancelAnimationFrame(cameraFrameRef.current)
    if (zoomEndTimeoutRef.current !== null) window.clearTimeout(zoomEndTimeoutRef.current)
  }, [])
  useEffect(() => () => {
    if (terrainCacheRef.current) releaseTerrainTiles(terrainCacheRef.current)
    terrainCacheRef.current = null
  }, [])
  useEffect(() => {
    let active = true
    const sprites = OBSTACLE_SPRITE_PATHS.map(() => new Image())
    let settledSprites = 0
    const settleSprite = () => {
      settledSprites++
      if (active && settledSprites === sprites.length) setObstacleSprites(sprites.filter((sprite) => sprite.complete && sprite.naturalWidth > 0))
    }
    sprites.forEach((sprite, index) => {
      sprite.decoding = 'async'; sprite.onload = settleSprite; sprite.onerror = settleSprite; sprite.src = OBSTACLE_SPRITE_PATHS[index]
    })
    const crystals = RESOURCE_SPRITE_PATHS.map(() => new Image())
    let settledCrystals = 0
    const settleCrystal = () => {
      settledCrystals++
      if (active && settledCrystals === crystals.length) setResourceSprites(crystals.filter((crystal) => crystal.complete && crystal.naturalWidth > 0))
    }
    crystals.forEach((crystal, index) => {
      crystal.decoding = 'async'; crystal.onload = settleCrystal; crystal.onerror = settleCrystal; crystal.src = RESOURCE_SPRITE_PATHS[index]
    })
    const unitEntries = Object.entries(UNIT_SPRITE_PATHS) as [UnitArtType, string][]
    const units: Partial<Record<UnitArtType, HTMLImageElement>> = {}
    let settledUnits = 0
    const settleUnit = (type: UnitArtType, image: HTMLImageElement) => {
      settledUnits++
      if (image.complete && image.naturalWidth > 0) units[type] = image
      if (active && settledUnits === unitEntries.length) setUnitSprites({ ...units })
    }
    unitEntries.forEach(([type, path]) => {
      const image = new Image(); image.decoding = 'async'; image.onload = () => settleUnit(type, image); image.onerror = () => settleUnit(type, image); image.src = path
    })
    const beacon = new Image()
    beacon.decoding = 'async'; beacon.onload = () => { if (active) setBeaconSprite(beacon) }; beacon.onerror = () => { if (active) setBeaconSprite(null) }; beacon.src = BEACON_SPRITE_PATH
    return () => { active = false }
  }, [])
  useEffect(() => {
    const explicitlyRequested = centerRequest !== previousCenterRequest.current
    previousCenterRequest.current = centerRequest
    if (explicitlyRequested && centerPosition) {
      setCamera((current) => ({ ...current, x: centerPosition[0], y: centerPosition[1] }))
      return
    }
    const core = entities.find((object) => object.kind === 'CORE' && object.controlled)
    if (!core?.position) { centeredCoreId.current = null; return }
    if (!explicitlyRequested && centeredCoreId.current === core.id) return
    centeredCoreId.current = core.id ?? 'controlled-core'
    setCamera((current) => ({ ...current, x: core.position![0], y: core.position![1] }))
  }, [centerPosition, centerRequest, entities])
  useEffect(() => {
    if (zoomRequest) scheduleZoom((current) => Math.min(MAX_WORLD_CELL_SIZE, Math.max(MIN_WORLD_CELL_SIZE, current + Math.sign(zoomRequest) * 8)))
  }, [scheduleZoom, zoomRequest])
  useLayoutEffect(() => {
    const canvas = canvasRef.current
    const backgroundCanvas = backgroundCanvasRef.current
    if (!canvas || !backgroundCanvas || size.width <= 0 || size.height <= 0) return
    const ratio = canvasPixelRatio(size, window.devicePixelRatio || 1)
    const pixelWidth = Math.max(1, Math.round(size.width * ratio)), pixelHeight = Math.max(1, Math.round(size.height * ratio))
    if (backgroundCanvas.width !== pixelWidth) backgroundCanvas.width = pixelWidth
    if (backgroundCanvas.height !== pixelHeight) backgroundCanvas.height = pixelHeight
    const backgroundContext = backgroundCanvas.getContext('2d'); if (!backgroundContext) return
    backgroundContext.setTransform(ratio, 0, 0, ratio, 0, 0)
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight
    const context = canvas.getContext('2d'); if (!context) return
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    drawTiledWorldTerrain(backgroundContext, size, camera, ratio, terrainScene, terrainCacheRef, zooming)
    drawWorldPlanMarkers(backgroundContext, size, camera, routeDestinationsByPosition, moveArrowsByPosition, sweepMarkersByPosition, shotMarkersByPosition)
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
    const visibleEntityGroups = collectVisibleEntityGroups(entityGroupsByPosition, camera, size)
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
      try { drawWorldEntities(context, size, camera, state, unitSprites, beaconSprite, visibleEntityGroups, selectedId, targetableIds, activeMovement?.motions ?? new Map(), easedProgress, activeSweep?.markers ?? [], sweepProgress, activeShot?.markers ?? [], shotProgress, selectionProgress) }
      catch (error) { console.error('WORLD_RENDER_FAILED', error); return }
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
  }, [size, camera, state, terrainScene, unitSprites, beaconSprite, entityGroupsByPosition, selectedId, targetableIds, routeDestinationsByPosition, moveArrowsByPosition, sweepMarkersByPosition, shotMarkersByPosition, zooming])
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
    if (destinationSelecting) { onMoveDestination(position); return }
    const candidates = prioritizeSelectionCandidates(entityGroupsByPosition.get(positionKey(position)) ?? [], preferredSelectionId)
    if (targeting) { const target = candidates.find((object) => object.id && targetableIds.has(object.id)); if (target) onTarget(target); return }
    const features = mapFeaturesAt(position, state, explored)
    const choices: ({ key: string; type: 'object'; object: WorldObject } | { key: string; type: 'feature'; feature: MapFeatureView })[] = [
      ...candidates.map((object) => ({ key: `object:${object.id}`, type: 'object' as const, object })),
      ...features.map((feature) => ({ key: `feature:${feature.kind}:${positionKey(feature.position)}`, type: 'feature' as const, feature })),
    ]
    const currentKey = selectedId ? `object:${selectedId}` : inspectedFeature ? `feature:${inspectedFeature.kind}:${positionKey(inspectedFeature.position)}` : null
    const currentIndex = choices.findIndex((choice) => choice.key === currentKey)
    const next = choices.length ? choices[(currentIndex + 1) % choices.length] : null
    if (!next) { setInspectedFeature(null); onSelect(null); return }
    if (next.type === 'object') { setInspectedFeature(null); onSelect(next.object); return }
    setInspectedFeature(next.feature); onSelect(null)
  }
  const featureAnchor = inspectedFeatureView ? mapFeatureAnchor(inspectedFeatureView.position, camera, size) : null
  return <div ref={containerRef} style={{ backgroundImage: `url(${WORLD_BACKGROUND_PATH})`, backgroundPosition: 'center', backgroundSize: 'cover' }} className={`relative h-full min-h-[420px] w-full overflow-hidden bg-space-950 ${targeting || destinationSelecting ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}`}>
    <canvas ref={backgroundCanvasRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />
    <canvas
      ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" aria-label="Tactical world map"
      onWheel={(event) => {
        event.preventDefault()
        const { deltaY, deltaMode } = event
        scheduleZoom((current) => wheelZoomCell(current, deltaY, deltaMode, size.height))
      }}
      onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); const current = cameraRef.current; drag.current = { x: event.clientX, y: event.clientY, cameraX: current.x, cameraY: current.y, moved: false } }}
      onPointerMove={(event) => { const activeDrag = drag.current; if (!activeDrag) return; const dx = event.clientX - activeDrag.x, dy = event.clientY - activeDrag.y; if (Math.abs(dx) + Math.abs(dy) > 5) activeDrag.moved = true; const cameraX = activeDrag.cameraX, cameraY = activeDrag.cameraY; scheduleCamera((current) => ({ ...current, x: cameraX - dx / current.cell, y: cameraY - dy / current.cell })) }}
      onPointerUp={(event) => { if (drag.current && !drag.current.moved) choose(screenToWorld(event.clientX, event.clientY)); drag.current = null }}
      onPointerCancel={() => { drag.current = null }}
    />
    {highlightPositions.map((position) => {
      const point = worldToScreen(position)
      const diameter = Math.max(30, camera.cell * .78)
      return <span
        key={positionKey(position)}
        aria-hidden="true"
        className="tutorial-map-highlight pointer-events-none absolute z-10 rounded-gold"
        style={{ left: point.left, top: point.top, width: diameter, height: diameter, transform: 'translate(-50%, -50%)' }}
      />
    })}
    {visibleShotMarkers.map((marker) => {
      const from = worldToScreen(marker.from), to = worldToScreen(marker.to), dx = to.left - from.left, dy = to.top - from.top, length = Math.hypot(dx, dy)
      const ux = dx / length, uy = dy / length, px = -uy, py = ux, side = dx > 0 ? -1 : dx < 0 ? 1 : dy > 0 ? -1 : 1
      const iconSize = Math.max(19, camera.cell * .46), left = from.left + px * side * camera.cell * .31 + ux * camera.cell * .1, top = from.top + py * side * camera.cell * .31 + uy * camera.cell * .1
      return <BowArrow key={marker.objectId} aria-hidden="true" size={iconSize} strokeWidth={1.8} style={{ left, top, transform: `translate(-50%, -50%) rotate(${Math.atan2(dy, dx) * 180 / Math.PI + 45}deg)` }} className={`pointer-events-none absolute z-10 ${marker.source === 'AGENT' ? 'text-violet-300 drop-shadow-[0_0_6px_rgba(143,145,199,.5)]' : 'text-cyan-signal drop-shadow-[0_0_6px_rgba(69,145,197,.5)]'}`} />
    })}
    <BeaconDirectionIndicator beacon={state.champion_beacon} camera={camera} viewport={size} onCenter={onCenterBeacon} />
    {inspectedFeatureView && featureAnchor && <MapFeatureInfo feature={inspectedFeatureView} anchor={featureAnchor} onClose={() => setInspectedFeature(null)} />}
  </div>
}

function mapFeatureAnchor(position: Position, camera: Camera, size: { width: number; height: number }): MapAnchor {
  const pointX = size.width / 2 + (position[0] - camera.x) * camera.cell
  const pointY = size.height / 2 + (position[1] - camera.y) * camera.cell
  const dialogWidth = Math.min(240, size.width - 24), gap = camera.cell * .58 + 10
  const y = Math.min(size.height - 96, Math.max(96, pointY))
  if (pointX + gap + dialogWidth <= size.width - 12) return { x: pointX + gap, y, side: 'right' }
  if (pointX - gap - dialogWidth >= 12) return { x: pointX - gap, y, side: 'left' }
  const x = Math.min(size.width - dialogWidth - 12, Math.max(12, pointX - dialogWidth / 2))
  return pointY > size.height / 2 ? { x, y: pointY - gap, side: 'top' } : { x, y: pointY + gap, side: 'bottom' }
}

function drawTiledWorldTerrain(
  ctx: CanvasRenderingContext2D,
  size: { width: number; height: number },
  camera: Camera,
  ratio: number,
  scene: TerrainScene,
  cacheRef: { current: TerrainTileCache | null },
  allowScaledCache: boolean,
) {
  let cache = cacheRef.current
  if (!cache || cache.scene !== scene || (!allowScaledCache && cache.cell !== camera.cell) || cache.ratio !== ratio) {
    if (cache) releaseTerrainTiles(cache)
    cache = { scene, cell: camera.cell, ratio, pixels: 0, tiles: new Map() }
    cacheRef.current = cache
  }

  ctx.clearRect(0, 0, size.width, size.height)
  const bounds = terrainChunkBounds(camera, size)
  const visibleKeys = new Set<string>()
  const chunkWorldSize = TERRAIN_CHUNK_CELLS * camera.cell

  for (let chunkY = bounds.minY; chunkY <= bounds.maxY; chunkY++) {
    for (let chunkX = bounds.minX; chunkX <= bounds.maxX; chunkX++) {
      const key = `${chunkX},${chunkY}`
      visibleKeys.add(key)
      let tile = cache.tiles.get(key)
      if (!tile) {
        tile = createTerrainTile(chunkX, chunkY, allowScaledCache ? camera.cell : cache.cell, ratio, scene)
        cache.tiles.set(key, tile)
        cache.pixels += tile.pixels
      } else {
        cache.tiles.delete(key)
        cache.tiles.set(key, tile)
      }
      const worldLeft = chunkX * TERRAIN_CHUNK_CELLS - .5
      const worldTop = chunkY * TERRAIN_CHUNK_CELLS - .5
      const screenX = size.width / 2 + (worldLeft - camera.x) * camera.cell
      const screenY = size.height / 2 + (worldTop - camera.y) * camera.cell
      const sourceOffset = TERRAIN_CHUNK_PADDING_CELLS * tile.cell * ratio
      const sourceSize = TERRAIN_CHUNK_CELLS * tile.cell * ratio
      ctx.drawImage(tile.canvas, sourceOffset, sourceOffset, sourceSize, sourceSize, screenX, screenY, chunkWorldSize, chunkWorldSize)
    }
  }

  evictTerrainTiles(cache, visibleKeys)
}

function createTerrainTile(chunkX: number, chunkY: number, cell: number, ratio: number, scene: TerrainScene): CachedTerrainTile {
  const paddedCells = TERRAIN_CHUNK_CELLS + TERRAIN_CHUNK_PADDING_CELLS * 2
  const cssSize = paddedCells * cell
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.ceil(cssSize * ratio))
  canvas.height = Math.max(1, Math.ceil(cssSize * ratio))
  const context = canvas.getContext('2d')
  if (!context) return { canvas, pixels: canvas.width * canvas.height, cell }
  context.setTransform(ratio, 0, 0, ratio, 0, 0)
  const firstX = chunkX * TERRAIN_CHUNK_CELLS
  const firstY = chunkY * TERRAIN_CHUNK_CELLS
  const tileCamera: Camera = {
    x: firstX + (TERRAIN_CHUNK_CELLS - 1) / 2,
    y: firstY + (TERRAIN_CHUNK_CELLS - 1) / 2,
    cell,
  }
  drawWorldTerrain(context, { width: cssSize, height: cssSize }, tileCamera, scene)
  return { canvas, pixels: canvas.width * canvas.height, cell }
}

function evictTerrainTiles(cache: TerrainTileCache, visibleKeys: Set<string>) {
  if (cache.pixels <= TERRAIN_CACHE_PIXEL_BUDGET) return
  for (const [key, tile] of cache.tiles) {
    if (visibleKeys.has(key)) continue
    cache.tiles.delete(key)
    cache.pixels -= tile.pixels
    tile.canvas.width = 1
    tile.canvas.height = 1
    if (cache.pixels <= TERRAIN_CACHE_PIXEL_BUDGET) break
  }
}

function releaseTerrainTiles(cache: TerrainTileCache) {
  for (const tile of cache.tiles.values()) {
    tile.canvas.width = 1
    tile.canvas.height = 1
  }
  cache.tiles.clear()
  cache.pixels = 0
}

function drawWorldTerrain(ctx: CanvasRenderingContext2D, size: { width: number; height: number }, camera: Camera, scene: TerrainScene) {
  const { explored, visible, visibleObstacleCells, visibleResourceCells, obstacleSprites, resourceSprites } = scene
  ctx.clearRect(0, 0, size.width, size.height); ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(0, 0, size.width, size.height)
  const toScreen = ([x, y]: Position) => [size.width / 2 + (x - camera.x) * camera.cell, size.height / 2 + (y - camera.y) * camera.cell] as const
  const minX = Math.floor(camera.x - size.width / camera.cell / 2) - 1, maxX = Math.ceil(camera.x + size.width / camera.cell / 2) + 1
  const minY = Math.floor(camera.y - size.height / camera.cell / 2) - 1, maxY = Math.ceil(camera.y + size.height / camera.cell / 2) + 1
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
    const key = `${x},${y}`, isVisible = visible.has(key), memory = explored.get(key)
    if (!isVisible && !memory) continue
    const [sx, sy] = toScreen([x, y]); const half = camera.cell / 2
    ctx.fillStyle = isVisible ? 'rgba(13,13,15,.82)' : 'rgba(5,5,5,.9)'; ctx.fillRect(sx - half, sy - half, camera.cell, camera.cell)
    ctx.strokeStyle = isVisible ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.05)'; ctx.lineWidth = 1; ctx.strokeRect(sx - half + .5, sy - half + .5, camera.cell - 1, camera.cell - 1)
  }
  const renderedObstacles: ObstacleRenderCell[] = []
  const renderedResources: { position: Position; x: number; y: number; visible: boolean }[] = []
  const obstacleCells = new Set<string>()
  for (let y = minY - 1; y <= maxY + 1; y++) for (let x = minX - 1; x <= maxX + 1; x++) {
    const key = `${x},${y}`
    if (visibleObstacleCells.has(key) || explored.get(key)?.kind === 'OBSTACLE') obstacleCells.add(key)
  }
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
    const key = positionKey([x, y]), memory = explored.get(key), isVisible = visible.has(key)
    if (obstacleCells.has(key) && (isVisible || memory)) {
      const [screenX, screenY] = toScreen([x, y])
      renderedObstacles.push({ position: [x, y], x: screenX, y: screenY, visible: isVisible, shape: obstacleCellShape([x, y], obstacleCells) })
    } else if (visibleResourceCells.has(key) || (!isVisible && memory?.kind === 'RESOURCE')) {
      const [screenX, screenY] = toScreen([x, y])
      renderedResources.push({ position: [x, y], x: screenX, y: screenY, visible: isVisible })
    }
  }
  drawObstacleTerrain(ctx, renderedObstacles, camera.cell, obstacleSprites)
  for (const resource of renderedResources) drawResource(ctx, resource.position, resource.x, resource.y, camera.cell, resource.visible, resourceSprites)
}

function drawWorldPlanMarkers(ctx: CanvasRenderingContext2D, size: { width: number; height: number }, camera: Camera, routeDestinations: Map<string, RouteDestination[]>, moveArrows: Map<string, MoveArrow[]>, sweepMarkers: Map<string, SweepMarker[]>, shotMarkers: Map<string, ShotMarker[]>) {
  const toScreen = ([x, y]: Position) => [size.width / 2 + (x - camera.x) * camera.cell, size.height / 2 + (y - camera.y) * camera.cell] as const
  const minX = Math.floor(camera.x - size.width / camera.cell / 2) - 1, maxX = Math.ceil(camera.x + size.width / camera.cell / 2) + 1
  const minY = Math.floor(camera.y - size.height / camera.cell / 2) - 1, maxY = Math.ceil(camera.y + size.height / camera.cell / 2) + 1
  // Ranger previews span up to three cells, so include a small marker margin
  // without scanning every planned marker on each camera frame.
  for (let y = minY - 3; y <= maxY + 3; y++) for (let x = minX - 3; x <= maxX + 3; x++) {
    const key = `${x},${y}`
    for (const destination of routeDestinations.get(key) ?? []) drawRouteDestination(ctx, toScreen(destination.position), camera.cell, destination.blocked, destination.selectable === true, destination.immediate === true)
    for (const arrow of moveArrows.get(key) ?? []) drawMoveArrow(ctx, toScreen(arrow.from), toScreen(arrow.to), camera.cell, arrow.hostile ? HOSTILE_CORAL : arrow.source === 'AGENT' ? AGENT_VIOLET : PRIMARY_BLUE, arrow.dashed === true)
    for (const marker of sweepMarkers.get(key) ?? []) drawSweepSword(ctx, toScreen(marker.from), toScreen(marker.to), camera.cell, marker.source === 'AGENT' ? AGENT_VIOLET : PRIMARY_BLUE)
    for (const marker of shotMarkers.get(key) ?? []) drawShotArc(ctx, toScreen(marker.from), toScreen(marker.to), camera.cell, marker.source === 'AGENT' ? AGENT_VIOLET : PRIMARY_BLUE)
  }
}

function drawWorldEntities(ctx: CanvasRenderingContext2D, size: { width: number; height: number }, camera: Camera, state: PlayerState, unitSprites: Partial<Record<UnitArtType, HTMLImageElement>>, beaconSprite: HTMLImageElement | null, entityGroups: WorldObject[][], selectedId: string | null, targetableIds: Set<string>, motions: Map<string, EntityMotion>, movementProgress: number, resolvedSweeps: SweepMarker[], sweepProgress: number, resolvedShots: ResolvedShotMarker[], shotProgress: number, selectionProgress: number) {
  ctx.clearRect(0, 0, size.width, size.height)
  const toScreen = ([x, y]: Position) => [size.width / 2 + (x - camera.x) * camera.cell, size.height / 2 + (y - camera.y) * camera.cell] as const
  let beaconPoint = toScreen(state.champion_beacon.position)
  let carriedBeaconDrawn = false
  const beaconCarried = state.champion_beacon.status === 'CARRIED'
  const beaconBuffActive = state.champion_beacon.status === 'CARRIED' && state.objects.some((object) => object.controlled === true && object.id === state.champion_beacon.carrier_id)
  // A grounded Beacon is terrain-sized, so paint it below entities sharing its
  // cell. A carried Beacon stays above its carrier as a compact attachment.
  if (!beaconCarried) drawChampionBeacon(ctx, beaconPoint, camera.cell, state.champion_beacon.status, false, beaconSprite)
  for (const objects of entityGroups) {
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
    const beaconCarrier = beaconCarried ? placements.find(({ object }) => object.id === state.champion_beacon.carrier_id) : undefined
    if (beaconCarrier) {
      beaconPoint = [beaconCarrier.x + camera.cell * .22, beaconCarrier.y - camera.cell * .22]
    }
    placements.forEach(({ object, x, y }) => drawEntity(ctx, x, y, camera.cell, object, object.id === selectedId, Boolean(object.id && targetableIds.has(object.id)), selectionProgress, unitSprites))
    if (beaconCarrier) {
      drawChampionBeacon(ctx, beaconPoint, camera.cell, state.champion_beacon.status, true, beaconSprite)
      carriedBeaconDrawn = true
    }
    const meterX = placements.reduce((sum, placement) => sum + placement.x, 0) / placements.length
    const meterY = placements.reduce((sum, placement) => sum + placement.y, 0) / placements.length
    const controlledCore = objects.find((object) => object.kind === 'CORE' && object.controlled === true)
    const core = objects.find((object) => object.kind === 'CORE')
    const cargoWorker = selected?.unit_type === 'WORKER' ? selected : displayed.find((object) => object.unit_type === 'WORKER')
    const topMeterObject = selected?.kind === 'CORE' && selected.controlled ? selected : selected?.unit_type === 'WORKER' ? selected : controlledCore ?? cargoWorker
    const topMeterPlacement = placements.find(({ object }) => object === topMeterObject) ?? { x: meterX, y: meterY }
    const meterOffset = camera.cell * (objects.some((object) => object.kind === 'CORE') ? .43 : .36)
    if (topMeterObject?.kind === 'CORE') drawCoreResources(ctx, topMeterPlacement.x, topMeterPlacement.y - meterOffset, camera.cell, state.resources, coreResourceCapacity(state.population))
    else if (topMeterObject?.unit_type === 'WORKER' && topMeterObject.cargo !== undefined) drawWorkerCargo(ctx, topMeterPlacement.x, topMeterPlacement.y - meterOffset, camera.cell, topMeterObject.cargo, Math.max(topMeterObject.cargo, beaconBuffActive ? 2 : 1))
    const corePlacement = core ? placements.find(({ object }) => object === core) : undefined
    if (core?.owner_username && corePlacement) drawCoreOwnerLabel(ctx, corePlacement.x, corePlacement.y - camera.cell * .2, camera.cell, core.owner_username, core.controlled === true)
    const hp = objects.reduce((sum, object) => sum + (object.hp ?? 0), 0)
    const maxHp = objects.reduce((sum, object) => sum + maximumHealth(object), 0)
    if (maxHp > 0) {
      const healthY = meterY + meterOffset
      const color = objects.every((object) => object.controlled === true) ? PRIMARY_BLUE : objects.every((object) => object.controlled === false) ? HOSTILE_CORAL : '#d4d4d8'
      if (objects.length > 1) drawStackBadge(ctx, meterX + camera.cell * .36, meterY, camera.cell, objects.length, color)
      drawHealthBar(ctx, meterX, healthY, camera.cell, hp, maxHp, color)
    }
  }
  if (beaconCarried && !carriedBeaconDrawn) drawChampionBeacon(ctx, beaconPoint, camera.cell, state.champion_beacon.status, false, beaconSprite)
  for (const marker of resolvedSweeps) drawResolvedSweep(ctx, toScreen(marker.from), toScreen(marker.to), camera.cell, sweepProgress)
  for (const marker of resolvedShots) drawResolvedShot(ctx, toScreen(marker.from), toScreen(marker.to), camera.cell, shotProgress, marker.hit)
}

function collectTerrainObjectPositions(objects: WorldObject[], kind: 'OBSTACLE' | 'RESOURCE') {
  const cells = new Set<string>()
  for (const object of objects) if (object.kind === kind) for (const position of object.positions ?? []) cells.add(positionKey(position))
  return cells
}

function groupEntitiesByPosition(objects: WorldObject[]) {
  const grouped = new Map<string, WorldObject[]>()
  for (const object of objects) {
    if (!object.position) continue
    const key = positionKey(object.position)
    const group = grouped.get(key)
    if (group) group.push(object)
    else grouped.set(key, [object])
  }
  return grouped
}

function groupRouteDestinations(destinations: RouteDestination[]) {
  const grouped = new Map<string, RouteDestination[]>()
  for (const destination of destinations) appendGrouped(grouped, positionKey(destination.position), destination)
  return grouped
}

function groupMarkersByOrigin<T extends { from: Position }>(markers: T[]) {
  const grouped = new Map<string, T[]>()
  for (const marker of markers) appendGrouped(grouped, positionKey(marker.from), marker)
  return grouped
}

function appendGrouped<T>(grouped: Map<string, T[]>, key: string, value: T) {
  const entries = grouped.get(key)
  if (entries) entries.push(value)
  else grouped.set(key, [value])
}

function positionInViewport(position: Position, camera: Camera, size: { width: number; height: number }, margin: number) {
  const halfWidth = size.width / camera.cell / 2 + margin
  const halfHeight = size.height / camera.cell / 2 + margin
  return Math.abs(position[0] - camera.x) <= halfWidth && Math.abs(position[1] - camera.y) <= halfHeight
}

function collectVisibleEntityGroups(grouped: Map<string, WorldObject[]>, camera: Camera, size: { width: number; height: number }) {
  const margin = 2
  const minX = Math.floor(camera.x - size.width / camera.cell / 2) - margin
  const maxX = Math.ceil(camera.x + size.width / camera.cell / 2) + margin
  const minY = Math.floor(camera.y - size.height / camera.cell / 2) - margin
  const maxY = Math.ceil(camera.y + size.height / camera.cell / 2) + margin
  const visible: WorldObject[][] = []
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
    const group = grouped.get(`${x},${y}`)
    if (group) visible.push(group)
  }
  return visible
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

function drawShotArc(ctx: CanvasRenderingContext2D, from: readonly [number, number], to: readonly [number, number], cell: number, color: string) {
  const curve = shotCurve(from, to, cell); if (!curve) return
  const { startX, startY, controlX, controlY, endX, endY } = curve
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.shadowColor = color; ctx.shadowBlur = 7
  ctx.strokeStyle = color; ctx.lineWidth = Math.max(2, cell * .055); ctx.beginPath(); ctx.moveTo(startX, startY); ctx.quadraticCurveTo(controlX, controlY, endX, endY); ctx.stroke()
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

function drawSweepSword(ctx: CanvasRenderingContext2D, [fromX, fromY]: readonly [number, number], [toX, toY]: readonly [number, number], cell: number, color: string) {
  const dx = toX - fromX, dy = toY - fromY, length = Math.hypot(dx, dy); if (!length) return
  const ux = dx / length, uy = dy / length, px = -uy, py = ux
  const handleX = fromX + ux * cell * .27, handleY = fromY + uy * cell * .27, bladeBaseX = fromX + ux * cell * .4, bladeBaseY = fromY + uy * cell * .4
  const tipX = toX - ux * cell * .12, tipY = toY - uy * cell * .12, bladeHalf = Math.max(2.5, cell * .055)
  ctx.save(); ctx.strokeStyle = '#f4f4f5'; ctx.fillStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.shadowColor = color; ctx.shadowBlur = 6
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
  ctx.save(); ctx.globalAlpha = dashed ? .55 : 1; ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = Math.max(1.5, cell * .035); ctx.lineCap = 'round'; ctx.shadowColor = color; ctx.shadowBlur = dashed ? 3 : 7
  if (dashed) ctx.setLineDash([Math.max(4, cell * .12), Math.max(3, cell * .09)])
  ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(endX, endY); ctx.stroke()
  const head = Math.max(7, cell * .18), wingX = -uy, wingY = ux
  const tipX = toX - ux * cell * .12, tipY = toY - uy * cell * .12
  ctx.beginPath(); ctx.moveTo(tipX, tipY); ctx.lineTo(endX - ux * head + wingX * head * .42, endY - uy * head + wingY * head * .42); ctx.lineTo(endX - ux * head - wingX * head * .42, endY - uy * head - wingY * head * .42); ctx.closePath()
  if (dashed) ctx.stroke(); else ctx.fill()
  ctx.restore()
}

function drawRouteDestination(ctx: CanvasRenderingContext2D, [x, y]: readonly [number, number], cell: number, blocked: boolean, selectable: boolean, immediate: boolean) {
  const color = blocked ? HOSTILE_CORAL : PRIMARY_BLUE
  if (selectable) {
    const inset = Math.max(2, cell * .07), size = cell - inset * 2
    ctx.save()
    ctx.fillStyle = immediate ? 'rgba(69,145,197,.22)' : 'rgba(69,145,197,.08)'
    ctx.strokeStyle = immediate ? PRIMARY_BLUE_LIGHT : 'rgba(111,174,216,.38)'
    ctx.lineWidth = immediate ? Math.max(2, cell * .042) : Math.max(1, cell * .022)
    ctx.shadowColor = PRIMARY_BLUE
    ctx.shadowBlur = immediate ? Math.max(2, cell * .05) : 0
    ctx.fillRect(x - cell / 2 + inset, y - cell / 2 + inset, size, size)
    ctx.strokeRect(x - cell / 2 + inset + .5, y - cell / 2 + inset + .5, size - 1, size - 1)
    if (immediate) {
      ctx.fillStyle = PRIMARY_BLUE_LIGHT
      ctx.beginPath(); ctx.arc(x, y, Math.max(2, cell * .045), 0, Math.PI * 2); ctx.fill()
    }
    ctx.restore(); return
  }
  const radius = cell * .22
  ctx.save(); ctx.globalAlpha = blocked ? .65 : .8; ctx.strokeStyle = color; ctx.fillStyle = 'rgba(31,37,91,.28)'; ctx.lineWidth = Math.max(1.5, cell * .035); ctx.setLineDash([Math.max(3, cell * .07), Math.max(2, cell * .05)])
  ctx.beginPath(); ctx.moveTo(x, y - radius); ctx.lineTo(x + radius, y); ctx.lineTo(x, y + radius); ctx.lineTo(x - radius, y); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.setLineDash([])
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, Math.max(1.5, cell * .035), 0, Math.PI * 2); ctx.fill(); ctx.restore()
}

interface ObstacleRenderCell { position: Position; x: number; y: number; visible: boolean; shape: ObstacleCellShape }

function drawObstacleTerrain(ctx: CanvasRenderingContext2D, cells: ObstacleRenderCell[], cellSize: number, sprites: HTMLImageElement[]) {
  if (!cells.length) return
  drawObstacleConnections(ctx, cells, cellSize, sprites)
  for (const obstacle of cells) drawObstacleSprite(ctx, obstacle, cellSize, sprites)
}

function drawObstacleConnections(ctx: CanvasRenderingContext2D, cells: ObstacleRenderCell[], cell: number, sprites: HTMLImageElement[]) {
  const byPosition = new Map(cells.map((cell) => [positionKey(cell.position), cell]))
  for (const obstacle of cells) {
    const [worldX, worldY] = obstacle.position
    const east = byPosition.get(positionKey([worldX + 1, worldY]))
    const south = byPosition.get(positionKey([worldX, worldY + 1]))
    if (east) drawObstacleConnection(ctx, obstacle.x + cell / 2, obstacle.y, cell, obstacle.position, obstacle.visible && east.visible, sprites, true)
    if (south) drawObstacleConnection(ctx, obstacle.x, obstacle.y + cell / 2, cell, obstacle.position, obstacle.visible && south.visible, sprites, false)
  }
}

function drawObstacleConnection(ctx: CanvasRenderingContext2D, x: number, y: number, cell: number, position: Position, visible: boolean, sprites: HTMLImageElement[], horizontal: boolean) {
  const image = sprites[obstacleSpriteIndex(position, sprites.length)]
  if (!image?.complete || image.naturalWidth <= 0) return

  const size = Math.max(1, Math.round(cell * 1.12))
  const left = Math.round(x - size / 2)
  const top = Math.round(y - size / 2)
  ctx.save()
  ctx.beginPath()
  if (horizontal) ctx.rect(x - cell, y - cell / 2, cell * 2, cell)
  else ctx.rect(x - cell / 2, y - cell, cell, cell * 2)
  ctx.clip()
  ctx.globalAlpha = visible ? .94 : .3; ctx.shadowColor = 'rgba(0,0,0,.84)'; ctx.shadowBlur = Math.max(2, Math.round(cell * .065)); ctx.shadowOffsetY = Math.round(cell * .025)
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(image, left, top, size, size); ctx.restore()
}

function drawObstacleSprite(ctx: CanvasRenderingContext2D, obstacle: ObstacleRenderCell, cell: number, sprites: HTMLImageElement[]) {
  const image = sprites[obstacleSpriteIndex(obstacle.position, sprites.length)]
  ctx.save(); ctx.globalAlpha = obstacle.visible ? 1 : .35; ctx.shadowColor = 'rgba(0,0,0,.9)'; ctx.shadowBlur = Math.max(3, Math.round(cell * .1)); ctx.shadowOffsetY = Math.round(cell * .045)
  if (image?.complete && image.naturalWidth > 0) {
    const { size, left, top } = obstacleSpriteRect(obstacle.x, obstacle.y, cell)
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(image, left, top, size, size)
  } else {
    const radius = cell * .34; ctx.fillStyle = '#292b30'; ctx.beginPath()
    for (let index = 0; index < 9; index++) { const angle = Math.PI * 2 * index / 9, scale = index % 2 ? .82 : 1, x = obstacle.x + Math.cos(angle) * radius * scale, y = obstacle.y + Math.sin(angle) * radius * scale; if (index) ctx.lineTo(x, y); else ctx.moveTo(x, y) }
    ctx.closePath(); ctx.fill()
  }
  ctx.restore()
}
function drawResource(ctx: CanvasRenderingContext2D, position: Position, x: number, y: number, cell: number, visible: boolean, sprites: HTMLImageElement[]) {
  const image = sprites[resourceSpriteIndex(position, sprites.length)]
  const { left, top, size } = resourceSpriteRect(x, y, cell)
  ctx.save(); ctx.globalAlpha = visible ? 1 : .3; ctx.shadowColor = 'rgba(118,184,137,.42)'; ctx.shadowBlur = visible ? Math.max(2, Math.round(cell * .055)) : 0; ctx.shadowOffsetY = Math.round(cell * .025)
  if (image?.complete && image.naturalWidth > 0) {
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(image, left, top, size, size)
  } else {
    const radius = size * .3; ctx.fillStyle = visible ? RESOURCE_GREEN : '#24372b'; ctx.beginPath(); ctx.moveTo(x, y - radius); ctx.lineTo(x + radius * .72, y); ctx.lineTo(x, y + radius); ctx.lineTo(x - radius * .72, y); ctx.closePath(); ctx.fill()
  }
  ctx.restore()
}

function drawChampionBeacon(ctx: CanvasRenderingContext2D, [x, y]: readonly [number, number], cell: number, status: PlayerState['champion_beacon']['status'], attached: boolean, sprite: HTMLImageElement | null) {
  const radius = cell * (attached ? .105 : .17)
  if (status && sprite?.complete && sprite.naturalWidth > 0) {
    const cached = cachedChampionBeacon(sprite, cell, attached)
    ctx.drawImage(cached.canvas, x - cached.size / 2, y - cached.size / 2, cached.size, cached.size)
    return
  }
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = BEACON_GOLD; ctx.fillStyle = attached ? '#241b08' : '#171106'; ctx.lineWidth = Math.max(1.5, cell * .035); ctx.shadowColor = BEACON_GOLD_LIGHT; ctx.shadowBlur = cell * .16
  if (!status) {
    ctx.globalAlpha = .78; ctx.setLineDash([Math.max(2, cell * .055), Math.max(2, cell * .045)])
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([])
    ctx.fillStyle = BEACON_GOLD_LIGHT; ctx.beginPath(); ctx.arc(x, y, Math.max(1.5, cell * .028), 0, Math.PI * 2); ctx.fill(); ctx.restore(); return
  }
  ctx.beginPath(); ctx.moveTo(x, y - radius); ctx.lineTo(x + radius, y); ctx.lineTo(x, y + radius); ctx.lineTo(x - radius, y); ctx.closePath(); ctx.fill(); ctx.stroke()
  ctx.shadowBlur = 0; ctx.fillStyle = BEACON_GOLD_LIGHT; ctx.beginPath(); ctx.arc(x, y, Math.max(1.5, radius * .2), 0, Math.PI * 2); ctx.fill()
  ctx.restore()
}

function cachedChampionBeacon(image: HTMLImageElement, cell: number, attached: boolean): CachedBeaconSprite {
  const ratio = Math.min(2, Math.max(1, typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1))
  const size = Math.max(1, Math.ceil(cell * (attached ? .9 : 1.5)))
  const key = `${attached ? 'carried' : 'ground'}:${cell}:${ratio}`
  let variants = beaconSpriteCache.get(image)
  if (!variants) { variants = new Map(); beaconSpriteCache.set(image, variants) }
  const existing = variants.get(key)
  if (existing) return existing

  const canvas = document.createElement('canvas'); canvas.width = Math.ceil(size * ratio); canvas.height = Math.ceil(size * ratio)
  const context = canvas.getContext('2d')!; context.setTransform(ratio, 0, 0, ratio, 0, 0)
  const center = size / 2
  if (!attached) {
    const halo = context.createRadialGradient(center, center, cell * .08, center, center, cell * .58)
    halo.addColorStop(0, 'rgba(255,210,91,.28)'); halo.addColorStop(.58, 'rgba(217,166,46,.11)'); halo.addColorStop(1, 'rgba(217,166,46,0)')
    context.fillStyle = halo; context.beginPath(); context.arc(center, center, cell * .58, 0, Math.PI * 2); context.fill()
    context.strokeStyle = 'rgba(255,226,154,.72)'; context.lineWidth = Math.max(1.5, cell * .028); context.setLineDash([Math.max(3, cell * .075), Math.max(2, cell * .05)])
    context.beginPath(); context.arc(center, center, cell * .49, 0, Math.PI * 2); context.stroke(); context.setLineDash([])
  }
  const rect = beaconSpriteRect(center, center, cell, attached, image.naturalWidth / image.naturalHeight)
  context.shadowColor = BEACON_GOLD_LIGHT; context.shadowBlur = cell * (attached ? .1 : .22); context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'high'
  context.drawImage(image, rect.left, rect.top, rect.width, rect.height)
  const cached = { canvas, size }; variants.set(key, cached); return cached
}

function drawEntity(ctx: CanvasRenderingContext2D, x: number, y: number, cell: number, object: WorldObject, selected: boolean, target: boolean, selectionProgress: number, sprites: Partial<Record<UnitArtType, HTMLImageElement>>) {
  const friendly = object.controlled === true, color = selected ? SELECTED_GOLD : friendly ? PRIMARY_BLUE : HOSTILE_CORAL, size = cell * .24
  const artType = unitArtType(object)
  const image = artType ? sprites[artType] : undefined
  if (artType && image?.complete && image.naturalWidth > 0) {
    const rect = unitSpriteRect(x, y, cell, artType, image.naturalWidth / image.naturalHeight)
    if (selected) drawSpriteSelectionRipple(ctx, image, rect, selectionProgress)
    else if (target) {
      ctx.save(); ctx.strokeStyle = HOSTILE_CORAL; ctx.lineWidth = cell * .034; ctx.setLineDash([cell * .07, cell * .07])
      ctx.beginPath(); ctx.arc(x, y, Math.max(rect.width, rect.height) * .64, 0, Math.PI * 2); ctx.stroke(); ctx.restore()
    }
    if (selected) {
      ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = cell * .24; ctx.filter = 'sepia(1) saturate(2.6) hue-rotate(350deg) brightness(1.12)'
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(image, rect.left, rect.top, rect.width, rect.height); ctx.restore()
    } else {
      const cached = cachedUnitSprite(image, rect, cell, friendly)
      ctx.drawImage(cached.canvas, rect.left - cached.padding, rect.top - cached.padding, cached.width, cached.height)
    }
    return
  }
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

function cachedUnitSprite(image: HTMLImageElement, rect: { width: number; height: number }, cell: number, friendly: boolean): CachedUnitSprite {
  const ratio = Math.min(2, Math.max(1, typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1))
  const blur = cell * (friendly ? .15 : .12), padding = Math.max(2, Math.ceil(blur * 1.8))
  const width = rect.width + padding * 2, height = rect.height + padding * 2
  const key = `${friendly ? 'friendly' : 'hostile'}:${rect.width}x${rect.height}:${Math.round(blur * 10)}:${ratio}`
  let variants = unitSpriteCache.get(image)
  if (!variants) { variants = new Map(); unitSpriteCache.set(image, variants) }
  const existing = variants.get(key)
  if (existing) return existing

  const canvas = document.createElement('canvas'); canvas.width = Math.ceil(width * ratio); canvas.height = Math.ceil(height * ratio)
  const context = canvas.getContext('2d')!; context.setTransform(ratio, 0, 0, ratio, 0, 0); context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'high'
  context.shadowColor = friendly ? PRIMARY_BLUE : HOSTILE_CORAL; context.shadowBlur = blur
  context.filter = friendly ? 'none' : 'hue-rotate(145deg) saturate(.85) brightness(.92)'
  context.drawImage(image, padding, padding, rect.width, rect.height)
  const cached = { canvas, width, height, padding }; variants.set(key, cached); return cached
}

function drawSpriteSelectionRipple(ctx: CanvasRenderingContext2D, image: HTMLImageElement, rect: { left: number; top: number; width: number; height: number }, progress: number) {
  if (progress >= 1) return
  const centerX = rect.left + rect.width / 2, centerY = rect.top + rect.height / 2
  ctx.save(); ctx.filter = 'sepia(1) saturate(2.6) hue-rotate(350deg) brightness(1.12)'; ctx.shadowColor = SELECTED_GOLD
  for (let wave = 0; wave < 2; wave++) {
    const delay = wave * .18
    if (progress < delay) continue
    const waveProgress = Math.min(1, (progress - delay) / (1 - delay)), eased = 1 - (1 - waveProgress) ** 3, scale = 1.04 + eased * .24
    const width = Math.round(rect.width * scale), height = Math.round(rect.height * scale)
    ctx.globalAlpha = (1 - waveProgress) * (.34 - wave * .08); ctx.shadowBlur = Math.max(3, Math.round(Math.max(rect.width, rect.height) * (.12 + eased * .12)))
    ctx.drawImage(image, Math.round(centerX - width / 2), Math.round(centerY - height / 2), width, height)
  }
  ctx.restore()
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

function drawWorkerCargo(ctx: CanvasRenderingContext2D, x: number, y: number, cell: number, cargo: number, capacity: number) {
  drawMeterBar(ctx, x, y, cell, cargo, capacity, RESOURCE_GREEN, RESOURCE_GREEN_LIGHT)
}

function drawCoreResources(ctx: CanvasRenderingContext2D, x: number, y: number, cell: number, resources: number, capacity: number) {
  drawMeterBar(ctx, x, y, cell, resources, capacity, RESOURCE_GREEN, RESOURCE_GREEN_LIGHT)
}

function drawCoreOwnerLabel(ctx: CanvasRenderingContext2D, x: number, y: number, cell: number, username: string, controlled: boolean) {
  const label = `@${username}`
  let fontSize = Math.max(8, Math.min(10, cell * .17))
  const maxWidth = cell * .95
  ctx.save()
  ctx.font = `600 ${fontSize}px "JetBrains Mono", monospace`
  const measured = ctx.measureText(label).width
  if (measured > maxWidth) {
    fontSize = Math.max(7, fontSize * maxWidth / measured)
    ctx.font = `600 ${fontSize}px "JetBrains Mono", monospace`
  }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'
  ctx.lineWidth = Math.max(2, fontSize * .28); ctx.strokeStyle = 'rgba(0,0,0,.9)'; ctx.strokeText(label, x, y)
  ctx.fillStyle = controlled ? PRIMARY_BLUE_LIGHT : '#e9a0aa'
  ctx.shadowColor = 'rgba(0,0,0,.9)'; ctx.shadowBlur = 2; ctx.shadowOffsetY = 1; ctx.fillText(label, x, y)
  ctx.restore()
}

function maximumHealth(object: WorldObject) {
  if (object.hp === undefined) return 0
  return object.kind === 'CORE' ? CORE_MAX_HP : object.unit_type === 'VANGUARD' ? 4 : 2
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
  const gap = cell * .04, maxWidth = cell * .86, barHeight = cell * .06, ratio = maximum > 0 ? Math.max(0, Math.min(1, value / maximum)) : 0
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
