import { Crosshair, Move, Sword } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { AssetList } from '../components/game/AssetList'
import { GameHUD } from '../components/game/GameHUD'
import { MapControls } from '../components/game/MapControls'
import { UnitActionDialog, type MapAnchor } from '../components/game/UnitActionDialog'
import { WorldCanvas } from '../components/game/WorldCanvas'
import { TutorialCoach } from '../components/tutorial/TutorialCoach'
import { useAuth } from '../context/AuthContext'
import { getActionAvailability, type ActionAvailability, type AvailableAction } from '../lib/actionAvailability'
import { plannedShotMarkers, plannedSweepMarkers } from '../lib/combatPreview'
import { buildMovementRoutes, findMovementPath, type MovementGoals } from '../lib/pathfinding'
import { directionTo, plannedMoveArrows } from '../lib/movementPreview'
import { completeTutorial, readTutorialProgress, saveTutorialStep, skipTutorial } from '../lib/tutorialProgress'
import { createTutorialExplored, createTutorialState, moveTutorialObject, TUTORIAL_IDS, TUTORIAL_POSITIONS } from '../lib/tutorialScenario'
import type { CommandPlan, CoreAction, Position, StreamPhase, UnitAction, WorldObject } from '../lib/types'

const expectedSelection: Partial<Record<number, string>> = {
  2: TUTORIAL_IDS.worker,
  3: TUTORIAL_IDS.worker,
  4: TUTORIAL_IDS.worker,
  5: TUTORIAL_IDS.worker,
  6: TUTORIAL_IDS.worker,
  7: TUTORIAL_IDS.worker,
  8: TUTORIAL_IDS.core,
  9: TUTORIAL_IDS.vanguard,
  10: TUTORIAL_IDS.ranger,
  11: TUTORIAL_IDS.worker,
}

const expectedDestination: Partial<Record<number, Position>> = {
  3: TUTORIAL_POSITIONS.resource,
  5: TUTORIAL_POSITIONS.core,
  7: TUTORIAL_POSITIONS.beacon,
}

const stepAfterMovement: Partial<Record<number, number>> = { 3: 4, 5: 6, 7: 8 }

