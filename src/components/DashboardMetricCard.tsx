import type { LucideIcon } from 'lucide-react'
import type { StatusTone } from './StatusPill'

type DashboardMetricCardProps = {
  icon: LucideIcon
  label: string
  value: string
  subtitle?: string
  tone?: StatusTone
}

const toneClassNames: Record<StatusTone, string> = {
  running: 'border-cyan-300/20 bg-cyan-300/10 text-cyan-200',
  strength: 'border-purple-300/20 bg-purple-300/10 text-purple-200',
  success: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200',
  warning: 'border-orange-300/20 bg-orange-300/10 text-orange-200',
  neutral: 'border-white/10 bg-white/[0.06] text-slate-200',
  race: 'border-rose-300/20 bg-rose-300/10 text-rose-200',
}

function DashboardMetricCard({
  icon: Icon,
  label,
  value,
  subtitle,
  tone = 'neutral',
}: DashboardMetricCardProps) {
  return (
    <div className="rounded-[22px] border border-stone-200 bg-white p-4 shadow-[0_18px_45px_rgba(49,55,70,0.06)] dark:border-white/10 dark:bg-neutral-900/85 dark:shadow-[0_22px_70px_rgba(0,0,0,0.28)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-stone-500 dark:text-neutral-400">
          {label}
        </p>
        <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-[14px] border ${toneClassNames[tone]}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>
      <p className="text-2xl font-semibold leading-none text-stone-950 dark:text-white">{value}</p>
      {subtitle ? (
        <p className="mt-2 text-sm leading-5 text-stone-600 dark:text-neutral-400">{subtitle}</p>
      ) : null}
    </div>
  )
}

export default DashboardMetricCard
