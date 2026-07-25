import { useTranslation } from 'react-i18next'
import { Link, Outlet } from 'react-router'
import { LanguageToggle } from './LanguageToggle'
import { Logo } from './Logo'

export function AuthLayout() {
  const { t } = useTranslation()
  return <main className="auth-shell">
    <header className="auth-header">
      <Link to="/" className="focus-ring rounded-gold-sm" aria-label={t('auth.backHome')}><Logo /></Link>
      <LanguageToggle />
    </header>
    <section className="auth-story" aria-label={t('auth.storyLabel')}>
      <div className="auth-story-copy">
        <h2>{t('auth.storyTitle')}</h2>
        <p>{t('auth.storyBody')}</p>
      </div>
      <div className="auth-story-media">
        <img src="/assets/landing/arena-gameplay.jpg" alt={t('auth.storyAlt')} width="1020" height="720" fetchPriority="high" />
      </div>
    </section>
    <section className="auth-form-region"><Outlet /></section>
  </main>
}
