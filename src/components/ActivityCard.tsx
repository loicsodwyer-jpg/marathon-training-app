import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import StatusPill, { type StatusTone } from './StatusPill'

type ActivityCardProps = {
  title: string
  subtitle?: string
  icon: LucideIcon
  tone?: StatusTone
  pill?: string
  children: ReactNode
}

const iconClassNames: Record<StatusTone, string> = {
  running: 'bg-blue-50 text-blue-700 ring-blue-100 dark:bg-cyan-400/12 dark:text-cyan-300 dark:ring-cyan-300/20',
  strength:
    'bg-purple-50 text-purple-700 ring-purple-100 dark:bg-purple-400/12 dark:text-purple-300 dark:ring-purple-300/20',
  success:
    'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-400/12 dark:text-emerald-300 dark:ring-emerald-300/20',
  warning:
    'bg-orange-50 text-orange-700 ring-orange-100 dark:bg-orange-400/12 dark:text-orange-300 dark:ring-orange-300/20',
  neutral:
    'bg-stone-100 text-stone-700 ring-stone-200 dark:bg-slate-400/12 dark:text-slate-300 dark:ring-white/10',
  race: 'bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-400/12 dark:text-rose-300 dark:ring-rose-300/20',
}

function ActivityCard({
  title,
  subtitle,
  icon: Icon,
  tone = 'neutral',
  pill,
  children,
}: ActivityCardProps) {
  return (
    <section className="rounded-[24px] border border-stone-200 bg-white p-4 shadow-[0_18px_45px_rgba(49,55,70,0.07)] dark:border-white/10 dark:bg-slate-900/85 dark:shadow-[0_22px_70px_rgba(0,0,0,0.35)]">
      <div className="mb-4 flex items-start gap-3">
        <div
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-[18px] ring-1 ${iconClassNames[tone]}`}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-stone-950 dark:text-white">{title}</h2>
              {subtitle ? (
                <p className="mt-1 text-sm leading-5 text-stone-500 dark:text-slate-400">
                  {subtitle}
                </p>
              ) : null}
            </div>
            {pill ? (
              <StatusPill tone={tone} className="shrink-0">
                {pill}
              </StatusPill>
            ) : null}
          </div>
        </div>
      </div>
      {children}
    </section>
  )
}

export default ActivityCard
