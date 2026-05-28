import type { ReactNode } from 'react'
import OfflineStatusBadge from './OfflineStatusBadge'
import SettingsButton from './SettingsButton'

type StickyTabHeaderProps = {
  title: string
  subtitle?: string
  meta?: ReactNode
  controls?: ReactNode
  onOpenSettings: () => void
  className?: string
}

function StickyTabHeader({
  className = '',
  controls,
  meta,
  onOpenSettings,
  subtitle,
  title,
}: StickyTabHeaderProps) {
  return (
    <header
      className={`sticky top-0 z-30 -mx-4 mb-5 border-b border-stone-200/80 bg-[#f4f1eb]/95 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.5rem)] backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-950/95 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-normal text-stone-950 dark:text-neutral-50">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-0.5 truncate text-sm leading-5 text-stone-500 dark:text-neutral-400">
              {subtitle}
            </p>
          ) : null}
          {meta ? <div className="mt-2 flex flex-wrap items-center gap-2">{meta}</div> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden min-[380px]:block">
            <OfflineStatusBadge />
          </div>
          <SettingsButton onClick={onOpenSettings} />
        </div>
      </div>
      {controls ? <div className="mt-3">{controls}</div> : null}
    </header>
  )
}

export default StickyTabHeader
