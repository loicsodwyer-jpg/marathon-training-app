import type { ReactNode } from 'react'

export type StatusTone = 'running' | 'strength' | 'success' | 'warning' | 'neutral' | 'race'

type StatusPillProps = {
  children: ReactNode
  tone?: StatusTone
  className?: string
}

const toneClassNames: Record<StatusTone, string> = {
  running:
    'border-blue-100 bg-blue-50 text-blue-700 dark:border-cyan-300/25 dark:bg-cyan-300/10 dark:text-cyan-200',
  strength:
    'border-purple-100 bg-purple-50 text-purple-700 dark:border-purple-300/25 dark:bg-purple-300/10 dark:text-purple-200',
  success:
    'border-green-100 bg-green-50 text-green-700 dark:border-emerald-300/25 dark:bg-emerald-300/10 dark:text-emerald-200',
  warning:
    'border-orange-100 bg-orange-50 text-orange-700 dark:border-orange-300/25 dark:bg-orange-300/10 dark:text-orange-200',
  neutral:
    'border-stone-200 bg-stone-100 text-stone-700 dark:border-white/10 dark:bg-white/[0.07] dark:text-neutral-200',
  race:
    'border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-300/25 dark:bg-rose-300/10 dark:text-rose-200',
}

function StatusPill({ children, tone = 'neutral', className = '' }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize ${toneClassNames[tone]} ${className}`}
    >
      {children}
    </span>
  )
}

export default StatusPill
