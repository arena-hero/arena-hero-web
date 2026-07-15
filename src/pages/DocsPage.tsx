import { ArrowLeft, Check, Clipboard, Copy, LoaderCircle, TriangleAlert } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { apiDocsContent, apiReferenceMarkdown, docsUiContent, gameRulesMarkdown } from '../content/apiDocs'
import { rulesContent } from '../content/rules'

type CopyStatus = 'idle' | 'copying' | 'copied' | 'failed'

function legacyCopy(text: string) {
  if (typeof document.execCommand !== 'function') return false
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.readOnly = true
  textarea.setAttribute('aria-hidden', 'true')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  textarea.style.pointerEvents = 'none'
  document.body.appendChild(textarea)
  textarea.select()
  const copied = document.execCommand('copy')
  textarea.remove()
  return copied
}

async function copyText(text: string) {
  const legacyCopied = legacyCopy(text)
  if (!navigator.clipboard?.writeText) return legacyCopied
  try {
    await Promise.race([
      navigator.clipboard.writeText(text),
      new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error('Clipboard timeout')), 600)),
    ])
    return true
  } catch {
    return legacyCopied
  }
}

function MarkdownCopyButton({ markdown, label, copyingLabel, copiedLabel, failedLabel }: { markdown: string; label: string; copyingLabel: string; copiedLabel: string; failedLabel: string }) {
  const [status, setStatus] = useState<CopyStatus>('idle')

  useEffect(() => setStatus('idle'), [markdown])

  const copy = async () => {
    setStatus('copying')
    setStatus(await copyText(markdown) ? 'copied' : 'failed')
  }

  const currentLabel = status === 'copied' ? copiedLabel : status === 'failed' ? failedLabel : status === 'copying' ? copyingLabel : label

  return <button type="button" disabled={status === 'copying'} onClick={() => void copy()} aria-label={currentLabel} title={currentLabel} className="focus-ring grid size-11 shrink-0 place-items-center rounded-gold text-zinc-500 transition-colors hover:bg-white/[.05] hover:text-zinc-100 disabled:cursor-wait disabled:opacity-60" aria-live="polite">
    {status === 'copied' ? <Check size={16} className="text-green-resource" /> : status === 'failed' ? <TriangleAlert size={16} className="text-coral-hostile" /> : status === 'copying' ? <LoaderCircle size={16} className="animate-spin" /> : <Copy size={16} />}
  </button>
}

function Bullets({ items }: { items: string[] }) {
  return <ul className="mt-6 max-w-4xl space-y-3">
    {items.map((item) => <li key={item} className="flex gap-3 text-sm leading-6 text-zinc-400 sm:text-[15px] sm:leading-7">
      <span className="mt-[.68rem] size-1.5 shrink-0 rounded-full bg-cyan-signal/70" aria-hidden="true" />
      <span>{item}</span>
    </li>)}
  </ul>
}

