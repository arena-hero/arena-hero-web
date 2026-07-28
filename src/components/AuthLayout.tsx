import { BookOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, Outlet } from 'react-router'
import { LanguageToggle } from './LanguageToggle'
import { Logo } from './Logo'

export function AuthLayout() {
  const { t } = useTranslation()
  return <main className="auth-shell">
    <header className="auth-header">
      <Link to="/" className="focus-ring rounded-gold-sm" aria-label={t('auth.backHome')}><Logo /></Link>
      <div className="flex items-center gap-1 sm:gap-2">
        <a href="https://doc.arenahero.io/" target="_blank" rel="noopener noreferrer" className="focus-ring flex min-h-11 items-center gap-2 rounded-gold px-3 text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100"><BookOpen size={17} aria-hidden="true" />{t('nav.documentation')}</a>
        <LanguageToggle />
      </div>
    </header>
    <section className="auth-story" aria-label={t('auth.storyLabel')}>
      <div className="auth-story-copy">
        <h2>{t('auth.storyTitle')}</h2>
        <p>{t('auth.storyBody')}</p>
      </div>
      <div className="auth-story-media">
        <img src="/assets/marketing/arena-gameplay.jpg" alt={t('auth.storyAlt')} width="1020" height="720" fetchPriority="high" />
      </div>
    </section>
    <section className="auth-form-region"><Outlet /></section>
  </main>
}
