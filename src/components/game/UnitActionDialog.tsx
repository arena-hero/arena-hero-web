import { PackagePlus, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type ActionAvailability, type AvailableAction } from '../../lib/actionAvailability'
import { unitCost } from '../../lib/gameRules'
import type { CommandPlan, CoreAction, Position, StreamPhase, UnitAction, UnitActionType, UnitType, WorldObject } from '../../lib/types'
import { UnitArtIcon } from './UnitArtIcon'

export interface MapAnchor { x: number; y: number; side: 'left' | 'right' | 'top' | 'bottom' }

interface Props {
  anchor: MapAnchor
  selected: WorldObject
  plan: CommandPlan
  movementGoal?: Position
  phase: StreamPhase
  resources: number
  population?: number
  availability: ActionAvailability
  onClose: () => void
  onTargeting: () => void
  onSweepTargeting: () => void
  onMoveTargeting: () => void
  onCancelMovementGoal?: () => void
  onUnitAction: (id: string, action: UnitAction | null) => void
  onCoreAction: (action: CoreAction | null) => void
}

export function UnitActionDialog(props: Props) {
  const { t } = useTranslation(); const dialogRef = useRef<HTMLDivElement>(null)
  const [blockedAction, setBlockedAction] = useState<{ selectedId?: string; action: AvailableAction } | null>(null)
  useEffect(() => { dialogRef.current?.focus() }, [props.selected.id])
  const currentAction = props.selected.kind === 'CORE' ? props.plan.core_action : props.selected.id ? props.plan.unit_actions[props.selected.id] : undefined
  const actionTypes = useMemo(() => {
    let actions: AvailableAction[]
    if (props.selected.kind === 'CORE') actions = props.selected.state === 'MOVING' ? ['CANCEL_MOVE'] : ['HEAL', 'REPAIR_SHIELD', 'START_MOVE']
    else if (props.selected.unit_type === 'WORKER') actions = ['MOVE', 'HARVEST', 'DEPOSIT']
    else if (props.selected.unit_type === 'VANGUARD') actions = ['MOVE', 'SWEEP']
    else actions = ['MOVE', 'SHOOT']
    if (props.availability.actions.DROP_BEACON) actions.push('DROP_BEACON')
    else if (props.availability.actions.PICKUP_BEACON) actions.push('PICKUP_BEACON')
    if (props.selected.kind === 'UNIT') actions.push('HEAL')
    actions.push('SELF_DESTRUCT')
    actions.push('WAIT')
    return actions
  }, [props.availability.actions.DROP_BEACON, props.availability.actions.PICKUP_BEACON, props.selected])
  const choose = (type: string) => {
    const action = type as AvailableAction
    if (!props.selected.id || props.phase !== 'open') return
    if (!props.availability.actions[action]) {
      if (props.availability.unavailableReasons?.[action]) setBlockedAction({ selectedId: props.selected.id, action })
      return
    }
    setBlockedAction(null)
    if (type === 'MOVE' || type === 'START_MOVE') { props.onMoveTargeting(); return }
    if (type === 'SWEEP') { props.onSweepTargeting(); return }
    if (type === 'SHOOT') { props.onTargeting(); return }
    if (type === 'SELF_DESTRUCT' && !window.confirm(t(props.selected.kind === 'CORE' ? 'game.confirmCoreSelfDestruct' : 'game.confirmSelfDestruct'))) return
    if (props.selected.kind === 'CORE') props.onCoreAction({ type: type as CoreAction['type'] })
    else props.onUnitAction(props.selected.id, { type: type as UnitActionType })
    props.onClose()
  }
  const spawn = (unit_type: UnitType) => { if (props.phase !== 'open' || !props.availability.spawns[unit_type]) return; props.onCoreAction({ type: 'SPAWN', unit_type }); props.onClose() }
  const clear = () => { if (props.selected.kind === 'CORE') props.onCoreAction(null); else if (props.selected.id) props.onUnitAction(props.selected.id, null); props.onClose() }
  const name = props.selected.kind === 'CORE' ? t('game.units.CORE') : t(`game.units.${props.selected.unit_type}`)
  const selectedArtType = props.selected.kind === 'CORE' ? 'CORE' : props.selected.unit_type ?? 'WORKER'
  const transforms = { right: 'translate(0, -50%)', left: 'translate(-100%, -50%)', top: 'translate(0, -100%)', bottom: 'translate(0, 0)' }
  const arrowClasses = { right: '-left-1.5 top-1/2 -translate-y-1/2 border-b border-l', left: '-right-1.5 top-1/2 -translate-y-1/2 border-r border-t', top: '-bottom-1.5 left-1/2 -translate-x-1/2 border-b border-r', bottom: '-top-1.5 left-1/2 -translate-x-1/2 border-l border-t' }
  const style = { left: props.anchor.x, top: props.anchor.y, transform: transforms[props.anchor.side] }
  const blockedReason = blockedAction && blockedAction.selectedId === props.selected.id ? props.availability.unavailableReasons?.[blockedAction.action] : undefined
  return <div ref={dialogRef} role="dialog" aria-label={`${name} ${t('game.orders')}`} tabIndex={-1} onKeyDown={(event) => { if (event.key === 'Escape') props.onClose() }} style={style} className="panel absolute z-30 w-[min(18rem,calc(100%-1.5rem))] rounded-gold-lg p-3 shadow-2xl shadow-black/60 outline-none">
    <span aria-hidden="true" className={`absolute size-3 rotate-45 border-white/10 bg-space-900 ${arrowClasses[props.anchor.side]}`} />
    <div className="flex items-start justify-between gap-3 px-1 pb-3"><div className="flex min-w-0 items-center gap-2"><span className="grid size-9 shrink-0 place-items-center rounded-gold-sm border border-violet-cosmic/15 bg-indigo-deep/45"><UnitArtIcon type={selectedArtType} className="size-7" /></span><div className="min-w-0"><p className="eyebrow text-cyan-signal">{props.selected.kind === 'CORE' ? 'CORE' : props.selected.unit_type}</p><div className="mt-1 truncate font-display text-base">{name} <span className="font-mono text-[9px] text-zinc-600">[{props.selected.position?.join(', ')}]</span></div></div></div><div className="flex items-start gap-2"><div className="pt-1 text-right font-mono text-[10px] text-cyan-signal">{props.selected.hp} HP{props.selected.shield !== undefined && <div className="text-violet-cosmic">{props.selected.shield} SHD</div>}</div><button onClick={props.onClose} className="focus-ring grid size-11 place-items-center rounded-gold text-zinc-500 hover:bg-white/5 hover:text-zinc-200" aria-label="Close"><X size={16} /></button></div></div>
    <div className={`grid gap-2 ${actionTypes.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>{actionTypes.map((type) => {
      const action = type as AvailableAction
      const available = props.phase === 'open' && Boolean(props.availability.actions[action])
      const explainsUnavailable = props.phase === 'open' && Boolean(props.availability.unavailableReasons?.[action])
      const unavailableClass = !available && explainsUnavailable ? 'cursor-help border-amber-300/25 bg-amber-300/[.05] text-amber-200/80 opacity-80' : ''
      return <button key={type} onClick={() => choose(type)} disabled={!available && !explainsUnavailable} aria-disabled={!available || undefined} className={type === 'SELF_DESTRUCT' ? 'focus-ring min-h-11 rounded-gold border border-coral-hostile/30 bg-coral-hostile/[.08] px-2 text-xs text-coral-hostile hover:bg-coral-hostile/[.14] disabled:cursor-not-allowed disabled:opacity-40' : `secondary-button min-h-11 px-2 text-xs disabled:cursor-not-allowed disabled:border-white/[.04] disabled:bg-white/[.015] disabled:text-zinc-700 disabled:opacity-60 ${unavailableClass}`}>{t(`game.actions.${type}`)}</button>
    })}</div>
    {blockedReason?.code === 'CORE_RESOURCE_FULL' && <p role="alert" className="mt-3 rounded-gold border border-amber-300/20 bg-amber-300/[.06] px-3 py-2 text-xs leading-5 text-amber-100">{t('game.coreResourceFull', { capacity: blockedReason.capacity })}</p>}
    {blockedReason?.code === 'NOT_AT_OWN_CORE' && <p role="alert" className="mt-3 rounded-gold border border-amber-300/20 bg-amber-300/[.06] px-3 py-2 text-xs leading-5 text-amber-100">{t('game.healRequiresOwnCore')}</p>}
    {blockedReason?.code === 'CORE_MOVING' && <p role="alert" className="mt-3 rounded-gold border border-amber-300/20 bg-amber-300/[.06] px-3 py-2 text-xs leading-5 text-amber-100">{t('game.healCoreMoving')}</p>}
    {props.selected.kind === 'CORE' && <section aria-labelledby="produce-unit-title" className="mt-3 border-t border-white/[.07] pt-3">
      <div className="mb-2 flex items-center justify-between gap-3 px-1">
        <div id="produce-unit-title" className="flex items-center gap-2 text-xs font-medium text-zinc-300"><PackagePlus size={14} className="text-green-resource" />{t('game.produceUnit')}</div>
        <span className="font-mono text-[9px] text-zinc-600">{t('game.resourcesAvailable', { count: props.resources })}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">{(['WORKER', 'VANGUARD', 'RANGER'] as UnitType[]).map((unit) => {
        const canSpawn = props.phase === 'open' && props.availability.spawns[unit]
        const cost = unitCost(unit, props.population ?? 0)
        return <button key={unit} aria-label={`${t(`game.units.${unit}`)} · ${t('game.unitCost', { cost })}`} onClick={() => spawn(unit)} disabled={!canSpawn} className="focus-ring min-h-16 rounded-gold border border-white/[.06] bg-white/[.025] px-1.5 py-2 hover:border-green-resource/25 hover:bg-green-resource/[.05] disabled:cursor-not-allowed disabled:border-white/[.045] disabled:bg-white/[.015]">
          <UnitArtIcon type={unit} className={`mx-auto mb-1 size-6 ${canSpawn ? '' : 'opacity-30 grayscale'}`} />
          <span className={`block text-[10px] font-medium ${canSpawn ? 'text-zinc-200' : 'text-zinc-500'}`}>{t(`game.units.${unit}`)}</span>
          <span className={`mt-1 block font-mono text-[9px] ${canSpawn ? 'text-green-resource' : 'text-zinc-600'}`}>{t('game.unitCost', { cost })}</span>
        </button>
      })}</div>
    </section>}
    {props.movementGoal && <div className="mt-3 flex min-h-11 items-center justify-between rounded-gold border border-violet-cosmic/10 bg-indigo-deep/35 pl-3 font-mono text-[10px] text-blue-soft"><span>{t('game.routeTo', { x: props.movementGoal[0], y: props.movementGoal[1] })}</span><button onClick={props.onCancelMovementGoal} className="focus-ring grid size-11 place-items-center rounded-gold-sm hover:bg-white/5" aria-label={t('game.clearRoute')}><Trash2 size={14} /></button></div>}
    {currentAction && !props.movementGoal && <div className="mt-3 flex min-h-11 items-center justify-between rounded-gold border border-violet-cosmic/10 bg-indigo-deep/35 pl-3 font-mono text-[10px] text-blue-soft"><span>{currentAction.type}{'direction' in currentAction && currentAction.direction ? ` · ${currentAction.direction}` : ''}{'unit_type' in currentAction && currentAction.unit_type ? ` · ${currentAction.unit_type}` : ''}</span><button onClick={clear} className="focus-ring grid size-11 place-items-center rounded-gold-sm hover:bg-white/5" aria-label={t('game.clear')}><Trash2 size={14} /></button></div>}
  </div>
}
