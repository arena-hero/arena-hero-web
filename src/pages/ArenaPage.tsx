import { Crosshair, Move, Sword } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AssetList } from '../components/game/AssetList'
import { GameHUD } from '../components/game/GameHUD'
import { MapControls } from '../components/game/MapControls'
import { PendingCommands } from '../components/game/PendingCommands'
import { ResourceActivity } from '../components/game/ResourceActivity'
import { RespawnOverlay } from '../components/game/RespawnOverlay'
import { WorldCanvas } from '../components/game/WorldCanvas'
import { UnitActionDialog, type MapAnchor } from '../components/game/UnitActionDialog'
import { useGameStream } from '../hooks/useGameStream'
import { useAuth } from '../context/AuthContext'
import { plannedShotMarkers, plannedSweepMarkers, rangerTargets } from '../lib/combatPreview'
import { directionTo, moveTargets, plannedMoveArrows } from '../lib/movementPreview'
import { getErrorMessage } from '../lib/errorMessage'
import { getActionAvailability } from '../lib/actionAvailability'
import { coreDestroyerFromEvents } from '../lib/destruction'
import { applyAutonomousMovement, buildMovementRoutes, findMovementPath, reachableMovementDestinations, readMovementGoals, type MovementGoals, type PathFailure } from '../lib/pathfinding'
import { mergeCommandPlans, prepareManualUnitActionPlan } from '../lib/commandPlans'
import type { CommandPlan, CoreAction, Position, UnitAction, WorldObject } from '../lib/types'
import { positionKey } from '../lib/visibility'

