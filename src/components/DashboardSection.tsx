import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import PageCard from './PageCard'
import StatusPill, { type StatusTone } from './StatusPill'

type DashboardSectionProps = {
  title: string
  subtitle?: string
  icon: LucideIcon
  pill?: string
  tone?: StatusTone
  children: ReactNode
}

const iconClassNames: Record<StatusTone, string> = {
  running: 'bg-cyan-300/10 text-cyan-700 dark:text-cyan-200',
  strength: 'bg-purple-300/10 text-purple-700 dark:text-purple-200',
  success: 'bg-emerald-300/10 text-emerald-700 dark:text-emerald-200',
  warning: 'bg-orange-300/10 text-orange-700 dark:text-orange-200',
  neutral: 'bg-stone-100 text-stone-700 dark:bg-white/[0.07] dark:text-slate-200',
  race: 'bg-rose-300/10 text-rose-700 dark:text-rose-200',
}

function DashboardSection({
  title,
  subtitle,
  icon: Icon,
  pill,
  tone = 'neutral',
  children,
}: DashboardSectionProps) {
  return (
    <PageCard className="space-y-4">
      <div className="flex items-start gap-3">
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${iconClassNames[tone]}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-stone-950 dark:text-white">{title}</h2>
              {subtitle ? (
                <p className="mt-1 text-sm leading-5 text-stone-500 dark:text-slate-400">
                  {subtitle}
                </p>
              ) : null}
            </div>
            {pill ? <StatusPill tone={tone}>{pill}</StatusPill> : null}
          </div>
        </div>
      </div>
      {children}
    </PageCard>
  )
}

export default DashboardSection
