import { ChevronRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { SettingsPageId } from '../types/settings'

type SettingsRowProps = {
  badge?: string
  icon: LucideIcon
  iconClassName?: string
  onSelect: (page: SettingsPageId) => void
  page: SettingsPageId
  subtitle: string
  title: string
}

function SettingsRow({
  badge,
  icon: Icon,
  iconClassName = 'bg-stone-100 text-stone-700 dark:bg-white/[0.07] dark:text-slate-200',
  onSelect,
  page,
  subtitle,
  title,
}: SettingsRowProps) {
  return (
    <button
      className="flex min-h-[72px] w-full items-center gap-3 border-b border-stone-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-stone-50 dark:border-white/10 dark:hover:bg-white/[0.05]"
      onClick={() => onSelect(page)}
      type="button"
    >
      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-[16px] ${iconClassName}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-stone-950 dark:text-white">{title}</p>
          {badge ? (
            <span className="shrink-0 rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-stone-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300">
              {badge}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 line-clamp-2 text-sm leading-5 text-stone-500 dark:text-slate-400">
          {subtitle}
        </p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-stone-400 dark:text-slate-600" aria-hidden="true" />
    </button>
  )
}

export default SettingsRow