export function TutorialPage({ preview = false }: { preview?: boolean }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const username = preview ? 'tutorial-preview' : user?.username ?? 'anonymous'
  const initialProgress = useMemo(() => readTutorialProgress(username), [username])
  const initialStep = preview ? 0 : initialProgress.status === 'in_progress' ? initialProgress.step : 12
  const explored = useMemo(() => createTutorialExplored(), [])
  const [step, setStep] = useState(initialStep)
  const [state, setState] = useState(() => createTutorialState(initialStep))
  const [tick, setTick] = useState(7000 + initialStep)
  const [phase, setPhase] = useState<StreamPhase>('open')
  const [stateReceivedAt, setStateReceivedAt] = useState(() => Date.now())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [targetMode, setTargetMode] = useState<'SHOOT' | 'SWEEP' | null>(null)
  const [moveSelecting, setMoveSelecting] = useState(false)
  const [movementGoals, setMovementGoals] = useState<MovementGoals>({})
  const [plan, setPlan] = useState<CommandPlan>({ tick: 7000 + initialStep, unit_actions: {} })
  const [anchor, setAnchor] = useState<MapAnchor | null>(null)
  const [centerRequest, setCenterRequest] = useState(0)
  const [zoomRequest, setZoomRequest] = useState(0)
  const [busy, setBusy] = useState(false)
  const [received, setReceived] = useState(false)
  const [feedback, setFeedback] = useState('')
  const timers = useRef(new Set<number>())

  const schedule = useCallback((callback: () => void, delay: number) => {
    const timer = window.setTimeout(() => {
      timers.current.delete(timer)
      callback()
    }, delay)
    timers.current.add(timer)
  }, [])

  useEffect(() => () => {
    for (const timer of timers.current) window.clearTimeout(timer)
    timers.current.clear()
  }, [])

  useEffect(() => {
    if (phase !== 'open' || busy || step >= 12) return
    const timer = window.setTimeout(() => {
      setTick((current) => current + 1)
      setPlan((current) => ({ tick: current.tick + 1, unit_actions: {} }))
      setStateReceivedAt(Date.now())
    }, 15_000)
    return () => window.clearTimeout(timer)
  }, [busy, phase, stateReceivedAt, step])

  const selected = useMemo(() => state.objects.find((object) => object.id === selectedId) ?? null, [selectedId, state.objects])
  const routes = useMemo(() => buildMovementRoutes(state, explored, movementGoals, plan), [explored, movementGoals, plan, state])
  const moveArrows = useMemo(() => plannedMoveArrows(state, plan, routes), [plan, routes, state])
  const sweepMarkers = useMemo(() => plannedSweepMarkers(state, plan), [plan, state])
  const shotMarkers = useMemo(() => plannedShotMarkers(state, plan), [plan, state])
  const targetableIds = useMemo(() => {
    if (targetMode === 'SWEEP') return new Set([TUTORIAL_IDS.enemyVanguard])
    if (targetMode === 'SHOOT') return new Set([TUTORIAL_IDS.enemyRanger])
    return new Set<string>()
  }, [targetMode])

  const actionAvailability = useMemo(() => {
    if (!selected) return null
    return tutorialAvailability(getActionAvailability(state, selected, plan), step)
  }, [plan, selected, state, step])

  const routeDestinations = useMemo(() => {
    const planned = routes.map((route) => ({ objectId: route.objectId, position: route.destination, blocked: route.blocked }))
    const expected = expectedDestination[step]
    if (!moveSelecting || !expected || !selected?.id) return planned
    return [...planned.filter((destination) => destination.objectId !== selected.id), {
      objectId: selected.id,
      position: expected,
      blocked: false,
      selectable: true,
      immediate: Math.abs(expected[0] - selected.position![0]) + Math.abs(expected[1] - selected.position![1]) === 1,
    }]
  }, [moveSelecting, routes, selected, step])

  const highlightPositions = useMemo((): Position[] => {
    if (moveSelecting && expectedDestination[step]) return [expectedDestination[step]!]
    if (targetMode === 'SWEEP') return [TUTORIAL_POSITIONS.enemyVanguard]
    if (targetMode === 'SHOOT') return [TUTORIAL_POSITIONS.enemyRanger]
    const objectId = expectedSelection[step]
    const object = objectId ? state.objects.find((candidate) => candidate.id === objectId) : null
    return object?.position ? [object.position] : []
  }, [moveSelecting, state.objects, step, targetMode])

  const changeStep = useCallback((nextStep: number, nextState = createTutorialState(nextStep)) => {
    saveTutorialStep(username, nextStep)
    setStep(nextStep)
    setState(nextState)
    setStateReceivedAt(Date.now())
    setFeedback('')
  }, [username])

  const finishResolution = useCallback((nextStep: number) => {
    changeStep(nextStep)
    setTick((current) => {
      const nextTick = current + 1
      setPlan({ tick: nextTick, unit_actions: {} })
      return nextTick
    })
    setMovementGoals({})
    setSelectedId(null)
    setTargetMode(null)
    setMoveSelecting(false)
    setReceived(false)
    setBusy(false)
    setPhase('open')
    setStateReceivedAt(Date.now())
  }, [changeStep])

  const resolveAction = useCallback((nextStep: number, nextPlan: CommandPlan) => {
    if (busy) return
    setFeedback('')
    setPlan(nextPlan)
    setReceived(true)
    setBusy(true)
    setPhase('settling')
    setSelectedId(null)
    setTargetMode(null)
    setMoveSelecting(false)
    schedule(() => setPhase('syncing'), 480)
    schedule(() => finishResolution(nextStep), 880)
  }, [busy, finishResolution, schedule])

  const runMovement = useCallback((object: WorldObject, destination: Position, nextStep: number) => {
    if (!object.id || !object.position || busy) return
    const result = findMovementPath(state, explored, object, destination, plan)
    if (!result.path || result.path.length < 2) {
      setFeedback(t('tutorial.wrongDestination'))
      return
    }
    const path = result.path
    const firstDirection = directionTo(path[0], path[1])
    if (!firstDirection) return
    setFeedback('')
    setMovementGoals({ [object.id]: destination })
    setPlan({ tick, unit_actions: { [object.id]: { type: 'MOVE', direction: firstDirection } } })
    setReceived(true)
    setBusy(true)
    setMoveSelecting(false)
    setSelectedId(null)
    setPhase('settling')

    const moveAt = (index: number) => {
      setPhase('syncing')
      setState((current) => moveTutorialObject(current, object.id!, path[index]))
      setTick((current) => current + 1)
      schedule(() => {
        if (index === path.length - 1) {
          finishResolution(nextStep)
          return
        }
        const nextDirection = directionTo(path[index], path[index + 1])
        setPlan((current) => ({ tick: current.tick + 1, unit_actions: nextDirection ? { [object.id!]: { type: 'MOVE', direction: nextDirection } } : {} }))
        setPhase('open')
        setStateReceivedAt(Date.now())
        schedule(() => {
          setPhase('settling')
          schedule(() => moveAt(index + 1), 260)
        }, 520)
      }, 440)
    }
    schedule(() => moveAt(1), 520)
  }, [busy, explored, finishResolution, plan, schedule, state, t, tick])

  const select = useCallback((object: WorldObject | null) => {
    if (busy || !object) {
      if (!busy) setSelectedId(null)
      return
    }
    const expected = expectedSelection[step]
    if (!object.controlled || (expected && object.id !== expected)) {
      setFeedback(t(`tutorial.steps.${step}.wrong`))
      return
    }
    setFeedback('')
    setSelectedId(object.id ?? null)
    setTargetMode(null)
    setMoveSelecting(false)
    if (step === 2 && object.id === TUTORIAL_IDS.worker) changeStep(3, state)
  }, [busy, changeStep, state, step, t])

  const chooseMoveDestination = useCallback((destination: Position) => {
    const expected = expectedDestination[step]
    const nextStep = stepAfterMovement[step]
    if (!selected || !expected || nextStep === undefined || destination[0] !== expected[0] || destination[1] !== expected[1]) {
      setFeedback(t('tutorial.wrongDestination'))
      return
    }
    runMovement(selected, destination, nextStep)
  }, [runMovement, selected, step, t])

  const unitAction = useCallback((id: string, action: UnitAction | null) => {
    if (!action || busy) return
    if (step === 4 && id === TUTORIAL_IDS.worker && action.type === 'HARVEST') {
      resolveAction(5, { tick, unit_actions: { [id]: action } })
      return
    }
    if (step === 6 && id === TUTORIAL_IDS.worker && action.type === 'DEPOSIT') {
      resolveAction(7, { tick, unit_actions: { [id]: action } })
      return
    }
    if (step === 11 && id === TUTORIAL_IDS.worker && action.type === 'PICKUP_BEACON') {
      resolveAction(12, { tick, unit_actions: { [id]: action } })
    }
  }, [busy, resolveAction, step, tick])

  const coreAction = useCallback((action: CoreAction | null) => {
    if (!action || busy) return
    if (step === 8 && action.type === 'SPAWN' && action.unit_type === 'VANGUARD') resolveAction(9, { tick, unit_actions: {}, core_action: action })
  }, [busy, resolveAction, step, tick])

  const chooseTarget = useCallback((target: WorldObject) => {
    if (!selected?.id || !selected.position || !target.id || !target.position || busy) return
    if (step === 9 && targetMode === 'SWEEP' && target.id === TUTORIAL_IDS.enemyVanguard) {
      const direction = directionTo(selected.position, target.position)
      if (direction) resolveAction(10, { tick, unit_actions: { [selected.id]: { type: 'SWEEP', direction } } })
      return
    }
    if (step === 10 && targetMode === 'SHOOT' && target.id === TUTORIAL_IDS.enemyRanger) {
      resolveAction(11, { tick, unit_actions: { [selected.id]: { type: 'SHOOT', target_id: target.id, expected_cell: target.position } } })
    }
  }, [busy, resolveAction, selected, step, targetMode, tick])

  const continueTutorial = () => {
    if (step === 0) changeStep(1, state)
    else if (step === 1) changeStep(2, state)
  }
  const skip = () => { skipTutorial(username); navigate(preview ? '/demo' : '/arena', { replace: true }) }
  const enterArena = () => { completeTutorial(username); navigate('/arena', { replace: true }) }

  return <div className="grid h-dvh min-h-[560px] grid-cols-1 overflow-hidden lg:grid-cols-[260px_1fr]">
    <AssetList state={state} objects={state.objects} selectedId={selectedId} onSelect={select} />
    <section className="relative min-h-0 overflow-hidden">
      <div className="panel pointer-events-none absolute left-3 top-16 z-20 rounded-gold px-3 py-2 font-mono text-[9px] tracking-[.12em] text-zinc-400 lg:top-3">
        <span className="text-blue-soft">{t('tutorial.training')}</span><span className="mx-2 text-zinc-700">/</span>TICK {tick}
      </div>
      <GameHUD phase={phase} stateReceivedAt={stateReceivedAt} />
      <WorldCanvas
        state={state}
        explored={explored}
        selectedId={selectedId}
        targeting={targetMode !== null}
        destinationSelecting={moveSelecting}
        targetableIds={targetableIds}
        routeDestinations={routeDestinations}
        moveArrows={moveArrows}
        sweepMarkers={sweepMarkers}
        shotMarkers={shotMarkers}
        centerRequest={centerRequest}
        zoomRequest={zoomRequest}
        onSelect={select}
        onTarget={chooseTarget}
        onMoveDestination={chooseMoveDestination}
        onCenterBeacon={() => setCenterRequest((value) => value + 1)}
        onAnchorChange={setAnchor}
        highlightPositions={highlightPositions}
        preferredSelectionId={expectedSelection[step]}
      />
      {received && <div role="status" className="panel absolute left-1/2 top-24 z-30 -translate-x-1/2 rounded-gold px-3 py-2 font-mono text-[10px] text-cyan-signal">{t('game.actionReceived')}</div>}
      {selected?.controlled && anchor && actionAvailability && !targetMode && !moveSelecting && !busy && <UnitActionDialog
        anchor={anchor}
        selected={selected}
        plan={plan}
        phase={phase}
        resources={state.resources}
        availability={actionAvailability}
        onClose={() => setSelectedId(null)}
        onTargeting={() => { setMoveSelecting(false); setTargetMode('SHOOT') }}
        onSweepTargeting={() => { setMoveSelecting(false); setTargetMode('SWEEP') }}
        onMoveTargeting={() => { setTargetMode(null); setMoveSelecting(true); setFeedback('') }}
        onUnitAction={unitAction}
        onCoreAction={coreAction}
      />}
      {targetMode && <div className="panel absolute left-1/2 top-28 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 text-xs text-cyan-signal">{targetMode === 'SWEEP' ? <Sword size={15} /> : <Crosshair size={15} />}{t(targetMode === 'SWEEP' ? 'game.sweepHint' : 'game.targetHint')}</div>}
      {moveSelecting && <div className="panel absolute left-1/2 top-28 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 text-xs text-cyan-signal"><Move size={15} />{t('tutorial.chooseMarkedCell')}</div>}
      <MapControls onCenter={() => setCenterRequest((value) => value + 1)} onZoom={(direction) => setZoomRequest((value) => direction * (Math.abs(value) + 1))} />
      <TutorialCoach step={step} busy={busy} feedback={feedback} onContinue={continueTutorial} onSkip={skip} onEnterArena={enterArena} />
    </section>
  </div>
}

function tutorialAvailability(base: ActionAvailability, step: number): ActionAvailability {
  const expectedAction: Partial<Record<number, AvailableAction>> = {
    3: 'MOVE',
    4: 'HARVEST',
    5: 'MOVE',
    6: 'DEPOSIT',
    7: 'MOVE',
    9: 'SWEEP',
    10: 'SHOOT',
    11: 'PICKUP_BEACON',
  }
  const action = expectedAction[step]
  return {
    actions: Object.fromEntries(Object.keys(base.actions).map((key) => [key, key === action && base.actions[key as AvailableAction] === true])),
    spawns: {
      WORKER: false,
      VANGUARD: step === 8 && base.spawns.VANGUARD,
      RANGER: false,
    },
  }
}
