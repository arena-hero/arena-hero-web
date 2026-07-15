import { Check, Copy, KeyRound, LoaderCircle, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../../lib/api'
import { getErrorMessage } from '../../lib/errorMessage'
import type { APIKeyView } from '../../lib/types'

interface ActionDialogProps {
  title: string
  description: string
  dismissible?: boolean
  onClose: () => void
  children: React.ReactNode
}

function ActionDialog({ title, description, dismissible = true, onClose, children }: ActionDialogProps) {
  const { t } = useTranslation()
  const titleId = useId()
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || dialog.open) return
    if (typeof dialog.showModal === 'function') dialog.showModal()
    else dialog.setAttribute('open', '')
    return () => {
      if (!dialog.open) return
      if (typeof dialog.close === 'function') dialog.close()
      else dialog.removeAttribute('open')
    }
  }, [])

  return <dialog
    ref={dialogRef}
    aria-labelledby={titleId}
    onCancel={(event) => { event.preventDefault(); if (dismissible) onClose() }}
    onPointerDown={(event) => { if (dismissible && event.target === event.currentTarget) onClose() }}
    className="m-auto w-[calc(100%-1.5rem)] max-w-lg overflow-visible bg-transparent p-0 text-left text-zinc-100 backdrop:bg-black/85 backdrop:backdrop-blur-sm"
  >
    <section className="panel-strong overflow-hidden rounded-gold-xl shadow-2xl shadow-black/70">
      <header className="flex items-start justify-between gap-5 border-b border-white/[.07] px-5 py-5 sm:px-6">
        <div>
          <h3 id={titleId} className="font-display text-xl font-semibold text-zinc-100">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-500">{description}</p>
        </div>
        <button type="button" disabled={!dismissible} onClick={onClose} className="focus-ring grid size-11 shrink-0 cursor-pointer place-items-center rounded-gold text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-30" aria-label={t('common.close')}><X size={18} /></button>
      </header>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  </dialog>
}

function keyLabel(key: APIKeyView) {
  return key.name || `${key.prefix}••••••••`
}

function keyMetadata(key: APIKeyView): APIKeyView {
  return {
    id: key.id,
    name: key.name,
    prefix: key.prefix,
    created_at: key.created_at,
    last_used_at: key.last_used_at,
    revoked_at: key.revoked_at,
  }
}

