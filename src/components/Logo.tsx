export function Logo({ compact = false }: { compact?: boolean }) {
  return <div className="flex items-center gap-3" aria-label="Arena Hero">
    <svg viewBox="0 0 40 40" className="h-9 w-9 shrink-0" aria-hidden="true">
      <path d="M20 3 34.7 11.5v17L20 37 5.3 28.5v-17L20 3Z" fill="none" stroke="#4591c5" strokeWidth="1.4" />
      <path d="m20 9 8.8 20H24l-1.5-4.1h-5L16 29h-4.8L20 9Zm0 7-1.4 4.3h2.8L20 16Z" fill="#eef5ff" />
    </svg>
    {!compact && <span className="font-display text-sm font-bold tracking-[.18em] text-zinc-100">ARENA HERO</span>}
  </div>
}
