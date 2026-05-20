import type { PlanBadgeTone } from '../types/planView'

type PlanWorkoutBadgeProps = {
  label: string
  tone?: PlanBadgeTone
}

const classNameByTone: Record<PlanBadgeTone, string> = {
  running:
    'border-cyan-300/25 bg-cyan-300/10 text-cyan-700 dark:text-cyan-200',
  strength:
    'border-purple-300/25 bg-purple-300/10 text-purple-700 dark:text-purple-200',
  success:
    'border-emerald-300/25 bg-emerald-300/10 text-emerald-700 dark:text-emerald-200',
  warning:
    'border-orange-300/25 bg-orange-300/10 text-orange-700 dark:text-orange-200',
  neutral:
    'border-stone-200 bg-stone-100 text-stone-700 dark:border-white/10 dark:bg-white/[0.07] dark:text-slate-200',
  race:
    'border-rose-300/25 bg-rose-300/10 text-rose-700 dark:text-rose-200',
}

function PlanWorkoutBadge({ label, tone = 'neutral' }: PlanWorkoutBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${classNameByTone[tone]}`}
    >
      {label}
    </span>
  )
}

export default PlanWorkoutBadge
