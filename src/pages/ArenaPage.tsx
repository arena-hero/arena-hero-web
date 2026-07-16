import { Crosshair, Move, Sword } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AssetList } from '../components/game/AssetList'
import { GameHUD } from '../components/game/GameHUD'
import { MapControls } from '../components/game/MapControls'
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
import type { CommandPlan, CoreAction, Position, UnitAction, WorldObject } from '../lib/types'

export function ArenaPage({ demo = false }: { demo?: boolean }) {
  const { t } = useTranslation(); const { user } = useAuth(); const game = useGameStream(demo, demo ? 'demo' : user?.username ?? 'anonymous')
  const submitGamePlan = game.submit
  const [selectedId, setSelectedId] = useState<string | null>(null); const [targetMode, setTargetMode] = useState<'SHOOT' | 'SWEEP' | null>(null); const [moveSelecting, setMoveSelecting] = useState(false)
  const [anchor, setAnchor] = useState<MapAnchor | null>(null)
  const destroyerStorageKey = `arena-hero.core-destroyer.${demo ? 'demo' : user?.username ?? 'anonymous'}`
  const [coreDestroyer, setCoreDestroyer] = useState<string | null>(() => sessionStorage.getItem(destroyerStorageKey))
  const [centerRequest, setCenterRequest] = useState(0); const [zoomRequest, setZoomRequest] = useState(0)
  const [plan, setPlan] = useState<CommandPlan>({ tick: game.tick ?? 0, unit_actions: {} })
  const planRef = useRef(plan); const tickRef = useRef(game.tick); const submitQueueRef = useRef<Promise<void>>(Promise.resolve())
  const respawning = game.state?.status === 'RESPAWNING'
  const respawnTicksRemaining = Math.max(0, (game.state?.respawn_at_tick ?? game.tick ?? 0) - (game.tick ?? 0))
  useEffect(() => { if (game.tick) { const nextPlan = { tick: game.tick, unit_actions: {} }; tickRef.current = game.tick; planRef.current = nextPlan; setPlan(nextPlan); setTargetMode(null); setMoveSelecting(false) } }, [game.tick])
  useEffect(() => { if (respawning) { setSelectedId(null); setTargetMode(null); setMoveSelecting(false); setAnchor(null) } }, [respawning])
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
  const selected = useMemo(() => game.state?.objects.find((object) => object.id === selectedId) ?? null, [game.state, selectedId])
  const actionAvailability = useMemo(() => game.state && selected ? getActionAvailability(game.state, selected, plan) : null, [game.state, plan, selected])
  const availableMoveTargets = useMemo(() => game.state && selected && moveSelecting ? moveTargets(game.state, selected, plan) : [], [game.state, moveSelecting, plan, selected])
  const moveArrows = useMemo(() => game.state ? plannedMoveArrows(game.state, plan) : [], [game.state, plan])
  const sweepMarkers = useMemo(() => game.state ? plannedSweepMarkers(game.state, plan) : [], [game.state, plan])
  const shotMarkers = useMemo(() => game.state ? plannedShotMarkers(game.state, plan) : [], [game.state, plan])
  const targetableIds = useMemo(() => {
    if (!targetMode) return new Set<string>()
    if (targetMode === 'SHOOT' && game.state && selected) return new Set(rangerTargets(game.state, selected).map((object) => object.id!))
    return new Set((game.state?.objects ?? []).filter((object) => object.id && object.controlled === false && (targetMode !== 'SWEEP' || Boolean(selected?.position && object.position && Math.abs(object.position[0] - selected.position[0]) + Math.abs(object.position[1] - selected.position[1]) === 1))).map((object) => object.id!))
  }, [game.state, selected, targetMode])
  const select = (object: WorldObject | null) => { setSelectedId(object?.id ?? null); setTargetMode(null); setMoveSelecting(false) }
  const unitAction = (id: string, action: UnitAction | null) => { const current = planRef.current; const unit_actions = { ...current.unit_actions }; if (action) unit_actions[id] = action; else delete unit_actions[id]; commitManualPlan({ ...current, unit_actions }) }
  const coreAction = (action: CoreAction | null) => { const current = planRef.current; if (action) { commitManualPlan({ ...current, core_action: action }); return } const next = { ...current }; delete next.core_action; commitManualPlan(next) }
  const chooseTarget = (target: WorldObject) => {
    if (!selected?.id || !selected.position || !target.id || !target.position) return
    if (targetMode === 'SWEEP' && selected.unit_type === 'VANGUARD') {
      const direction = directionTo(selected.position, target.position); if (!direction) return
      unitAction(selected.id, { type: 'SWEEP', direction }); select(null); return
    }
    if (targetMode !== 'SHOOT' || selected.unit_type !== 'RANGER') return
    unitAction(selected.id, { type: 'SHOOT', target_id: target.id, expected_cell: target.position }); select(null)
  }
  const chooseMoveTarget = (target: Position) => {
    if (!selected?.id || !selected.position) return
    const direction = directionTo(selected.position, target)
    if (!direction) return
    if (selected.kind === 'CORE') coreAction({ type: 'START_MOVE', direction })
    else unitAction(selected.id, { type: 'MOVE', direction })
    select(null)
  }
  if (!game.state) return <div className="grid h-dvh place-items-center"><div className="text-center"><div className="mx-auto mb-4 size-2 animate-pulse rounded-full bg-cyan-signal shadow-[0_0_14px_rgba(69,145,197,.45)]" /><p className="font-mono text-xs tracking-[.2em] text-zinc-500">{t(`game.${game.phase}`)}</p>{game.error && <p role="alert" className="mt-3 text-xs text-coral-hostile">{getErrorMessage(game.error)}</p>}</div></div>
  return <div className="grid h-dvh min-h-[560px] grid-cols-1 overflow-hidden lg:grid-cols-[260px_1fr]">
    <AssetList state={game.state} objects={game.state.objects} selectedId={selectedId} onSelect={select} />
    <section className="relative min-h-0 overflow-hidden">
      {!respawning && <GameHUD phase={game.phase} stateReceivedAt={game.stateReceivedAt} />}
      <WorldCanvas state={game.state} explored={game.explored} selectedId={selectedId} targeting={targetMode !== null} targetableIds={targetableIds} moveTargets={availableMoveTargets} moveArrows={moveArrows} sweepMarkers={sweepMarkers} shotMarkers={shotMarkers} centerRequest={centerRequest} zoomRequest={zoomRequest} onSelect={select} onTarget={chooseTarget} onMoveTarget={chooseMoveTarget} onAnchorChange={setAnchor} />
      {respawning && <RespawnOverlay remainingTicks={respawnTicksRemaining} destroyedBy={coreDestroyer} />}
      {!respawning && selected?.controlled && anchor && actionAvailability && !targetMode && !moveSelecting && <UnitActionDialog anchor={anchor} selected={selected} plan={plan} phase={game.phase} resources={game.state.resources} availability={actionAvailability} onClose={() => select(null)} onTargeting={() => { setMoveSelecting(false); setTargetMode('SHOOT') }} onSweepTargeting={() => { setMoveSelecting(false); setTargetMode('SWEEP') }} onMoveTargeting={() => { setTargetMode(null); setMoveSelecting(true) }} onUnitAction={unitAction} onCoreAction={coreAction} />}
      {targetMode && <div className="panel absolute left-1/2 top-28 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full pl-4 pr-1.5 text-xs text-coral-hostile">{targetMode === 'SWEEP' ? <Sword size={15} /> : <Crosshair size={15} />}<span>{t(targetMode === 'SWEEP' ? 'game.sweepHint' : 'game.targetHint')}</span><button onClick={() => setTargetMode(null)} className="focus-ring ml-1 min-h-11 rounded-full px-3 text-zinc-400 hover:bg-white/5 hover:text-white">{t('common.cancel')}</button></div>}
      {moveSelecting && <div className="panel absolute left-1/2 top-28 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full pl-4 pr-1.5 text-xs text-cyan-signal"><Move size={15} /><span>{t('game.moveHint')}</span><button onClick={() => setMoveSelecting(false)} className="focus-ring ml-1 min-h-11 rounded-full px-3 text-zinc-400 hover:bg-white/5 hover:text-white">{t('common.cancel')}</button></div>}
      {!respawning && <MapControls onCenter={() => setCenterRequest((value) => value + 1)} onZoom={(direction) => setZoomRequest((value) => direction * (Math.abs(value) + 1))} />}
      {game.error && <div role="alert" className="panel absolute bottom-4 right-4 z-30 max-w-[min(24rem,calc(100%-2rem))] px-4 py-3 text-xs leading-5 text-coral-hostile">{getErrorMessage(game.error)}</div>}
    </section>
  </div>
}
