import { Bot, ChevronDown, ListChecks, UserRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CommandReceipts } from '../../lib/commandPlans'
import type {
  CommandPlan,
  CommandSource,
  CoreAction,
  PlayerState,
  UnitAction,
  WorldObject,
} from '../../lib/types'

interface Props {
  tick: number
  state: PlayerState
  receipts: CommandReceipts
}

interface CommandRow {
  key: string
  actor: string
  action: string
  overridesAgent: boolean
}

export function PendingCommands({ tick, state, receipts }: Props) {
  const { t, i18n } = useTranslation()
  const [expanded, setExpanded] = useState(true)
  const sections = useMemo(() => (['AGENT', 'MANUAL'] as CommandSource[])
    .flatMap((source) => {
      const receipt = receipts[source]
      if (!receipt || receipt.tick !== tick) return []
      return [{
        source,
        receivedAt: receipt.received_at,
        rows: commandRows(receipt.plan, source, receipts.AGENT?.tick === tick ? receipts.AGENT.plan : undefined, state, t),
      }]
    }), [receipts, state, t, tick])
  if (!sections.length) return null

  const effectiveCount = effectiveCommandCount(sections.flatMap((section) => section.rows))
  const latestUpdate = sections.reduce((latest, section) =>
    section.receivedAt > latest ? section.receivedAt : latest, '')

  return <section aria-live="polite" className="panel pointer-events-auto absolute right-3 top-16 z-20 w-[min(19rem,calc(100%-1.5rem))] overflow-hidden rounded-gold-lg shadow-[0_18px_48px_rgba(0,0,0,.38)]">
    <button
      type="button"
      aria-expanded={expanded}
      onClick={() => setExpanded((current) => !current)}
      className="focus-ring flex min-h-11 w-full items-center gap-2.5 px-3.5 text-left"
    >
      <span key={latestUpdate} className="pending-command-signal grid size-7 shrink-0 place-items-center rounded-gold-sm bg-cyan-signal/10 text-cyan-signal">
        <ListChecks size={15} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-xs font-semibold text-zinc-100">{t('game.pendingOrders')}</span>
        <span className="mt-0.5 block font-mono text-[9px] text-zinc-500">{t('game.effectiveOrderCount', { count: effectiveCount })}</span>
      </span>
      <ChevronDown size={15} className={`shrink-0 text-zinc-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
    </button>
    {expanded && <div className="max-h-[min(52dvh,27rem)] overflow-y-auto border-t border-white/[.07]">
      {sections.map((section) => {
        const Icon = section.source === 'AGENT' ? Bot : UserRound
        const sourceTone = section.source === 'AGENT' ? 'text-violet-300' : 'text-blue-soft'
        return <div key={section.source} className="px-3.5 py-3">
          <div className="mb-2 flex items-center gap-2">
            <Icon size={13} className={sourceTone} />
            <h2 className={`font-display text-[11px] font-semibold ${sourceTone}`}>{t(section.source === 'AGENT' ? 'game.agent' : 'game.manual')}</h2>
            <time dateTime={section.receivedAt} className="ml-auto font-mono text-[9px] text-zinc-600">
              {new Intl.DateTimeFormat(i18n.language, { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(section.receivedAt))}
            </time>
          </div>
          {section.rows.length ? <ul className="divide-y divide-white/[.055]">
            {section.rows.map((row) => <li key={row.key} className="flex min-h-10 items-center gap-3 py-2">
              <span className="min-w-0 flex-1 truncate text-[11px] text-zinc-400">{row.actor}</span>
              <span className="shrink-0 text-right font-mono text-[9px] text-zinc-200">{row.action}</span>
              {row.overridesAgent && <span className="sr-only">{t('game.overridesAgent')}</span>}
            </li>)}
          </ul> : <p className="py-1 text-[11px] leading-5 text-zinc-500">{t('game.emptySourcePlan')}</p>}
        </div>
      })}
      {sections.some((section) => section.rows.some((row) => row.overridesAgent)) && <p className="border-t border-white/[.07] px-3.5 py-2.5 text-[10px] leading-4 text-zinc-500">
        {t('game.manualOverrideHint')}
      </p>}
    </div>}
  </section>
}

function commandRows(
  plan: CommandPlan,
  source: CommandSource,
  agentPlan: CommandPlan | undefined,
  state: PlayerState,
  t: (key: string, options?: Record<string, unknown>) => string,
): CommandRow[] {
  const objects = new Map(state.objects.flatMap((object) => object.id ? [[object.id, object] as const] : []))
  const rows: CommandRow[] = []
  if (plan.core_action) {
    rows.push({
      key: 'core',
      actor: t('game.units.CORE'),
      action: describeCoreAction(plan.core_action, t),
      overridesAgent: source === 'MANUAL' && Boolean(agentPlan?.core_action),
    })
  }
  const actions = Object.entries(plan.unit_actions).sort(([left], [right]) =>
    actorName(objects.get(left), left, t).localeCompare(actorName(objects.get(right), right, t)))
  for (const [id, action] of actions) {
    rows.push({
      key: id,
      actor: actorName(objects.get(id), id, t),
      action: describeUnitAction(action, objects, t),
      overridesAgent: source === 'MANUAL' && Boolean(agentPlan?.unit_actions[id]),
    })
  }
  return rows
}

function describeCoreAction(action: CoreAction, t: (key: string, options?: Record<string, unknown>) => string) {
  const parts = [t(`game.actions.${action.type}`)]
  if (action.direction) parts.push(t(`game.directions.${action.direction}`))
  if (action.unit_type) parts.push(t(`game.units.${action.unit_type}`))
  return parts.join(' · ')
}

function describeUnitAction(
  action: UnitAction,
  objects: Map<string, WorldObject>,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  const parts = [t(`game.actions.${action.type}`)]
  if (action.direction) parts.push(t(`game.directions.${action.direction}`))
  if (action.expected_cell) parts.push(`[${action.expected_cell.join(', ')}]`)
  else if (action.target_id) parts.push(actorName(objects.get(action.target_id), action.target_id, t))
  return parts.join(' · ')
}

function actorName(
  object: WorldObject | undefined,
  id: string,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  const shortID = `${id.slice(0, 6)}…${id.slice(-4)}`
  if (!object) return shortID
  const name = object.kind === 'CORE' ? t('game.units.CORE') : t(`game.units.${object.unit_type}`)
  return `${name} · ${shortID}`
}

function effectiveCommandCount(rows: CommandRow[]) {
  const keys = new Set(rows.map((row) => row.key))
  return keys.size
}