export function DocsPage() {
  const { i18n } = useTranslation()
  const language = i18n.resolvedLanguage?.startsWith('zh') ? 'zh' : 'en'
  const ui = docsUiContent[language]
  const rules = rulesContent[language]
  const api = apiDocsContent[language]
  const rulesMarkdown = useMemo(() => gameRulesMarkdown(ui, rules), [rules, ui])
  const apiMarkdown = useMemo(() => apiReferenceMarkdown(api), [api])
  const allSectionIds = useMemo(() => [...rules.sections.map(({ id }) => id), ...api.sections.map(({ id }) => id)], [api.sections, rules.sections])
  const [activeSection, setActiveSection] = useState(allSectionIds[0])

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
      if (visible) setActiveSection(visible.target.id)
    }, { rootMargin: '-15% 0px -72% 0px' })
    allSectionIds.forEach((id) => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })
    return () => observer.disconnect()
  }, [allSectionIds])

  const rulesActive = rules.sections.some(({ id }) => id === activeSection)

  return <div className="relative min-h-dvh">
    <div className="mx-auto w-full max-w-[1380px] px-4 pb-24 sm:px-6 lg:px-8">
      <header className="flex min-h-20 items-center pr-52 sm:pr-56">
        <Link to="/arena" className="focus-ring rounded-gold-sm" aria-label="Arena Hero">
          <span className="sm:hidden"><Logo compact /></span>
          <span className="hidden sm:block"><Logo /></span>
        </Link>
      </header>

      <section className="border-b border-white/10 pb-12 pt-8 sm:pb-16 sm:pt-14">
        <Link to="/arena" className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-gold-sm pr-2 text-sm text-zinc-400 transition-colors hover:text-cyan-signal">
          <ArrowLeft size={15} />{ui.back}
        </Link>
        <div className="mt-8">
          <div>
            <p className="eyebrow text-cyan-signal/80">{ui.eyebrow}</p>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-[-.035em] text-zinc-50 sm:text-6xl lg:text-7xl">{ui.title}</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg sm:leading-8">{ui.subtitle}</p>
          </div>
        </div>

      </section>

      <div className="grid gap-10 pt-10 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-14 lg:pt-14">
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <nav aria-label={ui.contents}>
            <p className="eyebrow px-3">{ui.contents}</p>
            <a href="#game-rules" className={`focus-ring mt-4 flex min-h-10 items-center border-l px-3 font-display text-sm font-semibold transition-colors ${rulesActive ? 'border-cyan-signal text-zinc-100' : 'border-white/10 text-zinc-500 hover:text-zinc-200'}`}>01 · {ui.rulesTitle}</a>
            <div className="mt-1 hidden lg:block">
              {rules.sections.map((section) => <a key={section.id} href={`#${section.id}`} aria-current={activeSection === section.id ? 'location' : undefined} className={`focus-ring flex min-h-9 items-center border-l px-3 text-xs transition-colors ${activeSection === section.id ? 'border-cyan-signal text-cyan-signal' : 'border-white/10 text-zinc-600 hover:text-zinc-300'}`}>{section.title}</a>)}
            </div>
            <a href="#api-reference" className={`focus-ring mt-5 flex min-h-10 items-center border-l px-3 font-display text-sm font-semibold transition-colors ${!rulesActive ? 'border-cyan-signal text-zinc-100' : 'border-white/10 text-zinc-500 hover:text-zinc-200'}`}>02 · {ui.apiTitle}</a>
            <div className="mt-1 hidden lg:block">
              {api.sections.map((section) => <a key={section.id} href={`#${section.id}`} aria-current={activeSection === section.id ? 'location' : undefined} className={`focus-ring flex min-h-9 items-center border-l px-3 text-xs transition-colors ${activeSection === section.id ? 'border-cyan-signal text-cyan-signal' : 'border-white/10 text-zinc-600 hover:text-zinc-300'}`}>{section.title}</a>)}
            </div>
          </nav>
        </aside>

        <article className="min-w-0">
          <section id="game-rules" className="scroll-mt-8">
            <div>
              <p className="eyebrow text-cyan-signal/80">{ui.part} 01</p>
              <div className="mt-3 flex items-center gap-2">
                <h2 className="font-display text-3xl font-semibold tracking-[-.025em] text-zinc-100 sm:text-4xl">{ui.rulesTitle}</h2>
                <MarkdownCopyButton markdown={rulesMarkdown} label={ui.copyRules} copyingLabel={ui.copying} copiedLabel={ui.copied} failedLabel={ui.copyFailed} />
              </div>
              <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-400">{ui.rulesSubtitle}</p>
            </div>
            <blockquote className="mt-8 max-w-4xl border-l-2 border-cyan-signal/70 pl-5 text-sm leading-7 text-zinc-300">
              <span className="font-semibold text-zinc-100">{rules.authorityLabel}.</span> {rules.authority}
            </blockquote>

            <div className="mt-12">
              {rules.sections.map((section) => <section key={section.id} id={section.id} className="scroll-mt-8 border-t border-white/10 py-10 sm:py-12">
                <div className="grid gap-3 sm:grid-cols-[52px_minmax(0,1fr)]">
                  <span className="font-mono text-xs text-cyan-signal">{section.number}</span>
                  <div>
                    <h3 className="font-display text-2xl font-semibold tracking-[-.02em] text-zinc-100 sm:text-3xl">{section.title}</h3>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400 sm:text-base sm:leading-7">{section.summary}</p>
                    {section.cards && <div className="mt-7 overflow-x-auto border-y border-white/10">
                      <table className="w-full min-w-[720px] text-left text-sm">
                        <thead className="text-[10px] uppercase tracking-[.14em] text-zinc-600"><tr>{ui.unitTable.map((header) => <th key={header} className="px-3 py-4 font-medium">{header}</th>)}</tr></thead>
                        <tbody className="divide-y divide-white/[.07]">{section.cards.map((unit) => <tr key={unit.name}><th className="px-3 py-4 font-display font-semibold text-zinc-200">{unit.name}</th><td className="px-3 py-4 font-mono text-xs text-zinc-500">{unit.stats.join(' · ')}</td><td className="px-3 py-4 font-mono text-xs text-cyan-signal">{unit.actions}</td><td className="max-w-sm px-3 py-4 leading-6 text-zinc-400">{unit.description}</td></tr>)}</tbody>
                      </table>
                    </div>}
                    <Bullets items={section.bullets} />
                    {section.callout && <blockquote className="mt-7 max-w-3xl border-l border-cyan-signal/50 pl-4 font-mono text-xs leading-6 text-zinc-400"><span className="font-semibold text-cyan-signal">{section.callout.label}</span><br />{section.callout.text}</blockquote>}
                  </div>
                </div>
              </section>)}
            </div>
          </section>

          <section id="api-reference" className="scroll-mt-8 border-t border-white/20 pt-16 sm:pt-20">
            <div>
              <p className="eyebrow text-green-resource/80">{ui.part} 02</p>
              <div className="mt-3 flex items-center gap-2">
                <h2 className="font-display text-3xl font-semibold tracking-[-.025em] text-zinc-100 sm:text-4xl">{api.title}</h2>
                <MarkdownCopyButton markdown={apiMarkdown} label={ui.copyApi} copyingLabel={ui.copying} copiedLabel={ui.copied} failedLabel={ui.copyFailed} />
              </div>
              <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-400">{api.subtitle}</p>
            </div>

            <div className="mt-12">
              {api.sections.map((section, index) => <section key={section.id} id={section.id} className="scroll-mt-8 border-t border-white/10 py-10 sm:py-12">
                <div className="grid gap-3 sm:grid-cols-[52px_minmax(0,1fr)]">
                  <span className="font-mono text-xs text-green-resource">{String(index + 1).padStart(2, '0')}</span>
                  <div className="min-w-0">
                    <h3 className="break-words font-display text-2xl font-semibold tracking-[-.02em] text-zinc-100 sm:text-3xl">{section.title}</h3>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400 sm:text-base sm:leading-7">{section.summary}</p>
                    {section.paragraphs?.map((paragraph) => <p key={paragraph} className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400">{paragraph}</p>)}
                    {section.bullets && <Bullets items={section.bullets} />}
                    {section.table && <div className="mt-7 overflow-x-auto border-y border-white/10">
                      <table className="w-full min-w-[680px] text-left text-sm">
                        <thead className="text-[10px] uppercase tracking-[.14em] text-zinc-600"><tr>{section.table.headers.map((header) => <th key={header} className="px-3 py-4 font-medium">{header}</th>)}</tr></thead>
                        <tbody className="divide-y divide-white/[.07]">{section.table.rows.map((row) => <tr key={row.join(':')}>{row.map((cell, cellIndex) => <td key={`${cellIndex}:${cell}`} className={`px-3 py-3.5 ${cellIndex === 0 ? 'font-mono text-xs font-semibold text-green-resource' : cellIndex === 1 ? 'font-mono text-xs text-zinc-300' : 'text-zinc-400'}`}>{cell}</td>)}</tr>)}</tbody>
                      </table>
                    </div>}
                    {section.codeBlocks?.map((block) => <figure key={block.label} className="mt-7 min-w-0">
                      <figcaption className="mb-3 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[.14em] text-zinc-600"><Clipboard size={13} />{block.label}</figcaption>
                      <pre className="max-w-full overflow-x-auto border-y border-white/10 bg-white/[.025] px-4 py-5 text-xs leading-6 text-zinc-300"><code>{block.code}</code></pre>
                    </figure>)}
                  </div>
                </div>
              </section>)}
            </div>
          </section>
        </article>
      </div>
    </div>
  </div>
}
