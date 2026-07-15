import { Check, ExternalLink, GitFork } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

type LinkStatus = 'idle' | 'opened' | 'linked' | 'blocked'

export function GitHubLinkDialogContent() {
  const { t } = useTranslation()
  const [status, setStatus] = useState<LinkStatus>('idle')

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.data?.type === 'arena-hero:github-linked') setStatus('linked')
    }
    window.addEventListener('message', receive)
    return () => window.removeEventListener('message', receive)
  }, [])

  const link = () => {
    const popup = window.open('/api/v1/auth/github/link/start', 'arena-hero-github-link', 'popup,width=720,height=760,left=160,top=80')
    setStatus(popup ? 'opened' : 'blocked')
  }

  return <div className="mx-auto max-w-lg py-3 text-center sm:py-8">
    <div className="mx-auto grid size-16 place-items-center rounded-gold-lg border border-white/10 bg-white/[.035] text-zinc-100"><GitFork size={26} /></div>
    <h3 className="mt-6 font-display text-xl font-semibold">{t('auth.githubLinkTitle')}</h3>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">{t('auth.githubLinkDescription')}</p>
    {status === 'linked' ? <div role="status" className="mt-6 flex items-center justify-center gap-2 text-sm text-green-resource"><Check size={17} />{t('auth.githubLinkSuccess')}</div> : <button type="button" onClick={link} className="primary-button mx-auto mt-6 flex items-center justify-center gap-2"><ExternalLink size={16} />{t('auth.githubLinkAction')}</button>}
    {status === 'opened' && <p role="status" className="mt-3 text-xs text-zinc-500">{t('auth.githubLinkOpened')}</p>}
    {status === 'blocked' && <p role="alert" className="mt-3 text-xs text-coral-hostile">{t('auth.popupBlocked')}</p>}
  </div>
}
