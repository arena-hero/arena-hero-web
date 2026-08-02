import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { LanguageToggle } from '../components/LanguageToggle'
import { Logo } from '../components/Logo'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import type { Leaderboard, LeaderboardEntry } from '../lib/types'

type Metric = keyof Leaderboard

const metrics: Metric[] = ['beacon_ticks_held', 'damage_dealt', 'core_destruction_participations']

function RankingTable({ metric, entries }: { metric: Metric; entries: LeaderboardEntry[] }) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.startsWith('zh') ? 'zh-CN' : 'en-US'

  return <section className="leaderboard-board" data-metric={metric}>
    <h2>{t(`leaderboard.metrics.${metric}`)}</h2>
    <div className="leaderboard-columns" aria-hidden="true">
      <span>{t('leaderboard.rank')}</span>
      <span>{t('leaderboard.player')}</span>
      <span>{t('leaderboard.score')}</span>
    </div>
    {entries.length === 0
      ? <p className="leaderboard-empty">{t('leaderboard.empty')}</p>
      : <ol className="leaderboard-rows">
          {entries.map((entry) => <li key={entry.username}>
            <span className="leaderboard-rank">{entry.rank}</span>
            <span className="leaderboard-player">@{entry.username}</span>
            <strong>{entry.score.toLocaleString(locale)}</strong>
          </li>)}
        </ol>}
  </section>
}

function LoadingBoard() {
  return <section className="leaderboard-board leaderboard-loading" aria-hidden="true">
    <span className="leaderboard-loading-title" />
    {Array.from({ length: 8 }, (_, index) => <span className="leaderboard-loading-row" key={index} />)}
  </section>
}

export function LeaderboardPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null)
  const [activeMetric, setActiveMetric] = useState<Metric>('beacon_ticks_held')
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    try {
      const next = await api.leaderboard()
      setLeaderboard(next)
      setError(false)
    } catch {
      setError(true)
    }
  }, [])

  useEffect(() => {
    void load()
    const interval = window.setInterval(() => void load(), 30_000)
    return () => window.clearInterval(interval)
  }, [load])

  const primaryHref = user ? '/arena' : '/login'
  const primaryLabel = user ? t('landing.actions.enterArena') : t('landing.actions.signIn')

  return <main className="leaderboard-page">
    <header className="landing-header">
      <div className="landing-container flex h-full items-center justify-between gap-4">
        <Link to="/" className="focus-ring rounded-gold-sm" aria-label={t('brand')}><Logo /></Link>
        <div className="flex items-center gap-1 sm:gap-3">
          <LanguageToggle minimal className="sm:[&>span]:not-sr-only" />
          <Link to={primaryHref} className="landing-header-cta">{primaryLabel}</Link>
        </div>
      </div>
    </header>

    <div className="leaderboard-shell">
      <header className="leaderboard-heading">
        <h1>{t('leaderboard.title')}</h1>
        <p>{t('leaderboard.subtitle')}</p>
      </header>

      {error && !leaderboard
        ? <div className="leaderboard-error" role="alert">
            <p>{t('leaderboard.unavailable')}</p>
            <button type="button" onClick={() => void load()}>{t('common.retry')}</button>
          </div>
        : <>
            <div className="leaderboard-tabs" role="tablist" aria-label={t('leaderboard.title')}>
              {metrics.map((metric) => <button
                type="button"
                role="tab"
                aria-selected={activeMetric === metric}
                key={metric}
                onClick={() => setActiveMetric(metric)}
              >{t(`leaderboard.metrics.${metric}`)}</button>)}
            </div>
            <div className="leaderboard-grid">
              {leaderboard
                ? metrics.map((metric) => <div className="leaderboard-board-wrap" data-active={activeMetric === metric} key={metric}><RankingTable metric={metric} entries={leaderboard[metric]} /></div>)
                : metrics.map((metric) => <div className="leaderboard-board-wrap" data-active={activeMetric === metric} key={metric}><LoadingBoard /></div>)}
            </div>
            {error && leaderboard && <p className="leaderboard-refresh-error" role="status">{t('leaderboard.refreshFailed')}</p>}
          </>}
    </div>
  </main>
}
