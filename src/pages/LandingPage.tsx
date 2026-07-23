import { ArrowRight, Bot, ChevronRight, Crosshair } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { LanguageToggle } from '../components/LanguageToggle'
import { Logo } from '../components/Logo'
import { useAuth } from '../context/AuthContext'

const units = [
  { key: 'core', art: '/assets/units/neo-expressionist/sprites/core.png' },
  { key: 'worker', art: '/assets/units/neo-expressionist/sprites/worker.png' },
  { key: 'vanguard', art: '/assets/units/neo-expressionist/sprites/vanguard.png' },
  { key: 'ranger', art: '/assets/units/neo-expressionist/sprites/ranger.png' },
] as const

export function LandingPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const primaryHref = user ? '/arena' : '/register'
  const primaryLabel = user ? t('landing.actions.enterArena') : t('landing.actions.createAccount')

  return <main className="landing-page">
    <header className="landing-header">
      <div className="landing-container flex h-full items-center justify-between gap-4">
        <Link to="/" className="focus-ring rounded-gold-sm" aria-label={t('brand')}><Logo /></Link>
        <nav className="landing-nav" aria-label={t('landing.nav.label')}>
          <a href="#gameplay">{t('landing.nav.gameplay')}</a>
          <a href="#fleet">{t('landing.nav.fleet')}</a>
          <a href="#beacon">{t('landing.nav.beacon')}</a>
          <a href="#agent">{t('landing.nav.agent')}</a>
        </nav>
        <div className="flex items-center gap-1 sm:gap-3">
          <LanguageToggle minimal className="sm:[&>span]:not-sr-only" />
          <Link to={primaryHref} className="landing-header-cta">{primaryLabel}<ChevronRight size={15} aria-hidden="true" /></Link>
        </div>
      </div>
    </header>

    <section className="landing-hero landing-container">
      <div className="landing-hero-copy">
        <h1>{t('landing.hero.title')}</h1>
        <p>{t('landing.hero.body')}</p>
        <div className="flex flex-wrap gap-3">
          <Link to={primaryHref} className="landing-primary-cta">{primaryLabel}<ArrowRight size={17} aria-hidden="true" /></Link>
          {!user && <Link to="/login" className="landing-secondary-cta">{t('landing.actions.signIn')}</Link>}
        </div>
      </div>
      <div className="landing-hero-visual" aria-label={t('landing.hero.visualLabel')}>
        <div className="landing-image-frame">
          <img src="/assets/landing/arena-gameplay.jpg" alt={t('landing.hero.visualAlt')} width="1020" height="720" fetchPriority="high" />
        </div>
      </div>
    </section>

    <section className="landing-manifesto landing-container landing-reveal">
      <p>{t('landing.intro.kicker')}</p>
      <h2>{t('landing.intro.title')}</h2>
      <span>{t('landing.intro.body')}</span>
    </section>

    <section id="gameplay" className="landing-section landing-container landing-tick-section">
      <div className="landing-tick-number landing-reveal" aria-hidden="true"><strong>15</strong><span>SEC</span></div>
      <div className="landing-tick-content landing-reveal">
        <h2>{t('landing.tick.title')}</h2>
        <p>{t('landing.tick.body')}</p>
        <div className="landing-tick-flow">
          {(['observe', 'command', 'resolve'] as const).map((key) => <div key={key}>
            <h3>{t(`landing.tick.${key}.title`)}</h3>
            <p>{t(`landing.tick.${key}.body`)}</p>
          </div>)}
        </div>
      </div>
    </section>

    <section id="fleet" className="landing-section landing-container">
      <div className="landing-section-heading landing-reveal">
        <h2>{t('landing.fleet.title')}</h2>
        <p>{t('landing.fleet.body')}</p>
      </div>
      <div className="landing-fleet-grid landing-reveal">
        {units.map((unit, index) => <article key={unit.key} className={`landing-unit landing-unit-${unit.key}`}>
          <img src={unit.art} alt="" width="256" height="256" loading={index > 1 ? 'lazy' : 'eager'} />
          <div><h3>{t(`landing.fleet.${unit.key}.title`)}</h3><p>{t(`landing.fleet.${unit.key}.body`)}</p></div>
        </article>)}
      </div>
    </section>

    <section id="beacon" className="landing-beacon-section">
      <div className="landing-container landing-beacon-layout">
        <div className="landing-beacon-art landing-reveal">
          <span className="landing-beacon-orbit" aria-hidden="true" />
          <img src="/assets/beacon/neo-expressionist/sprites/champion-beacon.png" alt={t('landing.beacon.alt')} width="256" height="256" loading="lazy" />
        </div>
        <div className="landing-beacon-copy landing-reveal">
          <Crosshair size={22} aria-hidden="true" />
          <h2>{t('landing.beacon.title')}</h2>
          <p>{t('landing.beacon.body')}</p>
          <strong>{t('landing.beacon.bonus')}</strong>
        </div>
      </div>
    </section>

    <section id="agent" className="landing-section landing-container landing-agent-section">
      <div className="landing-agent-copy landing-reveal">
        <Bot size={24} aria-hidden="true" />
        <h2>{t('landing.agent.title')}</h2>
        <p>{t('landing.agent.body')}</p>
      </div>
      <div className="landing-protocol landing-reveal" aria-label={t('landing.agent.protocolLabel')}>
        <div><span>EVENT</span><code>tick</code><p>{t('landing.agent.tick')}</p></div>
        <div><span>EVENT</span><code>state</code><p>{t('landing.agent.state')}</p></div>
        <div><span>POST</span><code>/api/v1/game/commands</code><p>{t('landing.agent.commands')}</p></div>
        <div><span>EVENT</span><code>received</code><p>{t('landing.agent.received')}</p></div>
      </div>
    </section>

    <section className="landing-final landing-container landing-reveal">
      <div><h2>{t('landing.final.title')}</h2><p>{t('landing.final.body')}</p></div>
      <Link to={primaryHref} className="landing-primary-cta">{primaryLabel}<ArrowRight size={17} aria-hidden="true" /></Link>
    </section>

    <footer className="landing-footer landing-container">
      <Logo compact />
      <p>{t('landing.footer')}</p>
      {!user && <Link to="/login">{t('landing.actions.signIn')}</Link>}
    </footer>
  </main>
}
