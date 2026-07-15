import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function LanguageToggle({ minimal = false, className = '' }: { minimal?: boolean; className?: string }) {
  const { i18n, t } = useTranslation()
  const next = i18n.resolvedLanguage === 'zh' ? 'en' : 'zh'
  return <button type="button" onClick={() => void i18n.changeLanguage(next)} aria-label={t('common.language')} className={`focus-ring flex min-h-11 items-center gap-2 rounded-gold px-3 text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100 ${className}`}>
    <Languages size={17} aria-hidden="true" /><span className={minimal ? 'sr-only' : ''}>{next === 'zh' ? '中文' : 'EN'}</span>
  </button>
}
