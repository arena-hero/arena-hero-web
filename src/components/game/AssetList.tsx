import { Box, CircleDot, Crosshair, Pickaxe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { WorldObject } from '../../lib/types'
import { Logo } from '../Logo'

const iconFor = (object: WorldObject) => object.kind === 'CORE' ? CircleDot : object.unit_type === 'WORKER' ? Pickaxe : object.unit_type === 'RANGER' ? Crosshair : Box

export function AssetList({ objects, selectedId, onSelect }: { objects: WorldObject[]; selectedId: string | null; onSelect: (object: WorldObject) => void }) {
  const { t } = useTranslation(); const controlled = objects.filter((object) => object.controlled)
  return <aside className="panel-strong hidden h-full min-h-0 flex-col border-y-0 border-l-0 lg:flex">
    <div className="border-b border-white/[.07]">
      <div className="px-5 py-4"><Logo /></div>
      <div className="border-t border-white/[.07] px-5 py-4">
        <p className="eyebrow">FLEET INDEX</p>
        <h2 className="mt-2 font-display text-lg">{t('game.objects')}</h2>
      </div>
    </div>
    <div className="min-h-0 flex-1 overflow-y-auto p-3">
      {controlled.map((object) => { const Icon = iconFor(object); const name = object.kind === 'CORE' ? t('game.units.CORE') : t(`game.units.${object.unit_type}`); return <button key={object.id} onClick={() => onSelect(object)} className={`focus-ring mb-1 flex min-h-14 w-full items-center gap-3 rounded-gold px-3 text-left transition-colors ${selectedId === object.id ? 'bg-cyan-signal/10 text-cyan-signal' : 'text-zinc-400 hover:bg-white/[.04] hover:text-zinc-100'}`}>
        <span className="grid size-9 place-items-center rounded-gold-sm border border-current/20 bg-current/5"><Icon size={16} /></span><span className="min-w-0 flex-1"><span className="block text-sm font-medium">{name}</span><span className="block truncate font-mono text-[9px] text-zinc-600">{object.id?.slice(0,8)} · {object.position?.join(', ')}</span></span><span className="font-mono text-[10px]">{object.hp} HP</span>
      </button> })}
    </div>
  </aside>
}
