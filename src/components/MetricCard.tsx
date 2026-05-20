import { toneStyles, type AppTone } from '../config/theme'

type MetricCardProps = {
  label: string
  value: string
  subtitle?: string
  tone?: AppTone
}

function MetricCard({ label, value, subtitle, tone = 'neutral' }: MetricCardProps) {
  return (
    <div className={`rounded-[22px] border p-4 ${toneStyles[tone].card}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-stone-500 dark:text-slate-400">
          {label}
        </p>
        <span className={`h-2.5 w-2.5 rounded-full ${toneStyles[tone].bar}`} />
      </div>
      <p className="text-2xl font-semibold leading-none text-stone-950 dark:text-white">{value}</p>
      {subtitle ? (
        <p className="mt-2 text-sm leading-5 text-stone-600 dark:text-slate-400">{subtitle}</p>
      ) : null}
    </div>
  )
}

export default MetricCard