export function APIKeysDialogContent() {
  const { t } = useTranslation()
  const [keys, setKeys] = useState<APIKeyView[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [notice, setNotice] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [created, setCreated] = useState<APIKeyView | null>(null)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle')

  const [pendingDelete, setPendingDelete] = useState<APIKeyView | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const load = async () => {
    setLoading(true)
    setLoadError('')
    try {
      const loaded = await api.apiKeys()
      setKeys(loaded.filter((key) => !key.revoked_at))
    } catch (cause) {
      setLoadError(getErrorMessage(cause))
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { void load() }, [])

  const openCreate = () => {
    setNotice('')
    setCreateError('')
    setCreated(null)
    setCopyStatus('idle')
    setCreateOpen(true)
  }
  const closeCreate = () => {
    if (creating) return
    setCreateOpen(false)
    setCreated(null)
    setCopyStatus('idle')
  }
  const create = async () => {
    setCreating(true)
    setCreateError('')
    try {
      const key = await api.createAPIKey()
      setCreated(key)
      setKeys((current) => [keyMetadata(key), ...current.filter((item) => item.id !== key.id)])
    } catch (cause) {
      setCreateError(getErrorMessage(cause))
    } finally {
      setCreating(false)
    }
  }
  const copy = async () => {
    if (!created?.key) return
    try {
      await navigator.clipboard.writeText(created.key)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('failed')
    }
  }

  const openDelete = (key: APIKeyView) => {
    setNotice('')
    setDeleteError('')
    setPendingDelete(key)
  }
  const closeDelete = () => {
    if (deleting) return
    setPendingDelete(null)
    setDeleteError('')
  }
  const remove = async () => {
    if (!pendingDelete) return
    const id = pendingDelete.id
    setDeleting(true)
    setDeleteError('')
    try {
      await api.revokeAPIKey(id)
      setKeys((current) => current.filter((key) => key.id !== id))
      setPendingDelete(null)
      setNotice(t('keys.deleted'))
    } catch (cause) {
      setDeleteError(getErrorMessage(cause))
    } finally {
      setDeleting(false)
    }
  }

  return <div className="space-y-5">
    <div className="flex justify-end">
      <button type="button" onClick={openCreate} className="primary-button flex cursor-pointer items-center justify-center gap-2"><Plus size={16} />{t('keys.create')}</button>
    </div>

    {notice && <p role="status" className="flex items-center gap-2 rounded-gold border border-green-resource/20 bg-green-resource/5 px-4 py-3 text-sm text-green-resource"><Check size={16} />{notice}</p>}
    {loadError && <div role="alert" className="flex flex-col gap-3 rounded-gold border border-coral-hostile/20 bg-coral-hostile/5 px-4 py-3 text-sm text-coral-hostile sm:flex-row sm:items-center sm:justify-between"><span>{loadError}</span><button type="button" onClick={() => void load()} className="secondary-button cursor-pointer px-3">{t('common.retry')}</button></div>}

    {loading && !keys.length ? <div className="grid min-h-48 place-items-center"><LoaderCircle className="animate-spin text-cyan-signal" aria-label={t('common.loading')} /></div> : <div className="space-y-2" aria-busy={loading}>
      {!keys.length && !loadError && <div className="grid min-h-52 place-items-center border-y border-white/[.07] px-5 text-center"><div><KeyRound className="mx-auto text-zinc-700" size={28} /><p className="mt-4 text-sm text-zinc-400">{t('keys.empty')}</p><p className="mt-1 text-xs leading-5 text-zinc-600">{t('keys.emptyHelp')}</p></div></div>}
      {keys.map((key) => <article key={key.id} className="flex flex-col gap-4 border-b border-white/[.07] px-1 py-4 first:border-t sm:flex-row sm:items-center sm:px-2">
        <div className="grid size-11 shrink-0 place-items-center rounded-gold bg-cyan-signal/8 text-cyan-signal"><KeyRound size={18} /></div>
        <div className="min-w-0 flex-1">
          <div className={key.name ? 'truncate font-medium text-zinc-200' : 'truncate font-mono text-xs text-zinc-300'}>{keyLabel(key)}</div>
          {key.name && <div className="mt-1 font-mono text-[10px] text-zinc-600">{key.prefix}••••••••</div>}
        </div>
        <div className="grid grid-cols-2 gap-x-7 text-xs sm:flex sm:gap-8">
          <div><span className="block text-[10px] text-zinc-600">{t('keys.created')}</span><span className="mt-1 block text-zinc-400">{new Date(key.created_at).toLocaleDateString()}</span></div>
          <div><span className="block text-[10px] text-zinc-600">{t('keys.lastUsed')}</span><span className="mt-1 block text-zinc-400">{key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : t('keys.never')}</span></div>
        </div>
        <button type="button" onClick={() => openDelete(key)} className="focus-ring grid size-11 shrink-0 cursor-pointer place-items-center rounded-gold text-zinc-600 transition-colors hover:bg-coral-hostile/5 hover:text-coral-hostile" aria-label={t('keys.delete')} title={t('keys.delete')}><Trash2 size={17} /></button>
      </article>)}
    </div>}

    {createOpen && <ActionDialog title={created ? t('keys.createdTitle') : t('keys.createTitle')} description={created ? t('keys.oneTime') : t('keys.createDescription')} dismissible={!creating} onClose={closeCreate}>
      {created?.key ? <>
        <div className="break-all rounded-gold border border-green-resource/20 bg-green-resource/5 p-4 font-mono text-xs leading-6 text-green-resource">{created.key}</div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={closeCreate} className="secondary-button cursor-pointer px-5">{t('keys.close')}</button>
          <button type="button" onClick={() => void copy()} className="primary-button flex cursor-pointer items-center justify-center gap-2 px-5"><Copy size={16} />{copyStatus === 'copied' ? t('keys.copied') : t('keys.copy')}</button>
        </div>
        <div aria-live="polite" className="mt-3 min-h-5 text-right text-xs">
          {copyStatus === 'copied' && <span className="text-green-resource">{t('keys.copySuccess')}</span>}
          {copyStatus === 'failed' && <span className="text-coral-hostile">{t('keys.copyFailed')}</span>}
        </div>
      </> : <>
        {createError && <p role="alert" className="mb-4 text-sm text-coral-hostile">{createError}</p>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" disabled={creating} onClick={closeCreate} className="secondary-button cursor-pointer px-5">{t('common.cancel')}</button>
          <button type="button" disabled={creating} onClick={() => void create()} className="primary-button flex cursor-pointer items-center justify-center gap-2 px-5">{creating && <LoaderCircle className="animate-spin" size={16} />}{creating ? t('keys.creating') : t('keys.createConfirm')}</button>
        </div>
      </>}
    </ActionDialog>}

    {pendingDelete && <ActionDialog title={t('keys.deleteTitle')} description={t('keys.deleteDescription', { key: keyLabel(pendingDelete) })} dismissible={!deleting} onClose={closeDelete}>
      {deleteError && <p role="alert" className="mb-4 text-sm text-coral-hostile">{deleteError}</p>}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" disabled={deleting} onClick={closeDelete} className="secondary-button cursor-pointer px-5">{t('common.cancel')}</button>
        <button type="button" disabled={deleting} onClick={() => void remove()} className="focus-ring flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-gold bg-coral-hostile px-5 font-display text-sm font-semibold text-black transition-colors hover:bg-rose-300 disabled:cursor-not-allowed disabled:opacity-40">{deleting && <LoaderCircle className="animate-spin" size={16} />}{deleting ? t('keys.deleting') : t('keys.delete')}</button>
      </div>
    </ActionDialog>}
  </div>
}