export function ArenaPage({ demo = false }: { demo?: boolean }) {
  const { t } = useTranslation(); const { user } = useAuth(); const game = useGameStream(demo, demo ? 'demo' : user?.username ?? 'anonymous')
  const submitGamePlan = game.submit
  const movementStorageKey = `arena-hero.movement-goals.${demo ? 'demo' : user?.username ?? 'anonymous'}`
  const [selectedId, setSelectedId] = useState<string | null>(null); const [targetMode, setTargetMode] = useState<'SHOOT' | 'SWEEP' | null>(null); const [moveSelecting, setMoveSelecting] = useState(false)
  const [movementError, setMovementError] = useState<PathFailure | null>(null)
  const [anchor, setAnchor] = useState<MapAnchor | null>(null)
  const destroyerStorageKey = `arena-hero.core-destroyer.${demo ? 'demo' : user?.username ?? 'anonymous'}`
  const [coreDestroyer, setCoreDestroyer] = useState<string | null>(() => sessionStorage.getItem(destroyerStorageKey))
  const [centerRequest, setCenterRequest] = useState(0); const [zoomRequest, setZoomRequest] = useState(0)
  const [centerPosition, setCenterPosition] = useState<Position | null>(null)
  const [plan, setPlan] = useState<CommandPlan>({ tick: game.tick ?? 0, unit_actions: {} })
  const [movementGoals, setMovementGoals] = useState<MovementGoals>(() => readMovementGoals(localStorage.getItem(movementStorageKey)))
  const planRef = useRef(plan); const tickRef = useRef(game.tick); const submitQueueRef = useRef<Promise<void>>(Promise.resolve()); const movementGoalsRef = useRef(movementGoals); const autoMovementTickRef = useRef<number | null>(null)
  const respawning = game.state?.status === 'RESPAWNING'
  const replaceMovementGoals = useCallback((next: MovementGoals) => { movementGoalsRef.current = next; setMovementGoals(next) }, [])
  const removeMovementGoal = useCallback((objectId: string) => {
    if (!movementGoalsRef.current[objectId]) return
    const next = { ...movementGoalsRef.current }; delete next[objectId]; replaceMovementGoals(next)
  }, [replaceMovementGoals])
  useEffect(() => { localStorage.setItem(movementStorageKey, JSON.stringify(movementGoals)) }, [movementGoals, movementStorageKey])
  useEffect(() => { if (game.tick) { const nextPlan = { tick: game.tick, unit_actions: {} }; tickRef.current = game.tick; planRef.current = nextPlan; autoMovementTickRef.current = null; setPlan(nextPlan); setTargetMode(null); setMoveSelecting(false); setMovementError(null) } }, [game.tick])
  useEffect(() => {
    const authoritative = game.receipts.MANUAL
    if (!game.tick || authoritative?.tick !== game.tick) return
    planRef.current = authoritative.plan
    setPlan(authoritative.plan)
  }, [game.receipts.MANUAL, game.tick])
  useEffect(() => { if (respawning) { setSelectedId(null); setTargetMode(null); setMoveSelecting(false); setMovementError(null); setAnchor(null); if (Object.keys(movementGoalsRef.current).length) replaceMovementGoals({}) } }, [replaceMovementGoals, respawning])
  useEffect(() => {
    if (!game.state) return
    if (!respawning) { setCoreDestroyer(null); sessionStorage.removeItem(destroyerStorageKey); return }
    const destroyer = coreDestroyerFromEvents(game.state.events)
    if (destroyer) { setCoreDestroyer(destroyer); sessionStorage.setItem(destroyerStorageKey, destroyer) }
  }, [destroyerStorageKey, game.state, respawning])
  const commitManualPlan = useCallback((nextPlan: CommandPlan) => {
    planRef.current = nextPlan; setPlan(nextPlan)
    submitQueueRef.current = submitQueueRef.current.then(async () => {
      if (nextPlan.tick !== tickRef.current) return
      try { await submitGamePlan(nextPlan) } catch { /* surfaced by the game stream */ }
    })
  }, [submitGamePlan])
  useEffect(() => {
    if (!game.tick || !game.state || game.phase !== 'open' || respawning || autoMovementTickRef.current === game.tick) return
    autoMovementTickRef.current = game.tick
    const currentPlan = planRef.current.tick === game.tick ? planRef.current : { tick: game.tick, unit_actions: {} }
    const result = applyAutonomousMovement(game.state, game.explored, movementGoalsRef.current, currentPlan)
    const stale = new Set([...result.completed, ...result.removed])
    if (stale.size) replaceMovementGoals(Object.fromEntries(Object.entries(movementGoalsRef.current).filter(([objectId]) => !stale.has(objectId))))
    if (result.changed) commitManualPlan(result.plan)
  }, [commitManualPlan, game.explored, game.phase, game.state, game.tick, replaceMovementGoals, respawning])
  const selected = useMemo(() => game.state?.objects.find((object) => object.id === selectedId) ?? null, [game.state, selectedId])
  const effective = useMemo(() => mergeCommandPlans(game.tick ?? 0, game.receipts, plan), [game.receipts, game.tick, plan])
  const actionAvailability = useMemo(() => game.state && selected ? getActionAvailability(game.state, selected, effective.plan) : null, [effective.plan, game.state, selected])
  const movementRoutes = useMemo(() => game.state ? buildMovementRoutes(game.state, game.explored, movementGoals, effective.plan) : [], [effective.plan, game.explored, game.state, movementGoals])
  const moveArrows = useMemo(() => game.state ? plannedMoveArrows(game.state, effective.plan, movementRoutes, effective) : [], [effective, game.state, movementRoutes])
  const plannedRouteDestinations = useMemo(() => {
    const routesByObject = new Map(movementRoutes.map((route) => [route.objectId, route] as const))
    return Object.entries(movementGoals).map(([objectId, position]) => ({ objectId, position, blocked: routesByObject.get(objectId)?.blocked ?? true }))
  }, [movementGoals, movementRoutes])
  const routeDestinations = useMemo(() => {
    if (!moveSelecting || !game.state || !selected?.id) return plannedRouteDestinations
    const immediate = new Set(moveTargets(game.state, selected, effective.plan).map(positionKey))
    const selectable = reachableMovementDestinations(game.state, game.explored, selected, effective.plan).map((position) => ({ objectId: selected.id!, position, blocked: false, selectable: true, immediate: immediate.has(positionKey(position)) }))
    return [...plannedRouteDestinations.filter((destination) => destination.objectId !== selected.id), ...selectable]
  }, [effective.plan, game.explored, game.state, moveSelecting, plannedRouteDestinations, selected])
  const sweepMarkers = useMemo(() => game.state ? plannedSweepMarkers(game.state, effective.plan, effective.unitSources) : [], [effective.plan, effective.unitSources, game.state])
  const shotMarkers = useMemo(() => game.state ? plannedShotMarkers(game.state, effective.plan, effective.unitSources) : [], [effective.plan, effective.unitSources, game.state])
  const targetableIds = useMemo(() => {
    if (!targetMode) return new Set<string>()
    if (targetMode === 'SHOOT' && game.state && selected) return new Set(rangerTargets(game.state, selected).map((object) => object.id!))
    return new Set((game.state?.objects ?? []).filter((object) => object.id && object.controlled === false && (targetMode !== 'SWEEP' || Boolean(selected?.position && object.position && Math.abs(object.position[0] - selected.position[0]) + Math.abs(object.position[1] - selected.position[1]) === 1))).map((object) => object.id!))
  }, [game.state, selected, targetMode])
  const select = (object: WorldObject | null) => { setSelectedId(object?.id ?? null); setTargetMode(null); setMoveSelecting(false); setMovementError(null) }
  const setUnitAction = (id: string, action: UnitAction | null) => { const current = planRef.current; const unit_actions = { ...current.unit_actions }; if (action) unit_actions[id] = action; else delete unit_actions[id]; commitManualPlan({ ...current, unit_actions }) }
  const setCoreAction = (action: CoreAction | null) => { const current = planRef.current; if (action) { commitManualPlan({ ...current, core_action: action }); return } const next = { ...current }; delete next.core_action; commitManualPlan(next) }
  const unitAction = (id: string, action: UnitAction | null) => {
    removeMovementGoal(id)
    if (!game.state) return
    commitManualPlan(prepareManualUnitActionPlan(game.state, game.receipts, planRef.current, id, action))
  }
  const coreAction = (action: CoreAction | null) => { const coreId = game.state?.objects.find((object) => object.kind === 'CORE' && object.controlled)?.id; if (coreId) removeMovementGoal(coreId); setCoreAction(action) }
  const chooseTarget = (target: WorldObject) => {
    if (!selected?.id || !selected.position || !target.id || !target.position) return
    if (targetMode === 'SWEEP' && selected.unit_type === 'VANGUARD') {
      const direction = directionTo(selected.position, target.position); if (!direction) return
      unitAction(selected.id, { type: 'SWEEP', direction }); select(null); return
    }
    if (targetMode !== 'SHOOT' || selected.unit_type !== 'RANGER') return
    unitAction(selected.id, { type: 'SHOOT', target_id: target.id, expected_cell: target.position }); select(null)
  }
  const chooseMoveDestination = (target: Position) => {
    if (!game.state || !selected?.id || !selected.position) return
    if (selected.position[0] === target[0] && selected.position[1] === target[1]) { removeMovementGoal(selected.id); if (selected.kind === 'CORE') setCoreAction(null); else setUnitAction(selected.id, null); select(null); return }
    const path = findMovementPath(game.state, game.explored, selected, target, planRef.current)
    if (!path.path || path.path.length < 2) { setMovementError(path.reason ?? 'NO_ROUTE'); return }
    const nextGoals = { ...movementGoalsRef.current, [selected.id]: target }
    const result = applyAutonomousMovement(game.state, game.explored, nextGoals, planRef.current)
    replaceMovementGoals(nextGoals); setMovementError(null); autoMovementTickRef.current = game.tick
    if (result.changed) commitManualPlan(result.plan)
    select(null)
  }
  const cancelMovementGoal = (object: WorldObject) => { if (!object.id) return; removeMovementGoal(object.id); if (object.kind === 'CORE') setCoreAction(null); else setUnitAction(object.id, null); select(null) }
  if (!game.state) return <div className="grid h-dvh place-items-center"><div className="text-center"><div className="mx-auto mb-4 size-2 animate-pulse rounded-full bg-cyan-signal shadow-[0_0_14px_rgba(69,145,197,.45)]" /><p className="font-mono text-xs tracking-[.2em] text-zinc-500">{t(`game.${game.phase}`)}</p>{game.error && <p role="alert" className="mt-3 text-xs text-coral-hostile">{getErrorMessage(game.error)}</p>}</div></div>
  return <div className="grid h-dvh min-h-[560px] grid-cols-1 overflow-hidden lg:grid-cols-[260px_1fr]">
    <AssetList state={game.state} objects={game.state.objects} selectedId={selectedId} onSelect={select} />
    <section className="relative min-h-0 overflow-hidden">
      {!respawning && <GameHUD phase={game.phase} stateReceivedAt={game.stateReceivedAt} />}
      {!respawning && game.tick && <PendingCommands tick={game.tick} state={game.state} receipts={game.receipts} />}
      <WorldCanvas state={game.state} explored={game.explored} selectedId={selectedId} targeting={targetMode !== null} destinationSelecting={moveSelecting} targetableIds={targetableIds} routeDestinations={routeDestinations} moveArrows={moveArrows} sweepMarkers={sweepMarkers} shotMarkers={shotMarkers} centerPosition={centerPosition} centerRequest={centerRequest} zoomRequest={zoomRequest} onSelect={select} onTarget={chooseTarget} onMoveDestination={chooseMoveDestination} onCenterBeacon={() => { setCenterPosition(game.state!.champion_beacon.position); setCenterRequest((value) => value + 1) }} onAnchorChange={setAnchor} />
      {!respawning && <ResourceActivity events={game.state.events} />}
      {respawning && <RespawnOverlay destroyedBy={coreDestroyer} />}
      {!respawning && selected?.controlled && anchor && actionAvailability && !targetMode && !moveSelecting && <UnitActionDialog anchor={anchor} selected={selected} plan={plan} movementGoal={selected.id ? movementGoals[selected.id] : undefined} phase={game.phase} resources={game.state.resources} availability={actionAvailability} onClose={() => select(null)} onTargeting={() => { setMoveSelecting(false); setTargetMode('SHOOT') }} onSweepTargeting={() => { setMoveSelecting(false); setTargetMode('SWEEP') }} onMoveTargeting={() => { setTargetMode(null); setMovementError(null); setMoveSelecting(true) }} onCancelMovementGoal={() => cancelMovementGoal(selected)} onUnitAction={unitAction} onCoreAction={coreAction} />}
      {targetMode && <div className="panel absolute left-1/2 top-28 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full pl-4 pr-1.5 text-xs text-coral-hostile">{targetMode === 'SWEEP' ? <Sword size={15} /> : <Crosshair size={15} />}<span>{t(targetMode === 'SWEEP' ? 'game.sweepHint' : 'game.targetHint')}</span><button onClick={() => setTargetMode(null)} className="focus-ring ml-1 min-h-11 rounded-full px-3 text-zinc-400 hover:bg-white/5 hover:text-white">{t('common.cancel')}</button></div>}
      {moveSelecting && <div className={`panel absolute left-1/2 top-28 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full pl-4 pr-1.5 text-xs ${movementError ? 'text-coral-hostile' : 'text-cyan-signal'}`}><Move size={15} /><span>{t(movementError === 'UNKNOWN_DESTINATION' ? 'game.routeUnknown' : movementError ? 'game.routeBlocked' : 'game.moveHint')}</span><button onClick={() => { setMoveSelecting(false); setMovementError(null) }} className="focus-ring ml-1 min-h-11 rounded-full px-3 text-zinc-400 hover:bg-white/5 hover:text-white">{t('common.cancel')}</button></div>}
      {!respawning && <MapControls onCenter={() => { setCenterPosition(null); setCenterRequest((value) => value + 1) }} onZoom={(direction) => setZoomRequest((value) => direction * (Math.abs(value) + 1))} />}
      {game.error && <div role="alert" className="panel absolute bottom-4 right-4 z-30 max-w-[min(24rem,calc(100%-2rem))] px-4 py-3 text-xs leading-5 text-coral-hostile">{getErrorMessage(game.error)}</div>}
    </section>
  </div>
}
